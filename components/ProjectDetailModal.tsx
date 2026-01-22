
import React, { useState, useMemo } from 'react';
import { Project, ProjectItem } from '../types';
import { breakdownProject } from '../services/geminiService';
import { getTodayStr } from '../services/dateService';

interface ProjectDetailModalProps {
  project: Project;
  onClose: () => void;
  onUpdate: (updatedProject: Project) => void;
  onUpdateItem: (projectId: string, item: ProjectItem) => void;
  onAddItem: (projectId: string, item: ProjectItem) => void;
  onRemoveItem: (projectId: string, itemId: string) => void;
  onDelete: () => void;
}

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ 
  project, onClose, onUpdate, onUpdateItem, onAddItem, onRemoveItem, onDelete 
}) => {
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editData, setEditData] = useState({ 
    title: project.title, 
    description: project.description, 
    deadline: project.deadline 
  });
  
  // 새 Task 입력을 위한 상태 (제목과 날짜)
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDeadline, setNewItemDeadline] = useState(getTodayStr());
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const todayStr = getTodayStr();

  const progress = useMemo(() => {
    const total = project.items.length;
    if (total === 0) return 0;
    const completed = project.items.filter(i => i.completed).length;
    return Math.round((completed / total) * 100);
  }, [project.items]);

  const sortedItems = useMemo(() => {
    return [...project.items].sort((a, b) => {
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    });
  }, [project.items]);

  const handleSaveHeader = () => {
    onUpdate({ ...project, ...editData });
    setIsEditingHeader(false);
  };

  const handleBreakdown = async () => {
    setIsAiLoading(true);
    const steps = await breakdownProject(project);
    steps.forEach(step => {
      onAddItem(project.id, { 
        id: crypto.randomUUID(), 
        title: step, 
        completed: false,
        deadline: project.deadline || todayStr // 프로젝트 마감일을 기본값으로 제안
      });
    });
    setIsAiLoading(false);
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    
    onAddItem(project.id, { 
      id: crypto.randomUUID(), 
      title: newItemTitle.trim(), 
      completed: false,
      deadline: newItemDeadline 
    });
    
    // 입력창 초기화
    setNewItemTitle('');
    // 날짜는 연속 입력을 위해 유지하거나 오늘로 초기화
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-8 border-b border-slate-100 relative bg-white">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>

          {isEditingHeader ? (
            <div className="space-y-4 pr-12">
              <input 
                type="text" 
                value={editData.title} 
                onChange={e => setEditData({...editData, title: e.target.value})}
                className="w-full text-2xl font-black bg-slate-50 border-none p-2 rounded-xl focus:ring-2 focus:ring-blue-100"
                placeholder="프로젝트 제목"
              />
              <textarea 
                value={editData.description} 
                onChange={e => setEditData({...editData, description: e.target.value})}
                className="w-full text-sm text-slate-500 bg-slate-50 border-none p-2 rounded-xl focus:ring-2 focus:ring-blue-100"
                rows={2}
                placeholder="프로젝트 설명"
              />
              <div className="flex items-center space-x-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Project Deadline:</span>
                <input 
                  type="date" 
                  value={editData.deadline} 
                  onChange={e => setEditData({...editData, deadline: e.target.value})}
                  className="bg-orange-50 text-orange-600 border-none p-2 rounded-xl text-xs font-black focus:ring-2 focus:ring-orange-100 cursor-pointer"
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <button onClick={handleSaveHeader} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-200 hover:bg-blue-700">변경사항 저장</button>
                <button onClick={() => setIsEditingHeader(false)} className="px-6 py-2 text-slate-400 text-xs font-bold hover:text-slate-600">취소</button>
              </div>
            </div>
          ) : (
            <div className="pr-12">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Active Project</span>
                <button onClick={() => setIsEditingHeader(true)} className="text-[10px] font-bold text-slate-300 hover:text-blue-500 transition-colors">Edit Details</button>
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{project.title}</h3>
              <p className="text-slate-500 mt-2 text-sm leading-relaxed">{project.description || 'No description provided.'}</p>
              
              <div className="flex items-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <i className="far fa-calendar-check text-orange-500 text-sm"></i>
                  <span className="text-sm font-bold text-slate-700">{project.deadline || 'No Deadline Set'}</span>
                </div>
                <div className="flex-1 max-w-[200px]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Progress</span>
                    <span className="text-[10px] font-black text-blue-600">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Body: Task List */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
              <i className="fas fa-tasks mr-2 text-blue-500"></i>
              Project Tasks & Deadlines
            </h4>
            <button 
              onClick={handleBreakdown} 
              disabled={isAiLoading}
              className="text-[10px] font-black text-blue-600 hover:text-blue-700 flex items-center bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100 disabled:opacity-50"
            >
              <i className={`fas ${isAiLoading ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'} mr-1.5`}></i>
              AI Smart Breakdown
            </button>
          </div>

          <div className="space-y-3">
            {sortedItems.map(item => (
              <div 
                key={item.id} 
                className={`flex flex-col bg-white p-4 rounded-2xl border transition-all shadow-sm group/item ${
                  item.deadline && item.deadline < todayStr && !item.completed ? 'border-orange-200 bg-orange-50/10' : 'border-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => onUpdateItem(project.id, { ...item, completed: !item.completed })}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      item.completed ? 'bg-blue-500 border-blue-500' : 'border-slate-300'
                    }`}
                  >
                    {item.completed && <i className="fas fa-check text-[8px] text-white"></i>}
                  </button>
                  <input 
                    type="text" 
                    value={item.title} 
                    onChange={(e) => onUpdateItem(project.id, { ...item, title: e.target.value })}
                    className={`flex-1 text-sm bg-transparent border-none focus:ring-0 p-0 ${item.completed ? 'line-through text-slate-300 font-medium' : 'text-slate-700 font-bold'}`}
                  />
                  <button 
                    onClick={() => onRemoveItem(project.id, item.id)}
                    className="text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100"
                  >
                    <i className="fas fa-trash-can text-xs"></i>
                  </button>
                </div>
                
                <div className="flex items-center space-x-3 mt-2 pl-8">
                  <div className="flex items-center space-x-1.5 group/itemdate">
                    <i className={`far fa-clock text-[10px] ${item.deadline && item.deadline < todayStr && !item.completed ? 'text-orange-500' : 'text-slate-300'}`}></i>
                    <input 
                      type="date" 
                      value={item.deadline || ''} 
                      onChange={(e) => onUpdateItem(project.id, { ...item, deadline: e.target.value })}
                      className={`text-[10px] font-black border-none p-0 bg-transparent focus:ring-0 cursor-pointer ${
                        item.deadline === todayStr ? 'text-blue-600' : 
                        item.deadline && item.deadline < todayStr && !item.completed ? 'text-orange-600' : 'text-slate-400 hover:text-blue-500'
                      }`}
                    />
                  </div>
                  {item.deadline && item.deadline < todayStr && !item.completed && (
                    <span className="text-[8px] font-black text-orange-500 bg-orange-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">Overdue</span>
                  )}
                </div>
              </div>
            ))}

            {project.items.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-3xl">
                <p className="text-xs text-slate-400 font-medium italic">작업이 없습니다. 아래에서 세부 할 일을 추가해보세요.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer: Dual Quick Add [Title + Deadline] */}
        <div className="p-6 bg-white border-t border-slate-100">
          <form onSubmit={handleAddNewItem} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={newItemTitle}
                  onChange={e => setNewItemTitle(e.target.value)}
                  placeholder="세부 할 일 제목을 입력하세요..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-inner"
                />
              </div>
              <div className="w-40 relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <i className="far fa-calendar-alt text-slate-300 group-focus-within:text-blue-500 transition-colors"></i>
                </div>
                <input 
                  type="date" 
                  value={newItemDeadline}
                  onChange={e => setNewItemDeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3.5 text-xs font-black text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                />
              </div>
              <button 
                type="submit"
                disabled={!newItemTitle.trim()}
                className="bg-blue-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-30 active:scale-95"
              >
                <i className="fas fa-plus text-lg"></i>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-2">
              <i className="fas fa-info-circle mr-1"></i> 마감일을 입력하면 주간 대시보드와 일일 계획에 자동 연동됩니다.
            </p>
          </form>
          
          <div className="mt-8 flex justify-between items-center px-2">
            <button 
              onClick={() => { if(confirm('정말로 이 프로젝트를 삭제하시겠습니까?')) onDelete(); }}
              className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest flex items-center transition-colors"
            >
              <i className="fas fa-trash-can mr-1.5"></i>
              Delete Project
            </button>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Live Syncing Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailModal;
