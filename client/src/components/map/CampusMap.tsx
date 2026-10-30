import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Tooltip } from 'react-leaflet';
import HeatLayer from './HeatLayer';
import { MAP_CENTER } from '../../utils/constants';
import StatusBadge from '../ui/StatusBadge';
import PriorityBadge from '../ui/PriorityBadge';
import type { Building, HeatPoint, MapReport } from '../../types';
import './leafletIcons';

interface Props {
  mode: 'heat' | 'markers';
  heatPoints: HeatPoint[];
  reports: MapReport[];
  buildings: Building[];
  renderPopupFooter?: (r: MapReport) => React.ReactNode;
}

export default function CampusMap({ mode, heatPoints, reports, buildings, renderPopupFooter }: Props) {
  return (
    <div className="relative h-[50vh] sm:h-[65vh] min-h-[350px] sm:min-h-[420px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <MapContainer
        center={MAP_CENTER}
        zoom={17}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />

        {/* Permanent building labels */}
        {buildings.map((b) => (
          <Marker key={b.id} position={[b.lat, b.lng]} opacity={0.0}>
            <Tooltip permanent direction="top" className="campus-label">
              {b.name}
            </Tooltip>
          </Marker>
        ))}

        {/* Heat Layer */}
        <HeatLayer points={heatPoints} enabled={mode === 'heat'} />

        {/* Markers Mode */}
        {mode === 'markers' &&
          reports.map((r) => (
            <Marker key={r.reportId} position={[r.lat, r.lng]}>
              <Popup>
                <div className="p-1 space-y-1.5 text-xs text-slate-700 min-w-[180px]">
                  <div className="flex items-center justify-between gap-2 border-b pb-1">
                    <span className="font-bold text-blue-600">{r.reportId}</span>
                    <span className="text-[10px] text-slate-400 capitalize">{r.category}</span>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm leading-snug">{r.title}</p>
                  <p className="text-slate-500">
                    {r.building ? `${r.building}, ` : ''}
                    {r.room}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <PriorityBadge priority={r.priority} size="sm" />
                    <StatusBadge status={r.status} size="sm" />
                  </div>
                  {r.isSample && (
                    <p className="text-[10px] text-slate-400 italic pt-0.5">Sample demonstration data</p>
                  )}
                  {renderPopupFooter && renderPopupFooter(r)}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
