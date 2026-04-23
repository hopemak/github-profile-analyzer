import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from "../config";

const ActivityHeatmap = ({ username }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) {
      setLoading(true);
      axios.get(`${API_URL}/api/github/contributions/${username}`)
        .then(res => {
          const contributions = Array.isArray(res.data) ? res.data : [];
          setData(contributions.slice(0, 28));
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [username]);

  if (loading) return <div className="bg-white rounded-2xl shadow-md p-5 animate-pulse h-40"></div>;
  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
      <h3 className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2">
        <span>📅</span> Activity (last 28 days)
      </h3>
      <div className="grid grid-cols-7 gap-1.5">
        {data.map((day, idx) => {
          let bgColor = '#EDF2F7';
          if (day.count > 10) bgColor = '#1E40AF';
          else if (day.count > 5) bgColor = '#3B82F6';
          else if (day.count > 0) bgColor = '#93C5FD';
          return (
            <div
              key={idx}
              className="aspect-square rounded-md transition-all duration-150 hover:scale-110"
              style={{ backgroundColor: bgColor }}
              title={`${day.date}: ${day.count} commits`}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-3 text-xs text-gray-500 px-1">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-[#EDF2F7]"></div>
          <div className="w-3 h-3 rounded-sm bg-[#93C5FD]"></div>
          <div className="w-3 h-3 rounded-sm bg-[#3B82F6]"></div>
          <div className="w-3 h-3 rounded-sm bg-[#1E40AF]"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
