
import React, { useState, useMemo } from 'react';
import { Project, ProjectItem } from '../types';
import { generateShortSlug } from '../services/geminiService';
import ProjectDetailModal from './ProjectDetailModal';

interface ProjectViewProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  onUpdateProject: (updatedProject: Project) => void;
  onUpdateProjectItem: (projectId: string, item: ProjectItem) => void;
  onAddProjectItem: (projectId: string, item: ProjectItem) => void;
  onRemoveProjectItem: (projectId: string, itemId: string) => void;
}

const ProjectView: React.FC<ProjectViewProps> = ({ 
  projects, setProjects, onUpdateProject, onUpdateProjectItem, onAddProjectItem, onRemoveProjectItem 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  
  // 객체 대신 ID를 저장하여 항상 최신 프로젝트 데이터를 참조하도록 수정
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [newProj, setNewProj] = useState({
    title: '',
    description: '',
    term: 'Mid' as 'Mid' | 'Long',
    deadline: '',
    initialItems: ''
  });

  const activeProjects = useMemo(() => {
    return projects.filter(p => p.status === 'In Progress');
  }, [projects]);

  // 선택된 ID에 해당하는 최신 프로젝트 객체 추출
  const currentSelectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const getProgress = (project: Project) => {
    const total = project.items.length;
    if (total === 0) return 0;
    const completed = project.items.filter(i => i.completed).length;
    return Math.round((completed / total) * 100);
  };

  const addProject = async () => {
    if (!newProj.title.trim()) return;
    const slug = await generateShortSlug(newProj.title);
    const projId = crypto.randomUUID();
    const proj: Project = {
      id: projId,
      title: newProj.title,
      description: newProj.description,
      term: newProj.term,
      deadline: newProj.deadline,
      status: 'In Progress',
      items: [],
      slug: slug
    };
    
    setProjects(prev => [proj, ...prev]);

    newProj.initialItems.split(',').filter(i => i.trim()).forEach(title => {
      onAddProjectItem(projId, { id: crypto.randomUUID(), title: title.trim(), completed: false });
    });

    setShowAddModal(false);
    setNewProj({ title: '', description: '', term: 'Mid', deadline: '', initialItems: '' });
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-10">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">프로젝트 관리</h2>
          <p className="text-slate-500 mt-1 font-medium italic">Projects you create here will be visible in your Daily (PARA) dashboard</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center space-x-2"
        >
          <i className="fas fa-plus"></i>
          <span>새 프로젝트</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {activeProjects.map(p => {
          const progress = getProgress(p);
          return (
            <div 
              key={p.id} 
              onClick={() => setSelectedProjectId(p.id)}
              className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 w-fit px-2 py-0.5 rounded-full mb-2">Project Control</span>
                  <h4 className="font-black text-xl text-slate-800 group-hover:text-blue-600 transition-colors">{p.title}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Deadline</span>
                  <p className="text-xs font-bold text-orange-600">{p.deadline || 'No deadline'}</p>
                </div>
              </div>

              <p className="text-sm text-slate-500 mb-6 line-clamp-2">{p.description || 'No description provided.'}</p>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Current Completion</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${progress}%` }}></div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-300 uppercase italic">Click to manage items & deadlines</span>
                <div className="flex items-center space-x-2 text-slate-400">
                  <i className="fas fa-tasks text-xs"></i>
                  <span className="text-xs font-bold">{p.items.length} tasks</span>
                </div>
              </div>
            </div>
          );
        })}
        {activeProjects.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 font-medium bg-white/50">
            진행 중인 프로젝트가 없습니다.
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold mb-6 text-slate-900 tracking-tight">새 프로젝트 생성</h3>
            <div className="space-y-4">
              <input type="text" value={newProj.title} onChange={e => setNewProj({...newProj, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl" placeholder="프로젝트 제목" />
              <textarea value={newProj.description} onChange={e => setNewProj({...newProj, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl" placeholder="프로젝트 설명" rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <select value={newProj.term} onChange={e => setNewProj({...newProj, term: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold">
                  <option value="Mid">중기 (Mid-term)</option>
                  <option value="Long">장기 (Long-term)</option>
                </select>
                <input type="date" value={newProj.deadline} onChange={e => setNewProj({...newProj, deadline: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold" />
              </div>
              <input type="text" value={newProj.initialItems} onChange={e => setNewProj({...newProj, initialItems: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl" placeholder="초기 할 일들 (쉼표로 구분)" />
              <div className="flex space-x-3 mt-6">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 font-bold text-slate-500">취소</button>
                <button onClick={addProject} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 transition-colors">프로젝트 시작</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentSelectedProject && (
        <ProjectDetailModal 
          project={currentSelectedProject}
          onClose={() => setSelectedProjectId(null)}
          onUpdate={onUpdateProject}
          onUpdateItem={onUpdateProjectItem}
          onAddItem={onAddProjectItem}
          onRemoveItem={onRemoveProjectItem}
          onDelete={() => {
            setProjects(prev => prev.filter(p => p.id !== currentSelectedProject.id));
            setSelectedProjectId(null);
          }}
        />
      )}
    </div>
  );
};

export default ProjectView;
