import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Project } from '../../types/project';
import { useTheme } from '../../context/ThemeContext';
import { formatINR } from '../../engine/fraudDetector';

interface Props {
  projects: Project[];
}

export const FinancialOverviewChart: React.FC<Props> = ({ projects }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Take top projects that have both sanctioned and expenditure recorded
  const comparable = projects
    .filter(
      (p) =>
        p.sanctionedAmount > 0 &&
        p.recordedExpenditure !== undefined &&
        p.recordedExpenditure !== null &&
        p.recordedExpenditure >= 0
    )
    .slice(0, 6)
    .map((p) => ({
      name: p.id.split('-').slice(2).join('-') || p.title.substring(0, 12),
      fullName: p.title,
      sanctionedLakhs: Number((p.sanctionedAmount / 100000).toFixed(2)),
      expenditureLakhs: Number(((p.recordedExpenditure || 0) / 100000).toFixed(2)),
      rawSanctioned: p.sanctionedAmount,
      rawExpenditure: p.recordedExpenditure || 0,
    }));

  if (comparable.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No projects with comparable financial ledger amounts available.
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={comparable} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} vertical={false} />
          <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
          <YAxis
            stroke={isDark ? '#94a3b8' : '#64748b'}
            fontSize={11}
            tickLine={false}
            tickFormatter={(val) => `₹${val}L`}
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
            formatter={(value: any, name: any, item: any) => {
              if (name === 'sanctionedLakhs') return [formatINR(item.payload.rawSanctioned), 'Sanctioned Budget'];
              return [formatINR(item.payload.rawExpenditure), 'Recorded Expenditure'];
            }}
            labelFormatter={(label, payload) => {
              const full = payload[0]?.payload?.fullName;
              return full ? `${label}: ${full.substring(0, 35)}...` : label;
            }}
          />
          <Legend
            verticalAlign="top"
            height={30}
            formatter={(val) => (
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                {val === 'sanctionedLakhs' ? 'Sanctioned Budget' : 'Recorded Expenditure'}
              </span>
            )}
          />
          <Bar dataKey="sanctionedLakhs" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={30} />
          <Bar dataKey="expenditureLakhs" fill="#f97316" radius={[3, 3, 0, 0]} maxBarSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
