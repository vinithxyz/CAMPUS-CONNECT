import Report, { CATEGORIES, PRIORITIES, STATUSES } from '../../models/Report.js';
import ReportComment from '../../models/ReportComment.js';
import KnowledgeArticle from '../../models/KnowledgeArticle.js';
import { findBuildingByName } from '../actions/index.js';

export const QUICK_REPLIES_DEF = {
  name: 'quick_replies',
  description:
    'Offer up to 4 short tappable replies (max 40 characters each) in the SAME language as your message. Call it at the end of a turn when the next answer is likely one of a few options. Do not call it when the answer is free text.',
  input_schema: {
    type: 'object',
    properties: {
      options: {
        type: 'array',
        items: { type: 'string', maxLength: 40 },
        maxItems: 4,
      },
    },
    required: ['options'],
  },
};

export const studentToolDefs = [
  {
    name: 'get_report_status',
    description:
      "Get status, priority, update timeline, student updates and support count of one of the student's OWN reports by ID (e.g. CP0012).",
    input_schema: {
      type: 'object',
      properties: { reportId: { type: 'string' } },
      required: ['reportId'],
    },
  },
  {
    name: 'list_my_reports',
    description: "List the student's own reports, newest first.",
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: STATUSES },
        limit: { type: 'integer', minimum: 1, maximum: 10 },
      },
    },
  },
  {
    name: 'find_similar_reports',
    description:
      'Find OPEN reports in the same building and category within about 100 m. Always call this before proposing a new report. Results marked mine=true belong to the student.',
    input_schema: {
      type: 'object',
      properties: {
        building: { type: 'string' },
        category: { type: 'string', enum: CATEGORIES },
      },
      required: ['building', 'category'],
    },
  },
  {
    name: 'search_knowledge',
    description:
      'Search the campus knowledge base (hostel rules, canteen timings, Wi-Fi help, contacts, emergencies). The query MUST be in English, even if the student writes in another language. Answer only from the results.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'propose_report',
    description:
      "Prepare a NEW report as a confirmation card. NOT submitted until the student taps Confirm. Write title and description in English; put the student's original wording in originalDescription if they wrote in another language. Use attachmentIds only from the photo IDs given in the conversation.",
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: CATEGORIES },
        title: { type: 'string' },
        description: { type: 'string' },
        originalDescription: { type: 'string' },
        building: { type: 'string' },
        room: { type: 'string' },
        priority: { type: 'string', enum: PRIORITIES },
        attachmentIds: { type: 'array', items: { type: 'string' } },
      },
      required: ['category', 'title', 'description', 'building', 'room'],
    },
  },
  {
    name: 'propose_add_update',
    description:
      "Prepare adding a note and/or photos to the student's OWN open report (confirmation card).",
    input_schema: {
      type: 'object',
      properties: {
        reportId: { type: 'string' },
        text: { type: 'string' },
        attachmentIds: { type: 'array', items: { type: 'string' } },
      },
      required: ['reportId'],
    },
  },
  {
    name: 'propose_reopen_report',
    description:
      "Prepare reopening one of the student's OWN resolved reports (confirmation card). Ask for the reason first.",
    input_schema: {
      type: 'object',
      properties: {
        reportId: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['reportId', 'reason'],
    },
  },
  {
    name: 'propose_cancel_report',
    description:
      "Prepare cancelling one of the student's OWN reports that is still pending (confirmation card).",
    input_schema: {
      type: 'object',
      properties: {
        reportId: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['reportId'],
    },
  },
  {
    name: 'propose_support_report',
    description:
      'Prepare adding support ("me too" with optional note and photos) to ANOTHER student\'s open report instead of creating a duplicate (confirmation card).',
    input_schema: {
      type: 'object',
      properties: {
        reportId: { type: 'string' },
        note: { type: 'string' },
        attachmentIds: { type: 'array', items: { type: 'string' } },
      },
      required: ['reportId'],
    },
  },
  QUICK_REPLIES_DEF,
];

// Read tool implementations:

export async function getReportStatus(ctx, { reportId }) {
  let cleanId = String(reportId).trim().toUpperCase().replace(/[\s-]/g, '');
  if (/^\d+$/.test(cleanId)) {
    cleanId = `CP${cleanId.padStart(4, '0')}`;
  } else if (/^CP\d+$/i.test(cleanId)) {
    cleanId = `CP${cleanId.slice(2).padStart(4, '0')}`;
  }

  const r = await Report.findOne({
    reportId: cleanId,
    reporter: ctx.user._id,
  })
    .populate('building', 'name')
    .lean();

  if (!r) {
    const existsOther = await Report.findOne({ reportId: cleanId }).lean();
    if (existsOther) {
      return {
        error: `Report ${cleanId} was submitted by another student. You can only view detailed updates for your own reports. If you are experiencing this issue as well, you can find it on the Campus Map to add your support ("me too").`,
      };
    }
    return { error: `No report found with ID ${cleanId} in your account.` };
  }

  const comments = await ReportComment.find({ report: r._id })
    .select('text images createdAt')
    .sort({ createdAt: 1 })
    .lean();


  return {
    reportId: r.reportId,
    title: r.title,
    status: r.status,
    priority: r.priority,
    category: r.category,
    building: r.building?.name ?? 'Unknown',
    room: r.room,
    createdAt: r.createdAt,
    resolvedAt: r.resolvedAt,
    reopenCount: r.reopenCount ?? 0,
    supportCount: r.supportCount ?? 0,
    history: (r.history ?? []).map((h) => ({
      status: h.status,
      note: h.note,
      at: h.changedAt,
    })),
    studentUpdates: comments.map((c) => ({
      text: c.text,
      hasImages: Boolean(c.images?.length),
      at: c.createdAt,
    })),
  };
}

export async function listMyReports(ctx, { status, limit = 5 } = {}) {
  const query = { reporter: ctx.user._id };
  if (status) query.status = status;

  const rows = await Report.find(query)
    .populate('building', 'name')
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 10))
    .lean();

  return {
    reports: rows.map((r) => ({
      reportId: r.reportId,
      title: r.title,
      status: r.status,
      priority: r.priority,
      category: r.category,
      building: r.building?.name ?? 'Unknown',
      room: r.room,
      createdAt: r.createdAt,
      supportCount: r.supportCount ?? 0,
    })),
  };
}

export async function findSimilar(ctx, { building, category }) {
  const b = await findBuildingByName(building);
  const rows = await Report.find({
    category,
    status: { $nin: ['resolved', 'cancelled'] },
    location: { $near: { $geometry: b.location, $maxDistance: 100 } },
  })
    .select('reportId title status priority createdAt supportCount reporter')
    .limit(5)
    .lean();

  return {
    building: b.name,
    similarOpenReports: rows.map((r) => ({
      reportId: r.reportId,
      title: r.title,
      status: r.status,
      priority: r.priority,
      reportedAt: r.createdAt,
      supportCount: r.supportCount ?? 0,
      mine: r.reporter ? r.reporter.equals(ctx.user._id) : false,
    })),
  };
}

export async function searchKnowledge(_ctx, { query }) {
  const rows = await KnowledgeArticle.find(
    { published: true, $text: { $search: query.slice(0, 200) } },
    { score: { $meta: 'textScore' }, title: 1, body: 1, category: 1 }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(3)
    .lean();

  return rows.length
    ? { articles: rows.map((r) => ({ title: r.title, text: r.body, category: r.category })) }
    : {
        articles: [],
        note: 'No matching article. Say you do not have that information and point to the campus contacts article.',
      };
}
