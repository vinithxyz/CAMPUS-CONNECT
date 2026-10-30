import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ExternalLink, Check, X } from 'lucide-react';
import { buildingService } from '../../services/buildingService';
import { CATEGORY_OPTIONS, PRIORITY_OPTIONS } from '../../utils/constants';
import type { Building } from '../../types';

const editSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(120),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000),
  category: z.string().min(1, 'Category is required'),
  building: z.string().min(1, 'Building is required'),
  room: z.string().trim().min(1, 'Room is required').max(100),
  priority: z.string().min(1, 'Priority is required'),
});

type EditFormData = z.infer<typeof editSchema>;

interface ReportCardEditorProps {
  initialValues: Record<string, string>;
  onSave: (overrides: Record<string, any>) => void;
  onCancel: () => void;
}

export default function ReportCardEditor({
  initialValues,
  onSave,
  onCancel,
}: ReportCardEditorProps) {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    buildingService.list().then(setBuildings).catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: initialValues['Title'] || '',
      description: initialValues['Description'] || '',
      category: initialValues['Category'] || 'other',
      building:
        buildings.find((b) => b.name === initialValues['Building'])?.id ||
        initialValues['buildingId'] ||
        '',
      room: initialValues['Room'] || '',
      priority: initialValues['Priority'] || 'medium',
    },
  });

  const onSubmit = (data: EditFormData) => {
    onSave({
      title: data.title,
      description: data.description,
      category: data.category,
      building: data.building,
      room: data.room,
      priority: data.priority,
    });
  };

  const handleOpenFullForm = () => {
    navigate('/report', {
      state: {
        prefill: {
          title: initialValues['Title'],
          description: initialValues['Description'],
          category: initialValues['Category'],
          room: initialValues['Room'],
          priority: initialValues['Priority'],
        },
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-3 p-3 bg-white border border-slate-200 rounded-lg space-y-2.5 text-xs text-slate-700 shadow-sm"
    >
      <div className="font-semibold text-slate-800 pb-1 border-b border-slate-100 flex items-center justify-between">
        <span>Edit Report Details</span>
        <button
          type="button"
          onClick={handleOpenFullForm}
          className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-normal"
        >
          <span>Open full form</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      <div>
        <label className="block font-medium mb-1 text-slate-600">Title</label>
        <input
          {...register('title')}
          className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        {errors.title && <p className="text-red-500 text-[10px] mt-0.5">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-medium mb-1 text-slate-600">Category</label>
          <select
            {...register('category')}
            className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1 text-slate-600">Priority</label>
          <select
            {...register('priority')}
            className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-medium mb-1 text-slate-600">Building</label>
          <select
            {...register('building')}
            className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Select building...</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          {errors.building && (
            <p className="text-red-500 text-[10px] mt-0.5">{errors.building.message}</p>
          )}
        </div>

        <div>
          <label className="block font-medium mb-1 text-slate-600">Room / Area</label>
          <input
            {...register('room')}
            className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          {errors.room && <p className="text-red-500 text-[10px] mt-0.5">{errors.room.message}</p>}
        </div>
      </div>

      <div>
        <label className="block font-medium mb-1 text-slate-600">Description</label>
        <textarea
          {...register('description')}
          rows={2}
          className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
        />
        {errors.description && (
          <p className="text-red-500 text-[10px] mt-0.5">{errors.description.message}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-2.5 py-1 rounded text-slate-600 hover:bg-slate-100 text-xs flex items-center gap-1 font-medium"
        >
          <X className="w-3 h-3" />
          <span>Cancel</span>
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs"
        >
          <Check className="w-3 h-3" />
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  );
}
