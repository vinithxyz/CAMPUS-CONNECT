import { useState } from 'react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import type { ReportNote } from '../../types/admin';
import { ShieldCheck, Send, Loader2 } from 'lucide-react';

interface Props {
  reportId: string;
  notes: ReportNote[];
  onNoteAdded: () => void;
}

export default function NotesPanel({ reportId, notes, onNoteAdded }: Props) {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      setLoading(true);
      await adminService.addNote(reportId, text.trim());
      toast.success('Internal note added');
      setText('');
      onNoteAdded();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="space-y-3 pt-3 border-t border-slate-100">
      {/* Banner */}
      <div className="flex items-center gap-2 p-2.5 bg-amber-50/80 border border-amber-200/60 rounded-xl text-amber-800 text-xs">
        <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
        <span className="font-medium">
          Internal notes. Students cannot see these.
        </span>
      </div>

      {/* Add note form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an internal maintenance log, parts ordered, or contractor update..."
          rows={2}
          maxLength={1000}
          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition"
        />
        <div className="flex justify-between items-center text-[11px] text-slate-400">
          <span>{1000 - text.length} characters left</span>
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            <span>Add Note</span>
          </button>
        </div>
      </form>

      {/* Notes list */}
      <div className="space-y-2.5 pt-1 max-h-56 overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-2">No internal notes yet.</p>
        ) : (
          notes.map((note) => (
            <div key={note._id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-700">
                  {note.author.name}{' '}
                  <span className="font-normal text-slate-400">({note.author.role})</span>
                </span>
                <span className="text-slate-400">{formatDate(note.createdAt)}</span>
              </div>
              <p className="text-xs text-slate-700 whitespace-pre-wrap">{note.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
