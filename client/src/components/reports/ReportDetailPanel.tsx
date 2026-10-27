import { useState } from 'react';
import { Image as ImageIcon, MapPin, Tag, AlertTriangle, Calendar } from 'lucide-react';
import type { Report } from '../../types';
import StatusBadge from '../ui/StatusBadge';
import PriorityBadge from '../ui/PriorityBadge';
import Modal from '../ui/Modal';
import StatusTimeline from './StatusTimeline';
import { formatDateTime } from '../../utils/format';

interface Props {
  report: Report | null;
}

export default function ReportDetailPanel({ report }: Props) {
  const [timelineOpen, setTimelineOpen] = useState(false);

  if (!report) {
    return (
      <div className="bg-white rounded-xl p-8 border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center min-h-[420px]">
        <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mb-2">
          <ImageIcon className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700">No complaint selected</p>
        <p className="text-xs text-slate-400 mt-1">
          Click any report from the list to view its full details
        </p>
      </div>
    );
  }

  const primaryImage = report.images && report.images.length > 0 ? report.images[0].url : null;

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {/* Photo header */}
        <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={report.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // If local upload image fails, show fallback
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
              <ImageIcon className="w-10 h-10 mb-1" />
              <span className="text-xs font-medium">No photo attached</span>
            </div>
          )}
        </div>

        {/* Content details */}
        <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header: Title and Status */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800 leading-snug">{report.title}</h3>
                <p className="text-xs font-semibold text-blue-600 mt-0.5">ID: #{report.reportId}</p>
              </div>
              <StatusBadge status={report.status} />
            </div>

            {/* Key-Value Attributes */}
            <div className="space-y-2 text-xs border-y border-slate-100 py-3">
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400">Location:</span>
                <span className="font-semibold text-slate-800">
                  {report.building?.name ? `${report.building.name} - ` : ''}
                  {report.room}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-600">
                <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400">Category:</span>
                <span className="font-semibold text-slate-800 capitalize">{report.category}</span>
              </div>

              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400 text-xs">Priority:</span>
                <PriorityBadge priority={report.priority} size="sm" />
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">Description:</p>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {report.description}
              </p>
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Calendar className="w-3 h-3" />
              <span>Reported on: {formatDateTime(report.createdAt)}</span>
            </div>
          </div>

          {/* Action Button: View Updates */}
          <div className="pt-4">
            <button
              onClick={() => setTimelineOpen(true)}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              View Updates
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Modal */}
      <Modal
        isOpen={timelineOpen}
        onClose={() => setTimelineOpen(false)}
        title={`Status History - #${report.reportId}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-800">{report.title}</h4>
            <p className="text-xs text-slate-500">{report.room}</p>
          </div>
          <StatusTimeline history={report.history} />
        </div>
      </Modal>
    </>
  );
}
