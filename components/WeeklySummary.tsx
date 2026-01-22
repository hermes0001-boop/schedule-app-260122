
import React from 'react';
import { Task, Project } from '../types';
import { getTodayStr, formatDateToKey } from '../services/dateService';

interface WeeklySummaryProps {
  tasks: Task[];
  projects: Project[];
  onDateClick: (date: string) => void;
  selectedDate: string;
}

const WeeklySummary: React.FC<WeeklySummaryProps> = ({ tasks, projects, onDateClick, selectedDate }) => {
  const todayStr = getTodayStr();
  
  // 현재 'In Progress' 상태인 전체 프로젝트 개수 (헤더 요약용)
  const activeProjectTotal = projects.filter(p => p.status === 'In Progress').length;

  // 로컬 시간 기준 오늘부터 7일간의 날짜 키 생성
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return formatDateToKey(d);
  });

  const getDaySummary = (date: string) => {
    const dayTasks = tasks.filter(t => t.date === date);
    
    // 해당 날짜에 할당된 프로젝트 관련 Task (projectId가 있거나 카테고리가 Projects인 것)
    const projectCount = dayTasks.filter(t => t.projectId || t.category === 'Projects').length;
    
    // 일반 Area Tasks (projectId가 없으면서 카테고리가 Areas인 것)
    const areaCount = dayTasks.filter(t => t.category === 'Areas' && !t.projectId).length;
    
    return {
      projectCount,
      areaCount,
      total: dayTasks.length
    };
  };

  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { weekday: 'short' };
    return new Intl.DateTimeFormat('ko-KR', options).format(d);
  };

  const getDayNum = (dateStr: string) => dateStr.split('-')[2];

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 mb-8 overflow-hidden">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter flex items-center">
          <i className="fas fa-chart-line text-blue-500 mr-2"></i>
          7-Day Weekly Pulse
        </h3>
        <div className="flex items-center space-x-3">
           <span className="text-[10px] font-bold text-slate-400">Next 7 Days View</span>
           <div className="flex items-center space-x-1 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
             <span className="text-[9px] font-black text-orange-600 uppercase">Active Proj: {activeProjectTotal}</span>
           </div>
        </div>
      </div>
      
      <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
        {next7Days.map((date) => {
          const summary = getDaySummary(date);
          const isSelected = selectedDate === date;
          const isToday = date === todayStr;

          return (
            <button
              key={date}
              onClick={() => onDateClick(date)}
              className={`flex-shrink-0 w-24 p-3 rounded-2xl border transition-all flex flex-col items-center ${
                isSelected 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                  : isToday
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-300'
              }`}
            >
              <span className={`text-[10px] font-black uppercase ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                {getDayName(date)}
              </span>
              <span className="text-xl font-black my-1">{getDayNum(date)}</span>
              
              <div className="mt-2 space-y-1 w-full">
                {/* 해당 날짜에 프로젝트 Task가 있는 경우에만 표시 */}
                {summary.projectCount > 0 && (
                  <div className={`flex items-center justify-between px-1.5 py-0.5 rounded-md text-[9px] font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'}`}>
                    <span>PROJ</span>
                    <span>{summary.projectCount}</span>
                  </div>
                )}
                
                {summary.areaCount > 0 && (
                  <div className={`flex items-center justify-between px-1.5 py-0.5 rounded-md text-[9px] font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'}`}>
                    <span>TASKS</span>
                    <span>{summary.areaCount}</span>
                  </div>
                )}
                
                {summary.projectCount === 0 && summary.areaCount === 0 && (
                  <div className="h-4 flex items-center justify-center">
                    <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/40' : 'bg-slate-200'}`}></div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklySummary;
