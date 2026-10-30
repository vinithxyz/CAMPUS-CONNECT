import { useEffect, useState } from 'react';
import { buildingService } from '../../services/buildingService';
import { adminService } from '../../services/adminService';
import BuildingForm from '../../components/admin/BuildingForm';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import type { Building } from '../../types';
import { Plus, Edit2, Trash2, Building2, MapPin, RefreshCw } from 'lucide-react';

export default function AdminBuildingsPage() {
  const { toast } = useToast();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [formModal, setFormModal] = useState<{ open: boolean; building?: Building | null }>({
    open: false,
    building: null,
  });

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const data = await buildingService.list();
      setBuildings(data);
    } catch (err) {
      console.error('Failed to load buildings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const handleDelete = async (b: Building) => {
    if (!confirm(`Are you sure you want to delete building "${b.name}" (${b.code})?`)) return;

    try {
      await adminService.deleteBuilding(b.id);
      toast.success(`Building "${b.name}" deleted`);
      fetchBuildings();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Campus Buildings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure campus buildings, building codes, and geographical coordinates
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setFormModal({ open: true, building: null })}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Building</span>
          </button>
          <button
            onClick={fetchBuildings}
            disabled={loading}
            title="Refresh buildings"
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Buildings Table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 sticky top-0">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Building Name</th>
                <th className="py-3 px-4">Coordinates (Lat, Lng)</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {buildings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">{b.code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>{b.name}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {b.lat.toFixed(5)}, {b.lng.toFixed(5)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {b.isSample ? (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Sample Demo
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Verified
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setFormModal({ open: true, building: b })}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit building"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(b)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete building"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Building Add / Edit Modal */}
      {formModal.open && (
        <BuildingForm
          isOpen={formModal.open}
          onClose={() => setFormModal({ open: false, building: null })}
          building={formModal.building}
          onSaved={fetchBuildings}
        />
      )}
    </div>
  );
}
