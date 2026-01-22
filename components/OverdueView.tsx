
import React, { useMemo } from 'react';
import { Task } from '../types';
import { getTodayStr } from '../services/dateService';

interface OverdueViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onUpdateTaskDate: (taskId: string, newDate: string) => void;
}

const OverdueView: React.FC<OverdueViewProps> = ({ tasks, setTasks, onUpdateTaskDate }) => {
  const todayStr = getTodayStr();

  // 완료되지 않았고 날짜가 오늘보다 이전인 작업들
  const overdueTasks = useMemo(() => {
    return tasks.filter(t => !t.completed && t.date < todayStr);
  }, [tasks, todayStr]);

  const projectOverdue = overdueTasks.filter(t => t.projectId || t.category === 'Projects');
  const areaOverdue = overdueTasks.filter(t => !t.projectId && t.category === 'Areas');
  const otherOverdue = overdueTasks.filter(t => t.category !== 'Projects' && t.category !== 'Areas');

  const handleMoveToToday = (taskId: string) => {
    onUpdateTaskDate(taskId, todayStr);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const renderTaskCard = (task: Task) => (
    <div 
      key={task.id}
      className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col space-y-3 group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <button 
            onClick={() => toggleTask(task.id)}
            className="mt-0.5 w-5 h-5 rounded-full border-2 border-orange-200 flex items-center justify-center hover:bg-orange-50"
          >
            {task.completed && <i className="fas fa-check text-[8px] text-orange-500"></i>}
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-700">{task.title}</span>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-[9px] font-black text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded uppercase">
                Overdue: {task.date}
              </span>
              {task.projectId && (
                <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded uppercase">
                  Project Linked
                </span>
              )}
            </div>
          </div>
        </div>
        <button 
          onClick={() => deleteTask(task.id)}
          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
        >
          <i className="fas fa-trash-can text-xs"></i>
        </button>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
        <div className="flex items-center space-x-2">
          <i className="fas fa-calendar-plus text-[10px] text-slate-300"></i>
          <input 
            type="date"
            value={task.date}
            onChange={(e) => onUpdateTaskDate(task.id, e.target.value)}
            className="text-[10px] font-black text-slate-500 bg-transparent border-none p-0 focus:ring-0 cursor-pointer hover:text-blue-500"
          />
        </div>
        <button 
          onClick={() => handleMoveToToday(task.id)}
          className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
        >
          오늘로 변경
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter flex items-center">
            <i className="fas fa-clock-rotate-left text-orange-500 mr-3"></i>
            Overdue Recovery
          </h2>
          <p className="text-slate-500 mt-1 font-medium italic">밀린 일정을 다시 계획하고 프로젝트의 흐름을 되찾으세요.</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 px-6 py-3 rounded-[2rem]">
          <span className="text-xs font-black text-orange-600 uppercase tracking-widest">미완료 항목: {overdueTasks.length}개</span>
        </div>
      </header>

      {overdueTasks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-check-double text-emerald-500 text-2xl"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800">모든 일정이 최신 상태입니다!</h3>
          <p className="text-slate-400 mt-2 font-medium">밀린 일정이 하나도 없네요. 훌륭합니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Projects Section */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2 px-2 border-b border-slate-100 pb-2">
              <i className="fas fa-diagram-project text-orange-500 text-sm"></i>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Project Tasks ({projectOverdue.length})</h3>
            </div>
            <div className="space-y-3">
              {projectOverdue.length > 0 ? (
                projectOverdue.map(renderTaskCard)
              ) : (
                <p className="text-xs text-slate-300 italic py-4 px-2">밀린 프로젝트 일정이 없습니다.</p>
              )}
            </div>
          </section>

          {/* Areas Section */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2 px-2 border-b border-slate-100 pb-2">
              <i className="fas fa-layer-group text-blue-500 text-sm"></i>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Area Tasks ({areaOverdue.length})</h3>
            </div>
            <div className="space-y-3">
              {areaOverdue.length > 0 ? (
                areaOverdue.map(renderTaskCard)
              ) : (
                <p className="text-xs text-slate-300 italic py-4 px-2">밀린 영역(Areas) 일정이 없습니다.</p>
              )}
            </div>
          </section>

          {otherOverdue.length > 0 && (
            <section className="col-span-full mt-4 space-y-4">
              <div className="flex items-center space-x-2 px-2 border-b border-slate-100 pb-2">
                <i className="fas fa-box-archive text-slate-400 text-sm"></i>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Other Tasks ({otherOverdue.length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherOverdue.map(renderTaskCard)}
              </div>
            </section>
          )}
        </div>
      )}
      
      {overdueTasks.length > 0 && (
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="text-center md:text-left">
            <h4 className="text-xl font-bold">빠른 복구 전략</h4>
            <p className="text-slate-400 text-sm mt-1">오늘 처리 가능한 일들만 골라 날짜를 변경해보세요.</p>
          </div>
          <button 
            onClick={() => overdueTasks.forEach(t => handleMoveToToday(t.id))}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            모든 작업을 오늘로 이동하기
          </button>
        </div>
      )}
    </div>
  );
};

export default OverdueView;
