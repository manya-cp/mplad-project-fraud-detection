import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Project } from '../../types/project';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  projects: Project[];
}

export const ProjectStatusChart: React.FC<Props> = ({ projects }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const statusMap: Record<string, number> = {
    Completed: 0,
    'In Progress': 0,
    Sanctioned: 0,
    Proposed: 0,
    Stalled: 0,
  };

  projects.forEach((p) => {
    if (statusMap[p.status] !== undefined) {
      statusMap[p.status]++;
    } else {
      statusMap[p.status] = 1;
    }
  });

  const data = Object.entries(statusMap)
    .map(([status, count]) => ({ status, count }))
    .filter((d) => d.count > 0);

  if (projects.length === 0 || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No project records available for status breakdown.
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} vertical={false} />
          <XAxis
            dataKey="status"
            stroke={isDark ? '#94a3b8' : '#64748b'}
            fontSize={11}
            tickLine={false}
            interval={0}
            angle={-15}
            textAnchor="end"
          />
          <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: isDark ? '#1e293b' : '#f8fafc' }}
            contentStyle={{
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              color: isDark ? '#f8fafc' : '#0f172a',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            formatter={(val: any) => [`${val} projects`, 'Total']}
          />
          <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={45} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
