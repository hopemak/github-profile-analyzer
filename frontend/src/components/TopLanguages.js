import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const TopLanguages = ({ languages }) => {
  const safeLanguages = Array.isArray(languages) ? languages : [];
  if (safeLanguages.length === 0) return null;

  const data = safeLanguages.map(lang => ({ name: lang.name, value: lang.count }));
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100 transition-all duration-300 hover:shadow-lg">
      <h3 className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2">
        <span>📊</span> Top Languages
      </h3>
      <div className="flex justify-center">
        <PieChart width={300} height={280}>
          <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
            {data.map((entry, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </div>
    </div>
  );
};

export default TopLanguages;
