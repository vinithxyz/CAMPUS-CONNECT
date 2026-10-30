import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Edit2,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { chatService } from '../../services/chatService';
import { useToast } from '../../context/ToastContext';
import ReportCardEditor from './ReportCardEditor';
import type { ActionCardData } from '../../types/chat';

interface ActionCardProps {
  card: ActionCardData;
  updateCard: (actionId: string, patch: Partial<ActionCardData>) => void;
}

export default function ActionCard({ card, updateCard }: ActionCardProps) {
  const [localBusy, setLocalBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [editing, setEditing] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, any>>({});
  const [confirmedLink, setConfirmedLink] = useState<string>();
  const { toast } = useToast();

  const isExpired =
    card.status === 'expired' ||
    (card.status === 'pending' && new Date(card.expiresAt) < new Date());

  const handleConfirm = async () => {
    setLocalBusy(true);
    setError(undefined);
    updateCard(card.actionId, { status: 'processing' });
    try {
      const r = await chatService.confirm(card.actionId, overrides);
      updateCard(card.actionId, {
        status: 'confirmed',
        summary: { ...card.summary, notice: r.message },
      });
      if (r.link) setConfirmedLink(r.link);
      toast.success(r.message);
    } catch (e: any) {
      const msg = chatService.errorMessage(e);
      const gone = /expired|already handled/i.test(msg);
      updateCard(card.actionId, { status: gone ? 'expired' : 'pending' });
      setError(msg);
    } finally {
      setLocalBusy(false);
    }
  };

  const handleCancel = async () => {
    setLocalBusy(true);
    setError(undefined);
    try {
      await chatService.cancel(card.actionId);
      updateCard(card.actionId, { status: 'cancelled' });
    } catch (e: any) {
      setError(chatService.errorMessage(e));
    } finally {
      setLocalBusy(false);
    }
  };

  const handleSaveOverrides = (newOverrides: Record<string, any>) => {
    setOverrides(newOverrides);
    // Update summary fields locally so user sees their edits immediately
    const updatedFields = card.summary.fields.map((f) => {
      if (f.label === 'Title' && newOverrides.title) return { ...f, value: newOverrides.title };
      if (f.label === 'Description' && newOverrides.description)
        return { ...f, value: newOverrides.description };
      if (f.label === 'Category' && newOverrides.category)
        return { ...f, value: newOverrides.category };
      if (f.label === 'Room' && newOverrides.room) return { ...f, value: newOverrides.room };
      if (f.label === 'Priority' && newOverrides.priority)
        return { ...f, value: newOverrides.priority };
      return f;
    });
    updateCard(card.actionId, {
      summary: { ...card.summary, fields: updatedFields },
    });
    setEditing(false);
  };

  // Convert fields array to lookup object for editor
  const fieldMap: Record<string, string> = {};
  for (const f of card.summary.fields || []) {
    fieldMap[f.label] = f.value;
  }

  return (
    <div className="my-2.5 rounded-xl border border-blue-200/80 bg-linear-to-b from-blue-50/50 to-white p-3.5 shadow-sm text-slate-800 transition-all">
      {/* Title & Status Header */}
      <div className="flex items-center justify-between gap-2 border-b border-blue-100 pb-2">
        <h3 className="text-xs font-bold text-slate-800">{card.summary.title}</h3>

        {card.status === 'confirmed' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Confirmed
          </span>
        )}

        {card.status === 'cancelled' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            <XCircle className="w-3 h-3 text-slate-400" />
            Cancelled
          </span>
        )}

        {isExpired && card.status !== 'confirmed' && card.status !== 'cancelled' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" />
            Expired
          </span>
        )}
      </div>

      {/* Fields List */}
      <div className="mt-2.5 space-y-1.5 text-xs">
        {card.summary.fields.map((field, idx) => (
          <div key={idx} className="flex items-start justify-between gap-2 text-slate-700">
            <span className="text-slate-500 font-medium shrink-0 text-[11px]">{field.label}:</span>
            <span className="font-semibold text-slate-800 text-right text-[11px] break-words">
              {field.value}
            </span>
          </div>
        ))}
      </div>

      {/* Photo previews if any */}
      {card.summary.photos && card.summary.photos.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-slate-100">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Attached Photos
          </span>
          <div className="flex flex-wrap gap-1.5">
            {card.summary.photos.map((url, i) => (
              <img
                key={i}
                src={url}
                alt="Attachment preview"
                className="w-12 h-12 object-cover rounded border border-slate-200"
              />
            ))}
          </div>
        </div>
      )}

      {/* Notice Callout */}
      {card.summary.notice && (
        <div className="mt-2.5 rounded bg-blue-50/70 p-2 text-[11px] text-blue-900 border border-blue-200/50">
          {card.summary.notice}
        </div>
      )}

      {/* Inline Error */}
      {error && (
        <div className="mt-2 rounded bg-red-50 p-2 text-[11px] text-red-700 border border-red-200 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Editor view */}
      {editing && (
        <ReportCardEditor
          initialValues={fieldMap}
          onSave={handleSaveOverrides}
          onCancel={() => setEditing(false)}
        />
      )}

      {/* Confirmed Link */}
      {card.status === 'confirmed' && confirmedLink && (
        <div className="mt-3 pt-2 border-t border-emerald-100 flex items-center justify-between">
          <span className="text-xs text-emerald-700 font-medium">Action completed</span>
          <Link
            to={confirmedLink}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 underline underline-offset-2"
          >
            <span>View in My Complaints</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Expired message */}
      {isExpired && card.status !== 'confirmed' && card.status !== 'cancelled' && (
        <div className="mt-2.5 text-xs text-amber-700 font-medium">
          This card has expired. Ask the assistant to prepare it again.
        </div>
      )}

      {/* Action Buttons for Pending State */}
      {card.status === 'pending' && !isExpired && (
        <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-2.5">
          {card.summary.editable && !editing && (
            <button
              type="button"
              disabled={localBusy}
              onClick={() => setEditing(true)}
              className="mr-auto inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 transition"
            >
              <Edit2 className="w-3 h-3 text-slate-500" />
              <span>Edit</span>
            </button>
          )}

          <button
            type="button"
            disabled={localBusy}
            onClick={handleCancel}
            className="rounded px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={localBusy}
            onClick={handleConfirm}
            className={`inline-flex items-center gap-1.5 rounded px-3.5 py-1 text-xs font-semibold text-white shadow-xs transition active:scale-95 disabled:opacity-60 ${
              card.summary.destructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {localBusy ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{card.summary.confirmLabel ?? 'Confirm'}</span>
            )}
          </button>
        </div>
      )}

      {card.status === 'processing' && (
        <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-2.5">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            Applying action...
          </span>
        </div>
      )}
    </div>
  );
}
