import { useNavigate } from 'react-router-dom';
import { PlusCircle, Map } from 'lucide-react';

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">Quick Actions</h3>
      <div className="space-y-2.5">
        <button
          onClick={() => navigate('/report')}
          className="w-full flex items-center gap-3 p-3 text-left rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition group"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">Report New Issue</p>
            <p className="text-[11px] text-slate-400">File a complaint with photos and location</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/map')}
          className="w-full flex items-center gap-3 p-3 text-left rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition group"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">View Campus Map</p>
            <p className="text-[11px] text-slate-400">Inspect heat map and problem density</p>
          </div>
        </button>
      </div>
    </div>
  );
}
