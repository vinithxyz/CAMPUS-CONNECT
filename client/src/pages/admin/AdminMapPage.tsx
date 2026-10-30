import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, MapPin, Info, RefreshCw, ExternalLink } from 'lucide-react';
import CampusMap from '../../components/map/CampusMap';
import { MAP_FILTERS } from '../../utils/constants';
import { adminService } from '../../services/adminService';
import { buildingService } from '../../services/buildingService';
import type { Building, HeatPoint, MapReport, Status } from '../../types';

export default function AdminMapPage() {
  const [mode, setMode] = useState<'heat' | 'markers'>('heat');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]); // empty = all categories
  const [statuses, setStatuses] = useState<Status[]>(['pending', 'in_progress']);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [heatPoints, setHeatPoints] = useState<HeatPoint[]>([]);
  const [reports, setReports] = useState<MapReport[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSample, setHasSample] = useState(false);

  useEffect(() => {
    buildingService.list().then(setBuildings).catch(console.error);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      let catQuery: string[] = [];
      if (selectedFilters.length > 0) {
        selectedFilters.forEach((key) => {
          const match = MAP_FILTERS.find((f) => f.key === key);
          if (match) catQuery.push(...match.categories);
        });
      }

      const params = {
        categories: catQuery,
        statuses,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
      };

      const [hData, rData] = await Promise.all([
        adminService.heat(params),
        adminService.mapReports(params),
      ]);

      setHeatPoints(hData);
      setReports(rData);
      setHasSample(rData.some((r) => r.isSample));
    } catch (err) {
      console.error('Failed to load admin map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedFilters, statuses, from, to]);

  const toggleCategory = (key: string) => {
    if (key === 'all') {
      setSelectedFilters([]);
      return;
    }
    setSelectedFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleStatus = (st: Status) => {
    setStatuses((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
    );
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Admin Campus Heat Map
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Campus-wide maintenance hotspot density and pinpointed issue map
          </p>
        </div>

        {/* View Toggle */}
        <div className="inline-flex p-1 bg-slate-200/80 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setMode('heat')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
              mode === 'heat'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Heat Map</span>
          </button>
          <button
            onClick={() => setMode('markers')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
              mode === 'markers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Problem Markers</span>
          </button>
        </div>
      </div>

      {/* Admin Filters Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-2xs space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Status Checkboxes */}
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-700">Include Status:</span>
            {(['pending', 'in_progress', 'resolved'] as Status[]).map((st) => (
              <label key={st} className="flex items-center gap-1.5 cursor-pointer capitalize">
                <input
                  type="checkbox"
                  checked={statuses.includes(st)}
                  onChange={() => toggleStatus(st)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="text-slate-600 font-medium">{st.replace('_', ' ')}</span>
              </label>
            ))}
          </div>

          {/* Date range inputs */}
          <div className="flex items-center gap-2 text-slate-500">
            <span>Date Range:</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="py-1 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
            />
            <span>to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="py-1 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-slate-100">
          <button
            onClick={() => toggleCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition ${
              selectedFilters.length === 0
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {MAP_FILTERS.map((f) => {
            const active = selectedFilters.includes(f.key);
            return (
              <button
                key={f.key}
                onClick={() => toggleCategory(f.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition ${
                  active
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map View */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-20 bg-white/40 backdrop-blur-2xs flex items-center justify-center rounded-2xl">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        )}
        <CampusMap
          mode={mode}
          heatPoints={heatPoints}
          reports={reports}
          buildings={buildings}
          renderPopupFooter={(r) => (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
              <Link
                to={`/admin/reports?report=${r.reportId}`}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Open in Reports</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        />

        {hasSample && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/60">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Showing sample demonstration data on the campus layout.</span>
          </div>
        )}
      </div>
    </div>
  );
}
