import { z } from 'zod';
import { ApiError } from '../../utils/ApiError.js';
import { createPendingAction } from '../actions/index.js';
import {
  studentToolDefs,
  getReportStatus,
  listMyReports,
  findSimilar,
  searchKnowledge,
} from './student.js';

export const TOOL_LABEL = {
  get_report_status: 'Checking the report…',
  list_my_reports: 'Looking up your reports…',
  find_similar_reports: 'Checking for similar reports…',
  search_knowledge: 'Searching campus info…',
  propose_report: 'Preparing your report…',
  propose_add_update: 'Preparing your update…',
  propose_reopen_report: 'Preparing reopen request…',
  propose_cancel_report: 'Preparing cancellation…',
  propose_support_report: 'Preparing support…',
  get_reports_summary: 'Summarizing reports…',
  list_reports: 'Fetching reports…',
  find_recurring_problems: 'Looking for recurring problems…',
  suggest_assignee: 'Comparing workloads…',
  propose_status_change: 'Preparing status change…',
  propose_assignment: 'Preparing assignment…',
};

const PROPOSE = {
  propose_report: 'report.create',
  propose_add_update: 'report.comment',
  propose_reopen_report: 'report.reopen',
  propose_cancel_report: 'report.cancel',
  propose_support_report: 'report.support',
  propose_status_change: 'report.status',
  propose_assignment: 'report.assign',
};

const readTools = {
  get_report_status: getReportStatus,
  list_my_reports: listMyReports,
  find_similar_reports: findSimilar,
  search_knowledge: searchKnowledge,
};

const readSchemas = {
  get_report_status: z.object({ reportId: z.string() }),
  list_my_reports: z.object({ status: z.string().optional(), limit: z.number().int().optional() }),
  find_similar_reports: z.object({ building: z.string(), category: z.string() }),
  search_knowledge: z.object({ query: z.string() }),
};

export function toolsFor(role) {
  if (role === 'student') return studentToolDefs;
  // Later in Stage 3 adminToolDefs will be added
  return studentToolDefs;
}

/** Never throws. Errors become tool results the model can explain to the person. */
export async function executeTool(ctx, name, input) {
  const allowed = toolsFor(ctx.user.role).some((t) => t.name === name);
  if (!allowed) return { result: { error: 'Unknown or unavailable tool' } };

  try {
    if (PROPOSE[name]) {
      const card = await createPendingAction(ctx, PROPOSE[name], input);
      return {
        card,
        result: {
          status: 'card_shown',
          note: 'A confirmation card is now visible. NOT applied yet. Tell the person to review it and tap the confirm button.',
        },
      };
    }

    if (readTools[name]) {
      const parsed = readSchemas[name] ? readSchemas[name].parse(input) : input;
      return { result: { untrusted_data: await readTools[name](ctx, parsed) } };
    }

    return { result: { error: 'Tool not implemented' } };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return {
        result: {
          error: 'Invalid input',
          details: e.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
        },
      };
    }
    if (e instanceof ApiError && e.status < 500) {
      return { result: { error: e.message } };
    }
    console.error(`Tool ${name} failed`, e);
    return { result: { error: 'Tool failed. Ask the person to try again later.' } };
  }
}
