
import React, { useState, useMemo } from 'react';
import { Task, ParaCategory, Project, ProjectItem } from '../types';
import { categorizeTask, summarizeLink, generateShortSlug } from '../services/geminiService';
import WeeklySummary from './WeeklySummary';
import ProjectDetailModal from './ProjectDetailModal';
import { getTodayStr } from '../services/dateService';

interface DailyViewProps {
  tasks: Task[];
  projects: Project[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onAddTask: (title: string, category: ParaCategory, date: string, metadata?: Task['linkMetadata']) => void;
  onUpdateTaskDate: (taskId: string, newDate: string) => void;
  onUpdateProject: (updatedProject: Project) => void;
  onUpdateProjectItem: (projectId: string, item: ProjectItem) => void;
  onAddProjectItem: (projectId: string, item: ProjectItem) => void;
  onRemoveProjectItem: (projectId: string, itemId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

const DailyView: React.FC<DailyViewProps> = ({ 
  tasks, projects, setTasks, onAddTask, onUpdateTaskDate, 
  onUpdateProject, onUpdateProjectItem, onAddProjectItem, onRemoveProjectItem, onDeleteProject 
}) => {
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [manualCategory, setManualCategory] = useState<ParaCategory | 'Auto'>('Auto');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [expandedArchiveId, setExpandedArchiveId] = useState<string | null>(null);
  
  // 객체 대신 ID를 저장하여 항상 최신 프로젝트 데이터를 참조하도록 수정
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const todayStr = getTodayStr();

  const filteredTasksByDate = useMemo(() => {
    return tasks.filter(task => task.date === selectedDate);
  }, [tasks, selectedDate]);

  const activeProjects = useMemo(() => {
    return projects.filter(p => p.status === 'In Progress');
  }, [projects]);

  // 선택된 ID에 해당하는 최신 프로젝트 객체 추출
  const currentSelectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const isUrl = (text: string) => text.startsWith('http');

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    let finalCategory: ParaCategory;
    let linkMeta: Task['linkMetadata'] | undefined = undefined;

    setIsAiLoading(true);

    if (isUrl(newTaskTitle)) {
      try {
        const urlObj = new URL(newTaskTitle);
        const domain = urlObj.hostname.replace('www.', '');
        const [displayTitle, slug] = await Promise.all([
          summarizeLink(newTaskTitle),
          generateShortSlug(newTaskTitle)
        ]);
        
        linkMeta = {
          displayTitle,
          domain,
          favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
          slug,
          isPinned: false
        };
        finalCategory = manualCategory === 'Auto' ? 'Resources' : manualCategory;
      } catch (e) {
        finalCategory = manualCategory === 'Auto' ? await categorizeTask(newTaskTitle) : manualCategory;
      }
    } else {
      finalCategory = manualCategory === 'Auto' ? await categorizeTask(newTaskTitle) : manualCategory;
    }
    
    onAddTask(newTaskTitle, finalCategory, selectedDate, linkMeta);
    setNewTaskTitle('');
    setIsAiLoading(false);
  };

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task?.category === 'Resources') return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const categories: ParaCategory[] = ['Projects', 'Areas', 'Resources', 'Archives'];

  const formatDateLabel = (date: string) => {
    if (date === todayStr) return "오늘";
    const d = new Date(date);
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 md:pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
            PARA Daily Focus
          </h2>
          <p className="text-slate-500 mt-1 font-medium italic">Viewing tasks for <span className="text-blue-600 font-bold">{formatDateLabel(selectedDate)}</span></p>
        </div>
        
        <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
          <span className="px-3 text-[10px] font-black text-slate-400 uppercase">Selected Date</span>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
          />
        </div>
      </header>

      <WeeklySummary 
        tasks={tasks} 
        projects={projects}
        onDateClick={(date) => setSelectedDate(date)} 
        selectedDate={selectedDate} 
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="text-[10px] font-black text-slate-400 uppercase mr-1">Quick Add Category:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setManualCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
                manualCategory === cat 
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-400 border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={() => setManualCategory('Auto')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
              manualCategory === 'Auto' 
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-blue-400 border-blue-200'
            }`}
          >
            AI Auto
          </button>
        </div>

        <form onSubmit={handleAddTask} className="relative group">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder={`${formatDateLabel(selectedDate)}의 정보, 할 일 또는 URL을 입력하세요...`}
            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 pr-16 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 placeholder:text-slate-400 text-base"
            disabled={isAiLoading}
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-slate-900 text-white rounded-xl disabled:opacity-50"
            disabled={isAiLoading}
          >
            {isAiLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {categories.map(cat => {
          const isProjectsCol = cat === 'Projects';
          const itemsCount = isProjectsCol ? activeProjects.length : filteredTasksByDate.filter(t => t.category === cat).length;
          const displayTasks = filteredTasksByDate.filter(t => t.category === cat).sort((a, b) => a.title.localeCompare(b.title));

          return (
            <div key={cat} className="flex flex-col space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-1">
                <h3 className={`font-bold flex items-center space-x-2 text-sm uppercase tracking-tighter ${
                  cat === 'Projects' ? 'text-orange-500' :
                  cat === 'Areas' ? 'text-blue-500' :
                  cat === 'Resources' ? 'text-emerald-500' : 'text-slate-400'
                }`}>
                  <span>{cat}</span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-400 ml-2">{itemsCount}</span>
                </h3>
              </div>
              
              <div className="space-y-3">
                {isProjectsCol ? (
                  activeProjects.length > 0 ? activeProjects.map(proj => {
                    const completed = proj.items.filter(i => i.completed).length;
                    const total = proj.items.length;
                    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                    
                    return (
                      <div 
                        key={proj.id} 
                        onClick={() => setSelectedProjectId(proj.id)}
                        className="p-4 rounded-2xl border border-orange-100 bg-white shadow-sm flex flex-col space-y-2 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group/proj"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-[9px] font-black text-orange-500 uppercase bg-orange-50 px-1.5 py-0.5 rounded">Ongoing Project</span>
                          <span className="text-[10px] font-bold text-slate-400">{progress}%</span>
                        </div>
                        <span className="text-sm font-bold text-slate-800 break-words group-hover/proj:text-orange-600 transition-colors">{proj.title}</span>
                        <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-400" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center space-x-1">
                            <i className="far fa-calendar-check text-[9px] text-slate-300"></i>
                            <span className="text-[9px] text-slate-400 font-bold">{proj.deadline || 'No deadline'}</span>
                          </div>
                          <span className="text-[8px] font-black text-slate-300 group-hover/proj:text-orange-400 uppercase tracking-widest">Manage Tasks <i className="fas fa-arrow-right ml-0.5"></i></span>
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-[10px] text-slate-300 italic text-center py-4 font-medium border-2 border-dashed border-slate-100 rounded-2xl">진행 중인 프로젝트가 없습니다.</p>
                  )
                ) : (
                  displayTasks.length > 0 ? displayTasks.map(task => {
                    const url = isUrl(task.title);
                    const isResources = task.category === 'Resources';
                    const isArchivedProject = task.category === 'Archives' && task.archivedItems;

                    return (
                      <div 
                        key={task.id}
                        onClick={() => !isResources && !isArchivedProject && toggleTask(task.id)}
                        className={`relative p-4 rounded-2xl border transition-all flex flex-col space-y-3 group ${
                          selectedDate === todayStr ? 'ring-2 ring-blue-500/10 border-blue-200' : 'border-slate-200'
                        } ${
                          !isResources && task.completed 
                            ? 'bg-slate-50 border-slate-100 opacity-80' 
                            : 'bg-white shadow-sm'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {!isResources && (
                            <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              task.completed ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                            }`}>
                              {task.completed && <i className="fas fa-check text-[8px] text-white"></i>}
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            {url ? (
                              <a 
                                href={task.title} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm font-bold text-blue-600 hover:underline break-all"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {task.linkMetadata?.displayTitle || task.title}
                              </a>
                            ) : (
                              <div className="flex flex-col">
                                <span className={`text-sm break-words font-medium ${!isResources && task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                  {task.title}
                                </span>
                                {task.projectId && !isResources && (
                                  <span className="text-[9px] font-black text-orange-500 uppercase mt-1">
                                    <i className="fas fa-project-diagram mr-1"></i> Project Link
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={(e) => deleteTask(e, task.id)}
                            className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <i className="fas fa-trash-can text-xs"></i>
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                          <div className="flex items-center space-x-1.5 group/date">
                            <i className="far fa-calendar text-[10px] text-slate-300"></i>
                            <input 
                              type="date"
                              value={task.date}
                              onChange={(e) => onUpdateTaskDate(task.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className={`text-[10px] font-black bg-transparent border-none p-0 focus:ring-0 cursor-pointer ${
                                task.date === todayStr ? 'text-blue-500' : task.date < todayStr ? 'text-orange-400' : 'text-slate-400'
                              }`}
                            />
                          </div>
                          {task.date === todayStr && (
                            <span className="text-[9px] font-black text-blue-500 uppercase bg-blue-50 px-2 py-0.5 rounded-lg">Today</span>
                          )}
                        </div>

                        {isArchivedProject && (
                          <>
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setExpandedArchiveId(expandedArchiveId === task.id ? null : task.id); 
                              }}
                              className="mt-1 text-[10px] font-black text-slate-400 hover:text-blue-500 flex items-center space-x-1 transition-colors w-fit"
                            >
                              <i className={`fas ${expandedArchiveId === task.id ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                              <span>{expandedArchiveId === task.id ? '상세 닫기' : '세부 내용 및 Task 보기'}</span>
                            </button>

                            {expandedArchiveId === task.id && (
                              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-1">
                                <div className="space-y-1">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">설명</span>
                                  <p className="text-[11px] text-slate-600 leading-relaxed">{task.notes || '설명이 없습니다.'}</p>
                                </div>
                                <div className="space-y-1.5">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">수행한 할 일 목록</span>
                                  <div className="space-y-1">
                                    {task.archivedItems?.map(item => (
                                      <div key={item.id} className="flex items-center space-x-2">
                                        <i className="fas fa-check-circle text-[10px] text-emerald-500/60"></i>
                                        <span className="text-[10px] text-slate-500 line-through truncate">{item.title}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  }) : (
                    <p className="text-[10px] text-slate-300 italic text-center py-4 font-medium border-2 border-dashed border-slate-100 rounded-2xl">이 날의 {cat} 일정이 없습니다.</p>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Detail Modal - currentSelectedProject가 최신 데이터를 보장함 */}
      {currentSelectedProject && (
        <ProjectDetailModal 
          project={currentSelectedProject}
          onClose={() => setSelectedProjectId(null)}
          onUpdate={onUpdateProject}
          onUpdateItem={onUpdateProjectItem}
          onAddItem={onAddProjectItem}
          onRemoveItem={onRemoveProjectItem}
          onDelete={() => {
            onDeleteProject(currentSelectedProject.id);
            setSelectedProjectId(null);
          }}
        />
      )}
    </div>
  );
};

export default DailyView;
