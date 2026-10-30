import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../ui/Modal';
import LocationPicker from '../map/LocationPicker';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import type { Building } from '../../types';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{2,10}$/, '2 to 10 letters, numbers or dashes'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  building?: Building | null;
  onSaved: () => void;
}

export default function BuildingForm({ isOpen, onClose, building, onSaved }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(building);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: building?.name || '',
      code: building?.code || '',
      lat: building?.lat ?? 12.6599,
      lng: building?.lng ?? 77.4512,
    },
  });

  const lat = watch('lat');
  const lng = watch('lng');

  const onSubmit = async (values: FormData) => {
    try {
      setLoading(true);
      if (isEditing && building) {
        await adminService.updateBuilding(building.id, values);
        toast.success(`Building "${values.name}" updated`);
      } else {
        await adminService.createBuilding(values);
        toast.success(`Building "${values.name}" created`);
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Building: ${building?.name}` : 'Add New Campus Building'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Building Name</label>
            <input
              {...register('name')}
              type="text"
              placeholder="e.g. Science Complex"
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {errors.name && <p className="text-[11px] text-rose-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Building Code</label>
            <input
              {...register('code')}
              type="text"
              placeholder="e.g. SCI-A"
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {errors.code && <p className="text-[11px] text-rose-500">{errors.code.message}</p>}
          </div>
        </div>

        {/* Map Coordinates Picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Campus Coordinates</label>
          <LocationPicker
            lat={lat}
            lng={lng}
            onChange={(newLat, newLng) => {
              setValue('lat', newLat, { shouldValidate: true });
              setValue('lng', newLng, { shouldValidate: true });
            }}
          />
          {(errors.lat || errors.lng) && (
            <p className="text-[11px] text-rose-500">Please choose valid campus coordinates.</p>
          )}
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isEditing ? 'Save Changes' : 'Create Building'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
