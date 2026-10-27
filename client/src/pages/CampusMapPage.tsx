import { useState, useEffect } from 'react';
import { Layers, MapPin, Info, RefreshCw } from 'lucide-react';
import CampusMap from '../components/map/CampusMap';
import { MAP_FILTERS } from '../utils/constants';
import { mapService } from '../services/mapService';
import { buildingService } from '../services/buildingService';
import type { Building, HeatPoint, MapReport } from '../types';

export default function CampusMapPage() {
  const [mode, setMode] = useState<'heat' | 'markers'>('heat');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]); // empty = All
  const [heatPoints, setHeatPoints] = useState<HeatPoint[]>([]);
  const [reports, setReports] = useState<MapReport[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSample, setHasSample] = useState(false);

  useEffect(() => {
    buildingService.list().then(setBuildings).catch(console.error);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadMapData() {
      try {
        setLoading(true);
        // Map selected filter keys to underlying categories
        let catQuery: string[] = [];
        if (selectedFilters.length > 0) {
          selectedFilters.forEach((key) => {
            const match = MAP_FILTERS.find((f) => f.key === key);
            if (match) catQuery.push(...match.categories);
          });
        }

        const [hData, rData] = await Promise.all([
          mapService.heat(catQuery, false),
          mapService.reports(catQuery, false),
        ]);

        if (active) {
          setHeatPoints(hData);
          setReports(rData);
          setHasSample(rData.some((r) => r.isSample));
        }
      } catch (err) {
        console.error('Failed to load map data:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMapData();
    return () => {
      active = false;
    };
  }, [selectedFilters]);

  const toggleFilter = (key: string) => {
    if (key === 'all') {
      setSelectedFilters([]);
      return;
    }

    setSelectedFilters((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const isAllSelected = selectedFilters.length === 0;

  return (
    <div className="space-y-6">
      {/* Page Title & View Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Campus Map</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualize density of reported issues and locate complaints across campus
          </p>
        </div>

        {/* View Toggle Segmented Control */}
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
            <span>Markers</span>
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Category Filter Chips (< lg) */}
      <div className="lg:hidden space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>Filter Issues:</span>
          {/* Mobile compact legend */}
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Med
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => toggleFilter('all')}
            className={`px-3 py-1.5 rounded-full shrink-0 font-medium transition ${
              isAllSelected
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            All
          </button>
          {MAP_FILTERS.map((f) => {
            const checked = selectedFilters.includes(f.key);
            return (
              <button
                key={f.key}
                onClick={() => toggleFilter(f.key)}
                className={`px-3 py-1.5 rounded-full shrink-0 font-medium transition ${
                  checked
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Map + Right Filters Grid (Matching PDF page 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map View */}
        <div className="lg:col-span-9 relative">
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
          />

          {hasSample && (
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/60">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Showing sample demonstration data on the campus layout.</span>
            </div>
          )}
        </div>

        {/* Right Sidebar: Legend & Category Filter Checkboxes (Desktop only) */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          {/* Heat Map Legend */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
              Heat Map Legend
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/30 shrink-0" />
                <span className="text-slate-600 font-medium">High Density</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/30 shrink-0" />
                <span className="text-slate-600 font-medium">Medium Density</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30 shrink-0" />
                <span className="text-slate-600 font-medium">Low Density</span>
              </div>
            </div>
          </div>

          {/* Filter by Category Checkboxes (matching PDF page 6) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
              Filter by Category
            </h3>
            <div className="space-y-2 text-xs">
              {/* All Option */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-700 py-0.5">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={() => toggleFilter('all')}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className={isAllSelected ? 'font-semibold text-slate-900' : ''}>All</span>
              </label>

              {/* Specific Categories */}
              {MAP_FILTERS.map((f) => {
                const checked = selectedFilters.includes(f.key);
                return (
                  <label
                    key={f.key}
                    className="flex items-center gap-2.5 cursor-pointer select-none text-slate-700 py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFilter(f.key)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className={checked ? 'font-semibold text-slate-900' : ''}>{f.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
