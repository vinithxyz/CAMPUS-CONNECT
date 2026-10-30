import Chat from '../../models/Chat.js';
import Building from '../../models/Building.js';
import { llm, CHAT_MODEL } from './llmClient.js';
import { buildSystemPrompt } from './prompts.js';
import { toolsFor, executeTool, TOOL_LABEL } from '../../chat/tools/index.js';
import {
  findSimilar,
  getReportStatus,
  listMyReports,
  searchKnowledge,
} from '../../chat/tools/student.js';
import { loadOwnedAttachments, createPendingAction } from '../../chat/actions/index.js';
import { imageBlocks } from './attachments.js';
import { checkDailyLimit } from './usage.js';
import { ApiError } from '../../utils/ApiError.js';

const MAX_ROUNDS = 6;
const HISTORY_LIMIT = 20;

const sanitizeReplies = (input) =>
  (Array.isArray(input?.options) ? input.options : [])
    .filter((o) => typeof o === 'string')
    .map((o) => o.trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, 4);

async function handleFallback(ctx, userText, emit, cards, replies) {
  const q = userText.toLowerCase();

  // 1. Look up specific report ID (e.g. CP0012, CP12, CP 12, or just number if preceded by status/report)
  const reportMatch =
    userText.match(/\bCP[-\s]?(\d{1,5})\b/i) ||
    userText.match(/(?:report|complaint|issue|status)\s*(?:#|no\.?|id)?\s*(\d{1,5})\b/i);

  if (reportMatch) {
    const rawDigits = reportMatch[1] || reportMatch[0].replace(/[^0-9]/g, '');
    const reportId = `CP${rawDigits.padStart(4, '0')}`;
    emit('tool', { name: 'get_report_status', label: 'Checking the report…' });
    const statusData = await getReportStatus(ctx, { reportId });
    if (statusData.error) {
      return statusData.error;
    }
    const latestNote = statusData.history?.length
      ? statusData.history[statusData.history.length - 1].note
      : 'Report submitted';

    replies.push('Show all my reports', 'Report a problem');
    return (
      `📋 Status for Report ${statusData.reportId}: "${statusData.title}"\n` +
      `• Current Status: ${statusData.status.toUpperCase().replace('_', ' ')}\n` +
      `• Priority: ${statusData.priority}\n` +
      `• Location: ${statusData.building}, ${statusData.room}\n` +
      `• Support Count: ${statusData.supportCount}\n` +
      `• Latest Update: ${latestNote}`
    );
  }

  // 2. Status of reported issue(s) / List own complaints
  const isStatusQuery =
    q.includes('status') ||
    q.includes('track') ||
    q.includes('progress') ||
    q.includes('my complaint') ||
    q.includes('my report') ||
    q.includes('my issue') ||
    q.includes('reported issue') ||
    q.includes('check complaint') ||
    q.includes('check report') ||
    q.includes('check issue') ||
    q.includes('show complaints') ||
    q.includes('show reports');

  if (isStatusQuery && ctx.assistant === 'student') {
    emit('tool', { name: 'list_my_reports', label: 'Looking up your reports…' });
    const listData = await listMyReports(ctx, { limit: 5 });
    if (!listData.reports?.length) {
      replies.push('Report a problem');
      return "You don't have any reported issues yet. Would you like to report a problem?";
    }

    const latest = listData.reports[0];
    emit('tool', { name: 'get_report_status', label: 'Checking report status…' });
    const statusData = await getReportStatus(ctx, { reportId: latest.reportId });

    const latestNote = statusData.history?.length
      ? statusData.history[statusData.history.length - 1].note
      : 'Report submitted';

    const others = listData.reports.slice(1);
    for (const r of listData.reports.slice(0, 3)) {
      replies.push(`Status of ${r.reportId}`);
    }

    return (
      `📋 Status of your reported issue (${statusData.reportId} - "${statusData.title}"):\n` +
      `• Current Status: ${statusData.status.toUpperCase().replace('_', ' ')}\n` +
      `• Location: ${statusData.building}, ${statusData.room}\n` +
      `• Priority: ${statusData.priority}\n` +
      `• Reported: ${new Date(statusData.createdAt).toLocaleDateString()}\n` +
      `• Latest Update: ${latestNote}\n\n` +
      (others.length
        ? `Other reported issues in your account:\n` +
          others
            .map((r) => `• ${r.reportId}: "${r.title}" — Status: ${r.status.replace('_', ' ')}`)
            .join('\n')
        : '')
    );
  }


  // 3. Propose report if user describes an issue
  const isIssueDescription =
    q.includes('broken') ||
    q.includes('not working') ||
    q.includes('leak') ||
    q.includes('tap') ||
    q.includes('fan') ||
    q.includes('light') ||
    q.includes('water') ||
    q.includes('door') ||
    q.includes('wi-fi') ||
    q.includes('wifi') ||
    q.includes('power') ||
    q.includes('switch') ||
    q.includes('bench') ||
    q.includes('clean') ||
    q.includes('report a problem') ||
    q.includes('report an issue');

  if (isIssueDescription && ctx.assistant === 'student') {
    // Detect category
    let category = 'other';
    if (q.includes('fan') || q.includes('lift') || q.includes('elevator')) category = 'mechanical';
    else if (q.includes('light') || q.includes('electric') || q.includes('power') || q.includes('switch') || q.includes('spark')) category = 'electrical';
    else if (q.includes('tap') || q.includes('water') || q.includes('leak') || q.includes('plumb') || q.includes('pipe')) category = 'plumbing';
    else if (q.includes('wifi') || q.includes('wi-fi') || q.includes('internet')) category = 'wifi';
    else if (q.includes('door') || q.includes('bench') || q.includes('floor') || q.includes('wall') || q.includes('window')) category = 'civil';
    else if (q.includes('clean') || q.includes('trash') || q.includes('bin') || q.includes('waste')) category = 'sanitation';
    else if (q.includes('food') || q.includes('canteen')) category = 'canteen';
    else if (q.includes('hostel') || q.includes('geyser') || q.includes('cooler')) category = 'hostel';

    // Find building
    const buildings = await Building.find().lean();
    let matchedBuilding = buildings[0]?.name || 'Academic Block';
    for (const b of buildings) {
      if (q.includes(b.name.toLowerCase()) || q.includes(b.code.toLowerCase())) {
        matchedBuilding = b.name;
        break;
      }
    }

    emit('tool', { name: 'find_similar_reports', label: 'Checking for similar reports…' });
    const similar = await findSimilar(ctx, { building: matchedBuilding, category });

    emit('tool', { name: 'propose_report', label: 'Preparing your report…' });
    try {
      const card = await createPendingAction(ctx, 'report.create', {
        category,
        title: userText.length > 50 ? userText.slice(0, 50) + '...' : userText,
        description: userText,
        building: matchedBuilding,
        room: 'General Area / Room 104',
        priority: category === 'electrical' || category === 'safety' ? 'high' : 'medium',
      });
      cards.push(card);
      emit('card', card);
      replies.push('Show my reports');
      return "I've prepared this report. Please review it and tap Confirm.";
    } catch (err) {
      console.warn('Failed to propose report in fallback:', err);
    }
  }

  // 4. Knowledge base search
  emit('tool', { name: 'search_knowledge', label: 'Searching campus info…' });
  const kbData = await searchKnowledge(ctx, { query: userText });
  if (kbData.articles && kbData.articles.length > 0) {
    const art = kbData.articles[0];
    replies.push('How to report a problem');
    return `${art.title}\n\n${art.text}`;
  }

  // 5. Hindi or greetings
  if (q.includes('नमस्ते') || q.includes('kya') || q.includes('hai')) {
    replies.push('Report a problem', 'Check my complaint');
    return 'नमस्ते! मैं कैंपस कनेक्ट सहायक हूँ। मैं आपकी कैंपस की समस्याओं की रिपोर्ट करने और उनकी स्थिति जानने में मदद कर सकता हूँ।';
  }

  replies.push('Report a problem', 'Check my complaint', 'Campus info');
  return "I can help you report issues on campus, check your complaints status, or answer questions from our campus knowledge base. How can I help you today?";
}

export async function runChat({
  user,
  message,
  attachmentIds = [],
  language,
  conversationId,
  emit,
  signal,
}) {
  await checkDailyLimit(user);
  const assistant = user.role === 'student' ? 'student' : 'admin';

  let chat = conversationId
    ? await Chat.findOne({ _id: conversationId, user: user._id, assistant })
    : null;
  if (conversationId && !chat) throw new ApiError(404, 'Conversation not found');
  if (!chat) chat = await Chat.create({ user: user._id, assistant, messages: [] });

  const attachments =
    assistant === 'student' ? await loadOwnedAttachments(user, attachmentIds) : [];
  const userText = attachments.length
    ? `${message}\n\n[Attached photos: ${attachments.map((a, i) => `photo ${i + 1} = ${a._id}`).join(', ')}]`
    : message;

  let history = chat.messages
    .slice(-HISTORY_LIMIT)
    .map((m) => ({ role: m.role, content: m.content }));
  while (history.length && history[0].role !== 'user') history.shift();

  const imgBlocks = await imageBlocks(attachments);
  const userContent = imgBlocks.length
    ? [...imgBlocks, { type: 'text', text: userText }]
    : userText;

  const messages = [...history, { role: 'user', content: userContent }];

  const ctx = { user, assistant, conversationId: chat._id };
  const cards = [];
  let replies = [];
  let text = '';

  let llmSuccess = false;
  if (llm) {
    try {
      for (let round = 0; round < MAX_ROUNDS; round++) {
        if (signal?.aborted) return;

        const stream = llm.messages.stream(
          {
            model: CHAT_MODEL,
            max_tokens: 900,
            system: buildSystemPrompt({ user, assistant, language }),
            tools: toolsFor(user.role),
            messages,
          },
          { signal }
        );

        stream.on('text', (t) => {
          text += t;
          emit('delta', { text: t });
        });

        const res = await stream.finalMessage();
        llmSuccess = true;
        const uses = res.content.filter((b) => b.type === 'tool_use');
        if (!uses.length) break;

        messages.push({ role: 'assistant', content: res.content });
        const results = [];

        for (const u of uses) {
          if (signal?.aborted) return;
          if (u.name === 'quick_replies') {
            replies = sanitizeReplies(u.input);
            results.push({ type: 'tool_result', tool_use_id: u.id, content: '{"ok":true}' });
            continue;
          }

          emit('tool', { name: u.name, label: TOOL_LABEL[u.name] ?? 'Working…' });
          const out = await executeTool(ctx, u.name, u.input);
          if (out.card) {
            cards.push(out.card);
            emit('card', out.card);
          }
          results.push({
            type: 'tool_result',
            tool_use_id: u.id,
            content: JSON.stringify(out.result),
          });
        }

        if (uses.every((u) => u.name === 'quick_replies')) break;
        messages.push({ role: 'user', content: results });
      }
    } catch (llmErr) {
      console.warn(
        'LLM call did not succeed (e.g. credit/connectivity), activating structured fallback:',
        llmErr.message
      );
      llmSuccess = false;
      text = '';
    }
  }

  if (!llmSuccess && !signal?.aborted) {
    const fallbackText = await handleFallback(ctx, userText, emit, cards, replies);
    text = fallbackText;
    emit('delta', { text });
  }

  if (signal?.aborted) return;
  if (!text.trim()) {
    text = "I couldn't finish that. Please try again or rephrase.";
    emit('delta', { text });
  }

  chat.messages.push(
    { role: 'user', content: userText.slice(0, 4000) },
    {
      role: 'assistant',
      content: text.slice(0, 4000),
      cards: cards.map((c) => ({ actionId: c.actionId })),
    }
  );
  chat.updatedAt = new Date();
  await chat.save();

  if (replies.length) emit('replies', { options: replies.slice(0, 4) });
  return { conversationId: String(chat._id) };
}
