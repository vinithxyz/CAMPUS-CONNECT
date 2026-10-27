import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ArrowUpDown, RefreshCw } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import PriorityBadge from '../components/ui/PriorityBadge';
import ReportDetailPanel from '../components/reports/ReportDetailPanel';
import { reportService } from '../services/reportService';
import { formatDate } from '../utils/format';
import type { Report, Status } from '../types';

export default function MyComplaintsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedFromUrl = searchParams.get('selected');

  const [activeTab, setActiveTab] = useState<'all' | Status>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadReports() {
      try {
        setLoading(true);
        const query: { status?: Status; search?: string; sort: string } = { sort };
        if (activeTab !== 'all') query.status = activeTab;
        if (search.trim()) query.search = search.trim();

        const res = await reportService.list(query);
        if (active) {
          setReports(res.data);
          // If URL param specified or no selection yet, pick match or first
          if (selectedFromUrl) {
            const found = res.data.find((r) => r.reportId.toUpperCase() === selectedFromUrl.toUpperCase());
            if (found) {
              setSelectedReport(found);
            } else if (res.data.length > 0) {
              setSelectedReport(res.data[0]);
            }
          } else if (res.data.length > 0) {
            setSelectedReport(res.data[0]);
          } else {
            setSelectedReport(null);
          }
        }
      } catch (err) {
        console.error('Failed to load complaints:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReports();
    return () => {
      active = false;
    };
  }, [activeTab, search, sort, selectedFromUrl]);

  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const handleRowClick = (r: Report) => {
    setSelectedReport(r);
    setSearchParams({ selected: r.reportId });
    // If mobile screen, open detail modal
    if (window.innerWidth < 1024) {
      setMobileDetailOpen(true);
    }
  };

  const tabs: { key: 'all' | Status; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">My Complaints</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track the status and timeline of all issues reported by you
        </p>
      </div>

      {/* Main Grid: Left List (8 cols) + Right Detail Panel (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tabs, Search, Table */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Tabs matching PDF page 7 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs font-semibold overflow-x-auto no-scrollbar max-w-full">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search complaints..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Complaints Container */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Mobile Cards View (< md) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {loading ? (
                <div className="px-6 py-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                  Loading complaints...
                </div>
              ) : reports.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-400">
                  No complaints match your criteria.
                </div>
              ) : (
                reports.map((r) => {
                  const isSelected = selectedReport?.reportId === r.reportId;
                  return (
                    <div
                      key={r.reportId}
                      onClick={() => handleRowClick(r)}
                      className={`p-4 transition cursor-pointer space-y-2 ${
                        isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-600 text-xs">#{r.reportId}</span>
                        <div className="flex items-center gap-1.5">
                          <PriorityBadge priority={r.priority} size="sm" />
                          <StatusBadge status={r.status} size="sm" />
                        </div>
                      </div>
                      <p className="text-xs font-bold text-slate-800 leading-snug">{r.title}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="capitalize">{r.category} • {r.room}</span>
                        <span>{formatDate(r.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-400 font-medium border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3 font-semibold">ID</th>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Location</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Priority</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                        Loading complaints...
                      </td>
                    </tr>
                  ) : reports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        No complaints match your criteria.
                      </td>
                    </tr>
                  ) : (
                    reports.map((r) => {
                      const isSelected = selectedReport?.reportId === r.reportId;
                      return (
                        <tr
                          key={r.reportId}
                          onClick={() => handleRowClick(r)}
                          className={`cursor-pointer transition ${
                            isSelected
                              ? 'bg-blue-50/70 font-semibold'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="px-5 py-3.5 font-semibold text-slate-800">
                            #{r.reportId}
                          </td>
                          <td className="px-4 py-3.5 text-slate-800">{r.title}</td>
                          <td className="px-4 py-3.5 text-slate-500">{r.room}</td>
                          <td className="px-4 py-3.5 text-slate-600 capitalize">{r.category}</td>
                          <td className="px-4 py-3.5">
                            <PriorityBadge priority={r.priority} size="sm" />
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={r.status} size="sm" />
                          </td>
                          <td className="px-5 py-3.5 text-right text-slate-400">
                            {formatDate(r.createdAt)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Desktop Detail Panel matching PDF page 7 */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-24">
          <ReportDetailPanel report={selectedReport} />
        </div>
      </div>

      {/* Mobile / Tablet Detail Modal Drawer (< lg) */}
      {mobileDetailOpen && selectedReport && (
        <div className="fixed inset-0 z-50 lg:hidden flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setMobileDetailOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[88vh] overflow-y-auto shadow-2xl z-10 animate-slide-up sm:animate-scale-in">
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-5 py-3 border-b border-slate-100 flex items-center justify-between z-10">
              <span className="font-bold text-slate-800 text-sm">Complaint Details</span>
              <button
                onClick={() => setMobileDetailOpen(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <ReportDetailPanel report={selectedReport} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
