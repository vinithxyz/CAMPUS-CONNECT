import Chat from '../models/Chat.js';
import PendingAction from '../models/PendingAction.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { runChat } from '../services/chat/chatService.js';
import { actions } from '../chat/actions/index.js';

export const streamChat = async (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  const ac = new AbortController();
  res.on('close', () => ac.abort());

  const emit = (event, data) => {
    if (!res.writableEnded) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  };

  try {
    const out = await runChat({
      ...req.body,
      user: req.user,
      emit,
      signal: ac.signal,
    });
    if (out) emit('done', out);
  } catch (e) {
    if (!ac.signal.aborted) {
      if (!(e instanceof ApiError)) console.error('chat stream failed', e);
      emit('error', {
        message:
          e instanceof ApiError
            ? e.message
            : 'The assistant is unavailable right now. You can still use the normal pages.',
      });
    }
  } finally {
    res.end();
  }
};

export const confirmAction = asyncHandler(async (req, res) => {
  // Atomic claim: single use, owner only, not expired
  const action = await PendingAction.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.user._id,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    },
    { status: 'processing' },
    { new: true }
  );

  if (!action) {
    throw new ApiError(
      409,
      'This action expired or was already handled. Ask the assistant to prepare it again.'
    );
  }

  const def = actions[action.type];
  try {
    if (!def || !def.roles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission for this action');
    }
    const result = await def.execute(
      req.user,
      action.payload,
      req.body?.overrides,
      { user: req.user, ip: req.ip }
    );
    action.status = 'confirmed';
    action.result = result;
    await action.save();

    if (action.conversation) {
      // Let the model know what happened on the next turn
      await Chat.updateOne(
        { _id: action.conversation, user: req.user._id },
        {
          $push: { messages: { role: 'assistant', content: ` ${result.message}` } },
          $set: { updatedAt: new Date() },
        }
      );
    }

    res.json({ data: result });
  } catch (e) {
    action.status = e instanceof ApiError && e.status === 400 ? 'pending' : 'failed';
    await action.save();
    throw e;
  }
});

export const cancelAction = asyncHandler(async (req, res) => {
  await PendingAction.updateOne(
    { _id: req.params.id, user: req.user._id, status: 'pending' },
    { status: 'cancelled' }
  );
  res.status(204).end();
});

export const currentConversation = asyncHandler(async (req, res) => {
  const assistant = req.user.role === 'student' ? 'student' : 'admin';
  const chat = await Chat.findOne({ user: req.user._id, assistant })
    .sort({ updatedAt: -1 })
    .lean();

  if (!chat) {
    return res.json({ data: null });
  }

  // Collect action IDs from all cards
  const actionIds = [];
  for (const m of chat.messages || []) {
    if (Array.isArray(m.cards)) {
      for (const c of m.cards) {
        if (c.actionId) actionIds.push(c.actionId);
      }
    }
  }

  const pendingDocs = actionIds.length
    ? await PendingAction.find({ _id: { $in: actionIds } }).lean()
    : [];
  const actionMap = Object.fromEntries(pendingDocs.map((p) => [String(p._id), p]));

  const enrichedMessages = (chat.messages || []).map((m) => {
    const cards = (m.cards || [])
      .map((c) => {
        const actionDoc = actionMap[String(c.actionId)];
        if (!actionDoc) return null;
        return {
          actionId: String(actionDoc._id),
          type: actionDoc.type,
          status:
            actionDoc.status === 'pending' && new Date(actionDoc.expiresAt) < new Date()
              ? 'expired'
              : actionDoc.status,
          expiresAt: actionDoc.expiresAt.toISOString(),
          summary: actionDoc.summary,
        };
      })
      .filter(Boolean);

    return {
      id: String(m._id || m.createdAt || Math.random()),
      role: m.role,
      content: m.content,
      cards,
      createdAt: m.createdAt,
    };
  });

  res.json({
    data: {
      conversationId: String(chat._id),
      messages: enrichedMessages,
    },
  });
});

export const deleteConversation = asyncHandler(async (req, res) => {
  await Chat.deleteOne({ _id: req.params.conversationId, user: req.user._id });
  res.status(204).end();
});
