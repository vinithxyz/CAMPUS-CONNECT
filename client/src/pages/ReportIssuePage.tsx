import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ArrowLeft, Loader2, PlusCircle } from 'lucide-react';
import Stepper from '../components/ui/Stepper';
import ImageUploader from '../components/reports/ImageUploader';
import LocationPicker from '../components/map/LocationPicker';
import { reportSchema, type ReportForm } from '../schemas/reportSchemas';
import { CATEGORY_OPTIONS, PRIORITY_OPTIONS } from '../utils/constants';
import { buildingService } from '../services/buildingService';
import { reportService } from '../services/reportService';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import type { Building, Report } from '../types';

export default function ReportIssuePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [submittedReport, setSubmittedReport] = useState<Report | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useForm<ReportForm>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      category: 'plumbing',
      priority: 'medium',
      title: '',
      description: '',
      building: '',
      room: '',
      lat: 12.6599,
      lng: 77.4512,
    },
    mode: 'onTouched',
  });

  const selectedBuildingId = watch('building');
  const currentLat = watch('lat');
  const currentLng = watch('lng');

  useEffect(() => {
    buildingService
      .list()
      .then((data) => {
        setBuildings(data);
        if (data.length > 0 && !selectedBuildingId) {
          setValue('building', data[0].id);
          setValue('lat', data[0].lat);
          setValue('lng', data[0].lng);
        }
      })
      .catch((err) => console.error(err));
  }, [selectedBuildingId, setValue]);

  // When building changes, update default coordinates
  const handleBuildingChange = (bId: string) => {
    setValue('building', bId);
    const b = buildings.find((x) => x.id === bId);
    if (b) {
      setValue('lat', b.lat);
      setValue('lng', b.lng);
    }
  };

  const handleNextFromStep1 = async () => {
    const valid = await trigger([
      'category',
      'title',
      'description',
      'building',
      'room',
      'priority',
    ]);
    if (valid) {
      setStep(2);
    }
  };

  const handleNextFromStep2 = async () => {
    const valid = await trigger(['lat', 'lng']);
    if (valid) {
      setStep(3);
    }
  };

  const onSubmit = async (values: ReportForm) => {
    try {
      setSubmitting(true);
      const fd = new FormData();
      Object.entries(values).forEach(([k, val]) => {
        fd.append(k, String(val));
      });
      images.forEach((f) => {
        fd.append('images', f);
      });

      const res = await reportService.create(fd);
      setSubmittedReport(res);
      toast.success('Complaint submitted successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    reset();
    setImages([]);
    setSubmittedReport(null);
    setStep(1);
  };

  // Success Confirmation View
  if (submittedReport) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6 animate-scale-in">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">Report Submitted!</h2>
          <p className="text-sm text-slate-500">
            Your complaint has been registered with ID{' '}
            <span className="font-bold text-blue-600">#{submittedReport.reportId}</span>
          </p>
          <p className="text-xs text-slate-400">
            Campus staff has been notified and you can track real-time updates in My Complaints.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={() => navigate('/complaints')}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
          >
            View My Complaints
          </button>
          <button
            onClick={handleReset}
            className="w-full sm:w-auto px-6 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Another Issue</span>
          </button>
        </div>
      </div>
    );
  }

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Report an Issue</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Submit facilities and infrastructure problems across campus
        </p>
      </div>

      <Stepper steps={['Issue Details', 'Location', 'Review']} currentStep={step} />

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* STEP 1: Details (Matching PDF page 5 layout) */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Card: Issue Category, Title, Description, Upload Photos */}
            <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Issue Category <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('category')}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-[11px] text-rose-500">{errors.category.message}</p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  {...register('title')}
                  type="text"
                  placeholder="Short title of the issue"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {errors.title && (
                  <p className="text-[11px] text-rose-500">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Describe the issue in detail..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
                {errors.description && (
                  <p className="text-[11px] text-rose-500">{errors.description.message}</p>
                )}
              </div>

              {/* Upload Photos */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-700">
                  Upload Photos <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <ImageUploader files={images} onChange={setImages} />
              </div>
            </div>

            {/* Right Card: Additional Information */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
                Additional Information
              </h3>

              {/* Building */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Building <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedBuildingId}
                  onChange={(e) => handleBuildingChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Select building</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
                {errors.building && (
                  <p className="text-[11px] text-rose-500">{errors.building.message}</p>
                )}
              </div>

              {/* Room / Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Room / Location <span className="text-rose-500">*</span>
                </label>
                <input
                  {...register('room')}
                  type="text"
                  placeholder="e.g., Room 104, Near Library"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {errors.room && (
                  <p className="text-[11px] text-rose-500">{errors.room.message}</p>
                )}
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Priority
                </label>
                <select
                  {...register('priority')}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 capitalize"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Next Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleNextFromStep1}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Location Picker */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm max-w-3xl mx-auto space-y-5 animate-fade-in">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Pin Location on Campus Map</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Targeting: {selectedBuilding?.name || 'Selected Campus Zone'}
              </p>
            </div>

            <LocationPicker
              lat={currentLat}
              lng={currentLng}
              buildingCoords={
                selectedBuilding
                  ? { lat: selectedBuilding.lat, lng: selectedBuilding.lng }
                  : undefined
              }
              onChange={(lat, lng) => {
                setValue('lat', lat);
                setValue('lng', lng);
              }}
            />

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 px-5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleNextFromStep2}
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2"
              >
                <span>Continue to Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Review & Submit */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm max-w-2xl mx-auto space-y-6 animate-fade-in">
            <h3 className="text-base font-bold text-slate-800 border-b pb-3">Review Your Complaint</h3>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400">Category:</span>
                  <p className="font-semibold text-slate-800 capitalize mt-0.5">
                    {watch('category')}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Priority:</span>
                  <p className="font-semibold text-slate-800 capitalize mt-0.5">
                    {watch('priority')}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Building:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {selectedBuilding?.name || 'Selected Building'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Room / Location:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{watch('room')}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400">Title:</span>
                <p className="font-semibold text-slate-800 text-sm mt-0.5">{watch('title')}</p>
              </div>

              <div>
                <span className="text-slate-400">Description:</span>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 mt-1">
                  {watch('description')}
                </p>
              </div>

              {images.length > 0 && (
                <div>
                  <span className="text-slate-400">Attached Photos ({images.length}):</span>
                  <div className="flex gap-2 mt-2">
                    {images.map((f, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[11px] font-medium"
                      >
                        {f.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-2.5 px-5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Report...</span>
                  </>
                ) : (
                  <span>Submit Report</span>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
