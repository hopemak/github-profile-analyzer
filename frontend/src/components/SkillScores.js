import React from 'react';

const SkillScores = ({ scores }) => {
  if (!scores) return null;
  const items = [
    { label: 'Problem Solving', key: 'problemSolving', color: 'from-blue-500 to-blue-700' },
    { label: 'Code Quality', key: 'codeQuality', color: 'from-emerald-500 to-emerald-700' },
    { label: 'Consistency', key: 'consistency', color: 'from-amber-500 to-amber-700' },
    { label: 'Collaboration', key: 'collaboration', color: 'from-purple-500 to-purple-700' },
  ];
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
      <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
        <span>📈</span> Skill Scores
      </h3>
      <div className="space-y-4">
        {items.map(item => {
          const value = scores[item.key] || 0;
          return (
            <div key={item.key}>
              <div className="flex justify-between text-sm font-medium text-gray-700 mb-1.5">
                <span>{item.label}</span>
                <span className="text-gray-900">{value}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`bg-gradient-to-r ${item.color} h-2.5 rounded-full transition-all duration-700 ease-out`}
                  style={{ width: `${(value / 10) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillScores;
