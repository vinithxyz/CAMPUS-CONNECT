import { useState } from 'react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import type { AdminUser } from '../../types/admin';
import type { Role } from '../../types';
import { Shield, UserX, UserCheck, AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal';

interface Props {
  users: AdminUser[];
  onUserUpdated: () => void;
  loading?: boolean;
}

export default function UsersTable({ users, onUserUpdated, loading }: Props) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    user: AdminUser | null;
    action: 'role' | 'toggleActive';
    newRole?: Role;
  }>({
    open: false,
    user: null,
    action: 'role',
  });

  const [mutating, setMutating] = useState(false);

  const handleRoleSelect = (targetUser: AdminUser, newRole: Role) => {
    if (targetUser.role === newRole) return;
    setConfirmModal({
      open: true,
      user: targetUser,
      action: 'role',
      newRole,
    });
  };

  const handleActiveToggle = (targetUser: AdminUser) => {
    setConfirmModal({
      open: true,
      user: targetUser,
      action: 'toggleActive',
    });
  };

  const executeAction = async () => {
    const { user, action, newRole } = confirmModal;
    if (!user) return;

    try {
      setMutating(true);
      if (action === 'role' && newRole) {
        await adminService.updateUser(user._id, { role: newRole });
        toast.success(`Role for ${user.name} updated to ${newRole}`);
      } else if (action === 'toggleActive') {
        const nextState = !user.isActive;
        await adminService.updateUser(user._id, { isActive: nextState });
        toast.success(
          `Account for ${user.name} ${nextState ? 'activated' : 'deactivated'}`
        );
      }
      onUserUpdated();
      setConfirmModal({ open: false, user: null, action: 'role' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMutating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden p-4 space-y-3 shadow-2xs">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-slate-50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 sticky top-0">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Identifier / Email</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isSelf = currentUser?.id === u._id;

                return (
                  <tr
                    key={u._id}
                    className={`hover:bg-slate-50/70 transition ${
                      !u.isActive ? 'bg-slate-50/50 opacity-75' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-2">
                        <span>{u.name}</span>
                        {isSelf && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                            You
                          </span>
                        )}
                      </div>
                      {u.rollNumber && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {u.rollNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{u.email}</td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        disabled={isSelf}
                        onChange={(e) => handleRoleSelect(u, e.target.value as Role)}
                        className={`py-1 px-2.5 rounded-lg border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          isSelf
                            ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <option value="student">Student</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Deactivated
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleActiveToggle(u)}
                        disabled={isSelf}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition inline-flex items-center gap-1.5 ${
                          isSelf
                            ? 'opacity-40 cursor-not-allowed text-slate-400'
                            : u.isActive
                            ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                            : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Deactivate</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Activate</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmModal.open && confirmModal.user && (
        <Modal
          isOpen={confirmModal.open}
          onClose={() => setConfirmModal({ open: false, user: null, action: 'role' })}
          title="Confirm User Modification"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
              <p>
                {confirmModal.action === 'role'
                  ? `Change ${confirmModal.user.name}'s role to ${confirmModal.newRole}?`
                  : confirmModal.user.isActive
                  ? `Deactivate ${confirmModal.user.name}? They will immediately lose access to CampusConnect.`
                  : `Reactivate ${confirmModal.user.name}'s account?`}
              </p>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal({ open: false, user: null, action: 'role' })}
                disabled={mutating}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeAction}
                disabled={mutating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                {mutating ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
