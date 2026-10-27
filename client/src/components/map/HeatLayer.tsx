import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import type { HeatPoint } from '../../types';

interface Props {
  points: HeatPoint[];
  enabled: boolean;
}

export default function HeatLayer({ points, enabled }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || !points || points.length === 0) return;

    // L.heatLayer is added to L by leaflet.heat import
    const layer = (L as unknown as { heatLayer: (pts: HeatPoint[], opts: unknown) => L.Layer }).heatLayer(
      points,
      {
        radius: 35,
        blur: 25,
        maxZoom: 18,
        max: 1.0,
        gradient: {
          0.2: '#22c55e', // Low: green
          0.5: '#f59e0b', // Medium: amber
          0.8: '#ef4444', // High: red
        },
      }
    );

    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, points, enabled]);

  return null;
}
