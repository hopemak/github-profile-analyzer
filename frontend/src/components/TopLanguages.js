import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const TopLanguages = ({ languages }) => {
  const safeLanguages = Array.isArray(languages) ? languages : [];
  if (safeLanguages.length === 0) return null;

  const data = safeLanguages.map(lang => ({ name: lang.name, value: lang.count }));
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
      <h3 className="font-semibold text-lg text-white mb-3 flex items-center gap-2">
        <span>📊</span> Top Languages
      </h3>
      <div className="flex justify-center">
        <PieChart width={300} height={280}>
          <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
            {data.map((entry, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: 'white' }} />
          <Legend wrapperStyle={{ color: 'white' }} />
        </PieChart>
      </div>
    </div>
  );
};

export default TopLanguages;
