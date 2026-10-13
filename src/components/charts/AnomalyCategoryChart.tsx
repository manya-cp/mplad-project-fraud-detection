import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Project } from '../../types/project';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  projects: Project[];
}

export const AnomalyCategoryChart: React.FC<Props> = ({ projects }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const categoryCounts: Record<string, number> = {
    Expenditure: 0,
    Timeline: 0,
    'Data Integrity': 0,
    'Cost Deviation': 0,
    Duplication: 0,
    'Status Mismatch': 0,
  };

  projects.forEach((p) => {
    if (p.findings && Array.isArray(p.findings)) {
      p.findings.forEach((f) => {
        if (categoryCounts[f.category] !== undefined) {
          categoryCounts[f.category]++;
        } else {
          categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1;
        }
      });
    }
  });

  const data = Object.entries(categoryCounts)
    .map(([cat, count]) => ({ category: cat, count }))
    .filter((d) => d.count > 0);

  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-400 p-4 text-center">
        <span>No warning anomalies flagged across currently evaluated projects.</span>
        <span className="text-[11px] text-slate-500 mt-1">Run analysis on imported records to populate category breakdown.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} horizontal={false} />
          <XAxis type="number" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="category"
            stroke={isDark ? '#94a3b8' : '#64748b'}
            fontSize={11}
            tickLine={false}
            width={100}
          />
          <Tooltip
            cursor={{ fill: isDark ? '#1e293b' : '#f8fafc' }}
            contentStyle={{
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              color: isDark ? '#f8fafc' : '#0f172a',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            formatter={(val: any) => [`${val} warnings`, 'Detected']}
          />
          <Bar dataKey="count" fill="#dc2626" radius={[0, 4, 4, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
