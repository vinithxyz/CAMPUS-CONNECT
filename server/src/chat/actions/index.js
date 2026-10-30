import { z } from 'zod';
import Building from '../../models/Building.js';
import Report, { CATEGORIES, PRIORITIES, STATUSES } from '../../models/Report.js';
import ChatAttachment from '../../models/ChatAttachment.js';
import PendingAction from '../../models/PendingAction.js';
import ReportSupport from '../../models/ReportSupport.js';
import User from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import * as ra from '../../services/reportActions.js';
import * as aa from '../../services/adminReportActions.js';

const oid = z.string().regex(/^[a-f\d]{24}$/i);
const reportId = z.string().regex(/^CP\d{4,}$/i);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const findBuildingByName = async (name) => {
  const b = await Building.findOne({ name: new RegExp(`^${esc(name)}$`, 'i') }).lean();
  if (!b) throw new ApiError(400, `No building named "${name}". Ask the student to choose a listed building.`);
  return b;
};

/** Attachments must belong to the user and be unused. */
export async function loadOwnedAttachments(user, ids = []) {
  if (!ids || !ids.length) return [];
  const docs = await ChatAttachment.find({ _id: { $in: ids }, user: user._id, used: false });
  if (docs.length !== new Set(ids).size) {
    throw new ApiError(400, 'One or more photos are no longer available. Please attach them again.');
  }
  return docs;
}

const markUsed = (atts) => {
  if (!atts || !atts.length) return Promise.resolve();
  return ChatAttachment.updateMany({ _id: { $in: atts.map((a) => a._id) } }, { used: true });
};

const draftSchema = z.object({
  category: z.enum(CATEGORIES),
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(10).max(2000),
  originalDescription: z.string().trim().max(2000).optional(),
  building: oid,
  room: z.string().trim().min(1).max(100),
  priority: z.enum(PRIORITIES).default('medium'),
  lat: z.number(),
  lng: z.number(),
  attachmentIds: z.array(oid).max(5).default([]),
});

const overridesSchema = draftSchema
  .pick({
    category: true,
    title: true,
    description: true,
    building: true,
    room: true,
    priority: true,
    attachmentIds: true,
  })
  .partial();

export const actions = {
  'report.create': {
    roles: ['student'],
    input: z.object({
      category: z.enum(CATEGORIES),
      title: z.string(),
      description: z.string(),
      originalDescription: z.string().optional(),
      building: z.string(),
      room: z.string(),
      priority: z.enum(PRIORITIES).optional(),
      attachmentIds: z.array(oid).max(5).default([]),
    }),
    async prepare(user, i) {
      const b = await findBuildingByName(i.building);
      const atts = await loadOwnedAttachments(user, i.attachmentIds);
      const payload = draftSchema.parse({
        ...i,
        building: String(b._id),
        lat: b.location.coordinates[1],
        lng: b.location.coordinates[0],
        attachmentIds: atts.map((a) => String(a._id)),
      });
      return {
        payload,
        summary: {
          title: 'Submit this report?',
          editable: true,
          confirmLabel: 'Submit report',
          notice:
            'Priority is suggested by the assistant. You decide. The map pin uses the building location; you can fine-tune it later.',
          fields: [
            { label: 'Category', value: payload.category },
            { label: 'Title', value: payload.title },
            { label: 'Description', value: payload.description },
            { label: 'Building', value: b.name },
            { label: 'Room', value: payload.room },
            { label: 'Priority', value: payload.priority },
          ],
          photos: atts.map((a) => a.url),
        },
      };
    },
    async execute(user, p, overrides) {
      const o = overridesSchema.parse(overrides ?? {});
      if (o.attachmentIds && !o.attachmentIds.every((id) => p.attachmentIds.includes(id))) {
        throw new ApiError(400, 'Invalid photo selection');
      }
      const data = draftSchema.parse({ ...p, ...o });
      if (o.building && o.building !== p.building) {
        const b = await Building.findById(o.building).lean();
        if (!b) throw new ApiError(400, 'Selected building does not exist');
        data.lat = b.location.coordinates[1];
        data.lng = b.location.coordinates[0];
      }
      const atts = await loadOwnedAttachments(user, data.attachmentIds);
      const report = await ra.createReportForUser(user, data, atts);
      await markUsed(atts);
      return {
        message: `Report ${report.reportId} submitted.`,
        reportId: report.reportId,
        link: `/complaints?selected=${report.reportId}`,
      };
    },
  },

  'report.reopen': {
    roles: ['student'],
    input: z.object({ reportId, reason: z.string().trim().min(3).max(300) }),
    async prepare(user, i) {
      const r = await Report.findOne({ reportId: i.reportId.toUpperCase(), reporter: user._id }).lean();
      if (!r) throw new ApiError(404, 'No report with that ID in your account');
      ra.assertReopenable(r);
      return {
        payload: { reportId: r.reportId, reason: i.reason },
        summary: {
          title: `Reopen ${r.reportId}?`,
          confirmLabel: 'Reopen report',
          fields: [
            { label: 'Report', value: `${r.reportId}: ${r.title}` },
            { label: 'Reason', value: i.reason },
          ],
        },
      };
    },
    async execute(user, p) {
      await ra.reopenByReporter(user, p.reportId, p.reason);
      return {
        message: `${p.reportId} was reopened and sent back to the maintenance team.`,
        reportId: p.reportId,
        link: `/complaints?selected=${p.reportId}`,
      };
    },
  },

  'report.comment': {
    roles: ['student'],
    input: z.object({
      reportId,
      text: z.string().trim().max(500).optional().default(''),
      attachmentIds: z.array(oid).max(5).default([]),
    }),
    async prepare(user, i) {
      const r = await Report.findOne({ reportId: i.reportId.toUpperCase(), reporter: user._id }).lean();
      if (!r) throw new ApiError(404, 'No report with that ID in your account');
      if (r.status === 'cancelled') throw new ApiError(400, 'This report was cancelled');
      const atts = await loadOwnedAttachments(user, i.attachmentIds);
      return {
        payload: { reportId: r.reportId, text: i.text, attachmentIds: atts.map((a) => String(a._id)) },
        summary: {
          title: `Add update to ${r.reportId}?`,
          confirmLabel: 'Add update',
          fields: [
            { label: 'Report', value: `${r.reportId}: ${r.title}` },
            { label: 'Update', value: i.text || '(photo update)' },
          ],
          photos: atts.map((a) => a.url),
        },
      };
    },
    async execute(user, p) {
      const atts = await loadOwnedAttachments(user, p.attachmentIds);
      await ra.addStudentComment(user, p.reportId, { text: p.text, attachments: atts });
      await markUsed(atts);
      return {
        message: `Update added to ${p.reportId}.`,
        reportId: p.reportId,
        link: `/complaints?selected=${p.reportId}`,
      };
    },
  },

  'report.cancel': {
    roles: ['student'],
    input: z.object({ reportId, reason: z.string().trim().max(300).optional() }),
    async prepare(user, i) {
      const r = await Report.findOne({ reportId: i.reportId.toUpperCase(), reporter: user._id }).lean();
      if (!r) throw new ApiError(404, 'No report with that ID in your account');
      if (r.status !== 'pending') {
        throw new ApiError(
          400,
          r.status === 'in_progress'
            ? 'This report is already being worked on and cannot be cancelled. You can add an update instead.'
            : `This report is ${r.status.replace('_', ' ')} and cannot be cancelled`
        );
      }
      return {
        payload: { reportId: r.reportId, reason: i.reason },
        summary: {
          title: `Cancel ${r.reportId}?`,
          confirmLabel: 'Cancel report',
          destructive: true,
          fields: [
            { label: 'Report', value: `${r.reportId}: ${r.title}` },
            ...(i.reason ? [{ label: 'Reason', value: i.reason }] : []),
          ],
        },
      };
    },
    async execute(user, p) {
      await ra.cancelByReporter(user, p.reportId, p.reason);
      return {
        message: `Report ${p.reportId} was cancelled.`,
        reportId: p.reportId,
        link: `/complaints?selected=${p.reportId}`,
      };
    },
  },

  'report.support': {
    roles: ['student'],
    input: z.object({
      reportId,
      note: z.string().trim().max(300).optional(),
      attachmentIds: z.array(oid).max(5).default([]),
    }),
    async prepare(user, i) {
      const r = await Report.findOne({ reportId: i.reportId.toUpperCase() }).lean();
      if (!r || ['resolved', 'cancelled'].includes(r.status)) throw new ApiError(404, 'That report is no longer open');
      if (r.reporter.toString() === user._id.toString()) {
        throw new ApiError(400, 'That is your own report. Add an update instead.');
      }
      const existing = await ReportSupport.findOne({ report: r._id, user: user._id }).lean();
      if (existing) throw new ApiError(409, 'You have already added support to this report');
      const atts = await loadOwnedAttachments(user, i.attachmentIds);
      return {
        payload: { reportId: r.reportId, note: i.note, attachmentIds: atts.map((a) => String(a._id)) },
        summary: {
          title: `Support report ${r.reportId}?`,
          confirmLabel: 'Confirm support',
          notice: 'This adds your support ("me too") and notifies the maintenance team.',
          fields: [
            { label: 'Report', value: `${r.reportId}: ${r.title}` },
            ...(i.note ? [{ label: 'Note', value: i.note }] : []),
          ],
          photos: atts.map((a) => a.url),
        },
      };
    },
    async execute(user, p) {
      const atts = await loadOwnedAttachments(user, p.attachmentIds);
      await ra.supportReport(user, p.reportId, { note: p.note, attachments: atts });
      await markUsed(atts);
      return {
        message: `Support added to ${p.reportId}.`,
        reportId: p.reportId,
        link: `/complaints?selected=${p.reportId}`,
      };
    },
  },

  'report.status': {
    roles: ['admin', 'staff'],
    input: z.object({ reportId, status: z.enum(STATUSES), note: z.string().trim().max(500).optional() }),
    async prepare(user, i) {
      const r = await Report.findOne({
        reportId: i.reportId.toUpperCase(),
        ...(user.role === 'staff' && { assignedTo: user._id }),
      }).lean();
      if (!r) throw new ApiError(404, 'Report not found or not assigned to you');
      return {
        payload: i,
        summary: {
          title: `Change ${r.reportId} to ${i.status.replace('_', ' ')}?`,
          confirmLabel: 'Apply status change',
          notice: 'The note is visible to the student.',
          fields: [
            { label: 'Report', value: `${r.reportId}: ${r.title}` },
            { label: 'From', value: r.status },
            { label: 'To', value: i.status },
            { label: 'Note', value: i.note ?? '(none)' },
          ],
        },
      };
    },
    async execute(user, p, _o, ctx) {
      await aa.changeStatusAs(ctx, p.reportId, { status: p.status, note: p.note }, 'assistant');
      return {
        message: `${p.reportId} is now ${p.status.replace('_', ' ')}.`,
        link: `/admin/reports?report=${p.reportId}`,
      };
    },
  },

  'report.assign': {
    roles: ['admin'],
    input: z.object({ reportId, assigneeId: oid }),
    async prepare(user, i) {
      const [r, assignee] = await Promise.all([
        Report.findOne({ reportId: i.reportId.toUpperCase() }).lean(),
        User.findOne({ _id: i.assigneeId, role: { $in: ['admin', 'staff'] }, isActive: true }).lean(),
      ]);
      if (!r) throw new ApiError(404, 'Report not found');
      if (!assignee) throw new ApiError(400, 'Assignee must be active staff or admin');
      return {
        payload: i,
        summary: {
          title: `Assign ${r.reportId} to ${assignee.name}?`,
          confirmLabel: 'Confirm assignment',
          fields: [
            { label: 'Report', value: `${r.reportId}: ${r.title}` },
            { label: 'Assignee', value: `${assignee.name} (${assignee.role})` },
          ],
        },
      };
    },
    async execute(user, p, _o, ctx) {
      await aa.assignReportAs(ctx, p.reportId, p.assigneeId, 'assistant');
      return {
        message: `${p.reportId} assigned to technician.`,
        link: `/admin/reports?report=${p.reportId}`,
      };
    },
  },
};

export async function createPendingAction(ctx, type, input) {
  const def = actions[type];
  if (!def || !def.roles.includes(ctx.user.role)) {
    throw new ApiError(403, 'That action is not available to you');
  }
  const parsed = def.input.parse(input);
  const { payload, summary } = await def.prepare(ctx.user, parsed);
  const doc = await PendingAction.create({
    user: ctx.user._id,
    conversation: ctx.conversationId,
    type,
    payload,
    summary,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });
  return {
    actionId: String(doc._id),
    type,
    status: 'pending',
    expiresAt: doc.expiresAt.toISOString(),
    summary,
  };
}
