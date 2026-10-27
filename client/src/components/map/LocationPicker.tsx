import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import type { LeafletMouseEvent } from 'leaflet';
import { MAP_CENTER } from '../../utils/constants';
import './leafletIcons';

interface Props {
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number) => void;
  buildingCoords?: { lat: number; lng: number };
}

function CenterMap({ coords }: { coords?: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.lat && coords.lng) {
      map.setView([coords.lat, coords.lng], 18, { animate: true });
    }
  }, [coords, map]);
  return null;
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ lat, lng, onChange, buildingCoords }: Props) {
  const [position, setPosition] = useState<[number, number] | null>(
    lat && lng ? [lat, lng] : buildingCoords ? [buildingCoords.lat, buildingCoords.lng] : null
  );

  useEffect(() => {
    if (lat && lng) {
      setPosition([lat, lng]);
    } else if (buildingCoords && buildingCoords.lat && buildingCoords.lng) {
      setPosition([buildingCoords.lat, buildingCoords.lng]);
      onChange(buildingCoords.lat, buildingCoords.lng);
    }
  }, [lat, lng, buildingCoords, onChange]);

  const handleMapClick = (newLat: number, newLng: number) => {
    setPosition([newLat, newLng]);
    onChange(newLat, newLng);
  };

  const centerPos = position || (buildingCoords ? [buildingCoords.lat, buildingCoords.lng] : MAP_CENTER);

  return (
    <div className="space-y-3">
      <div className="h-64 sm:h-80 w-full rounded-xl overflow-hidden border border-slate-200 shadow-xs relative">
        <MapContainer
          center={centerPos as [number, number]}
          zoom={17}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <CenterMap coords={buildingCoords} />
          <ClickHandler onClick={handleMapClick} />
          {position && (
            <Marker
              position={position}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const newPos = marker.getLatLng();
                  setPosition([newPos.lat, newPos.lng]);
                  onChange(newPos.lat, newPos.lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
        <span>Click on the map or drag the pin to pinpoint the exact location</span>
        {position && (
          <span className="font-mono text-slate-700 font-semibold text-[11px] sm:text-xs">
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </span>
        )}
      </div>
    </div>
  );
}
