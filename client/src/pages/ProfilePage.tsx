import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, ClipboardList, Shield, LogOut, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
import { getErrorMessage } from '../services/api';

interface ProfileForm {
  name: string;
  rollNumber: string;
}

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit } = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name || '',
      rollNumber: user?.rollNumber || '',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    try {
      setSaving(true);
      const updated = await authService.updateProfile(data);
      updateUser(updated);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">My Profile</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage your personal account details</p>
      </div>

      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-6">
        {/* User Card Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 font-bold text-lg flex items-center justify-center border-2 border-blue-200 shrink-0">
            {user?.name?.slice(0, 2).toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">{user?.name}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100 capitalize">
                <Shield className="w-3 h-3" />
                {user?.role} Account
              </span>
              {user?.rollNumber && (
                <span className="text-[11px] font-mono text-slate-400">
                  ID: {user.rollNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Update Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                {...register('name', { required: true })}
                type="text"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Roll Number / Student ID
            </label>
            <div className="relative">
              <ClipboardList className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                {...register('rollNumber')}
                type="text"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
              />
            </div>
          </div>

          <div className="space-y-1.5 opacity-70">
            <label className="text-xs font-semibold text-slate-700">Email Address (Read-only)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => logout()}
              className="py-2.5 px-4 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
