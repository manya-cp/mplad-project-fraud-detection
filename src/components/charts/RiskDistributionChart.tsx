import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Project } from '../../types/project';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  projects: Project[];
}

export const RiskDistributionChart: React.FC<Props> = ({ projects }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const counts: Record<string, number> = {
    Low: 0,
    Moderate: 0,
    High: 0,
    Critical: 0,
    'Not Evaluated': 0,
  };

  projects.forEach((p) => {
    if (p.riskCategory) {
      if (p.riskCategory === 'Insufficient Data') {
        counts['Not Evaluated'] = (counts['Not Evaluated'] || 0) + 1;
      } else {
        counts[p.riskCategory] = (counts[p.riskCategory] || 0) + 1;
      }
    } else {
      counts['Not Evaluated'] = (counts['Not Evaluated'] || 0) + 1;
    }
  });

  const data = [
    { name: 'Low Risk', value: counts['Low'], color: '#10b981' },
    { name: 'Moderate Risk', value: counts['Moderate'], color: '#f59e0b' },
    { name: 'High Risk', value: counts['High'], color: '#f97316' },
    { name: 'Critical Risk', value: counts['Critical'], color: '#ef4444' },
    { name: 'Not Evaluated', value: counts['Not Evaluated'], color: '#94a3b8' },
  ].filter((d) => d.value > 0);

  if (projects.length === 0 || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No project records available for risk distribution.
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              color: isDark ? '#f8fafc' : '#0f172a',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            formatter={(value: any) => [`${value} projects`, 'Count']}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
