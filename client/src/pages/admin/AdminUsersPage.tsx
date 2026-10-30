import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import UsersTable from '../../components/admin/UsersTable';
import type { AdminUser } from '../../types/admin';
import type { Role } from '../../types';
import { Search, ChevronLeft, ChevronRight, RefreshCw, X } from 'lucide-react';

const ROLE_TABS: { label: string; value?: Role }[] = [
  { label: 'All Users', value: undefined },
  { label: 'Students', value: 'student' },
  { label: 'Staff', value: 'staff' },
  { label: 'Admins', value: 'admin' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.users({
        role: selectedRole,
        search: search.trim() || undefined,
        page,
      });
      setUsers(res.data);
      setTotal(res.meta.total);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, selectedRole, search]);

  const totalPages = Math.ceil(total / 20) || 1;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            User Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student, staff, and admin accounts, assign roles, and toggle access
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          title="Refresh users"
          className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Controls Bar: Search & Role Filter Tabs */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, roll number..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold self-start sm:self-auto">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.label}
                onClick={() => {
                  setSelectedRole(tab.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedRole === tab.value
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <UsersTable
        users={users}
        onUserUpdated={fetchUsers}
        loading={loading}
      />

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 py-2 text-xs text-slate-500">
          <span>
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} accounts
          </span>

          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="px-2 font-medium text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
