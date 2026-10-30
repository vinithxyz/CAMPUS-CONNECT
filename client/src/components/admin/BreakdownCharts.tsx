import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import EmptyState from '../ui/EmptyState';
import type { Category, Priority } from '../../types';

interface Props {
  byCategory: { category: Category; count: number }[];
  byBuilding: { name: string; count: number }[];
  byPriority: { priority: Priority; count: number }[];
  loading?: boolean;
}

const CATEGORY_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#64748b',
];

const PRIORITY_COLORS: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#9333ea',
};

export default function BreakdownCharts({ byCategory, byBuilding, byPriority, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl p-5 border border-slate-100 h-72 animate-pulse" />
        <div className="bg-white rounded-xl p-5 border border-slate-100 h-72 animate-pulse" />
        <div className="bg-white rounded-xl p-5 border border-slate-100 h-72 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Category Breakdown */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-2xs space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">By Category</h3>
          <p className="text-xs text-slate-400">Distribution across problem categories</p>
        </div>
        {byCategory.length === 0 ? (
          <EmptyState title="No data" description="No reports found for this time range" />
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {byCategory.map((_, index) => (
                    <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${value} issues`,
                    typeof name === 'string' ? name.toUpperCase() : name,
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Building Breakdown */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-2xs space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Top Locations</h3>
          <p className="text-xs text-slate-400">Buildings with most reported issues</p>
        </div>
        {byBuilding.length === 0 ? (
          <EmptyState title="No data" description="No reports found for this time range" />
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byBuilding}
                layout="vertical"
                margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  width={90}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(val: any) => [`${val} issues`, 'Count']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Priority Breakdown */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-2xs space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">By Priority</h3>
          <p className="text-xs text-slate-400">Severity profile of submitted issues</p>
        </div>
        {byPriority.length === 0 ? (
          <EmptyState title="No data" description="No reports found for this time range" />
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPriority} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis
                  dataKey="priority"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(val: any) => [`${val} issues`, 'Priority Count']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {byPriority.map((entry) => (
                    <Cell
                      key={entry.priority}
                      fill={PRIORITY_COLORS[entry.priority] ?? '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
