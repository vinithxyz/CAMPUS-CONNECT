import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { Category } from '../../types';

interface Props {
  data: { category: Category; count: number }[];
  total: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  electrical: '#f59e0b', // amber
  plumbing: '#0ea5e9', // blue
  mechanical: '#10b981', // green
  civil: '#ef4444', // red
  sanitation: '#8b5cf6', // purple
  wifi: '#6366f1', // indigo
  hostel: '#ec4899', // pink
  canteen: '#14b8a6', // teal
  safety: '#f97316', // orange
  other: '#94a3b8', // slate
};

export default function CategoryDoughnut({ data, total }: Props) {
  if (total === 0 || !data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col items-center justify-center h-64 text-center">
        <p className="text-xs text-slate-400">No complaints reported yet</p>
      </div>
    );
  }

  // Top 4 categories + group remainder as Others
  const top4 = data.slice(0, 4);
  const othersCount = data.slice(4).reduce((sum, item) => sum + item.count, 0);

  const chartData = [
    ...top4.map((d) => ({
      name: d.category.charAt(0).toUpperCase() + d.category.slice(1),
      count: d.count,
      color: CATEGORY_COLORS[d.category] || '#3b82f6',
      percent: Math.round((d.count / total) * 100),
    })),
  ];

  if (othersCount > 0) {
    chartData.push({
      name: 'Others',
      count: othersCount,
      color: '#94a3b8',
      percent: Math.round((othersCount / total) * 100),
    });
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Issue Categories</h3>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Doughnut Chart */}
        <div className="w-40 h-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="name"
                innerRadius={45}
                outerRadius={68}
                paddingAngle={3}
                stroke="#ffffff"
                strokeWidth={2}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => [`${val} (${Math.round((val / total) * 100)}%)`, 'Issues']}
                contentStyle={{
                  borderRadius: '10px',
                  fontSize: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-2">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-600 font-medium">{item.name}</span>
              </div>
              <span className="font-semibold text-slate-700">{item.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
