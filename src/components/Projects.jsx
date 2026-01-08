import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Circle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import CommentsModal from './CommentsModal';

export default function Projects({ userName }) {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchProjects();
    
    const subscription = supabase
      .channel('projects_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchProjects)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setProjects(data || []);
    setLoading(false);
  };

  const addProject = async () => {
    if (!newProjectName.trim() || !userName) return;
    
    await supabase.from('projects').insert([
      { 
        name: newProjectName,
        description: newProjectDescription.trim() || null,
        status: 'not_started',
        added_by: userName
      }
    ]);
    setNewProjectName('');
    setNewProjectDescription('');
  };

  const handleNameKeyPress = (e) => {
    if (e.key === 'Enter') {
      addProject();
    }
  };

  const updateStatus = async (id, currentStatus) => {
    const statusOrder = ['not_started', 'in_progress', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    
    const updates = { status: nextStatus };
    
    // Track who completed it
    if (nextStatus === 'completed') {
      updates.completed_by = userName;
    } else if (currentStatus === 'completed') {
      // Clear completed_by if cycling away from completed
      updates.completed_by = null;
    }
    
    await supabase
      .from('projects')
      .update(updates)
      .eq('id', id);
  };

  const deleteProject = async (id) => {
    await supabase.from('projects').delete().eq('id', id);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'in_progress':
        return <Clock size={20} className="text-blue-500" />;
      default:
        return <Circle size={20} className="text-gray-500" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading...</div>;
  }

  // Group projects by status
  const projectsByStatus = {
    not_started: projects.filter(p => p.status === 'not_started'),
    in_progress: projects.filter(p => p.status === 'in_progress'),
    completed: projects.filter(p => p.status === 'completed')
  };

  return (
    <div>
      <div className="mb-6 space-y-3">
        <input
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          onKeyUp={handleNameKeyPress}
          placeholder="Project name..."
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <textarea
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            placeholder="Description (optional)..."
            rows="2"
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <button
            onClick={addProject}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 sm:w-auto w-full sm:self-end"
          >
            <Plus size={20} /> Add
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {projects.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No projects yet. Add your first project!</p>
        ) : (
          <>
            {/* Not Started */}
            {projectsByStatus.not_started.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                  Not Started
                </h3>
                <div className="space-y-2">
                  {projectsByStatus.not_started.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus(project.id, project.status);
                            }}
                            className="mt-1"
                          >
                            {getStatusIcon(project.status)}
                          </button>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium">{project.name}</h4>
                            {project.description && (
                              <p className="text-gray-400 text-sm mt-1">{project.description}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Added by {project.added_by === userName ? 'you' : project.added_by}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProject(project.id);
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors ml-3"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* In Progress */}
            {projectsByStatus.in_progress.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                  In Progress
                </h3>
                <div className="space-y-2">
                  {projectsByStatus.in_progress.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus(project.id, project.status);
                            }}
                            className="mt-1"
                          >
                            {getStatusIcon(project.status)}
                          </button>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium">{project.name}</h4>
                            {project.description && (
                              <p className="text-gray-400 text-sm mt-1">{project.description}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Added by {project.added_by === userName ? 'you' : project.added_by}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProject(project.id);
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors ml-3"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {projectsByStatus.completed.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  Completed
                </h3>
                <div className="space-y-2">
                  {projectsByStatus.completed.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors opacity-75 cursor-pointer"
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus(project.id, project.status);
                            }}
                            className="mt-1"
                          >
                            {getStatusIcon(project.status)}
                          </button>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium line-through">{project.name}</h4>
                            {project.description && (
                              <p className="text-gray-400 text-sm mt-1">{project.description}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Added by {project.added_by === userName ? 'you' : project.added_by}
                              {project.completed_by && (
                                <span> • Completed by {project.completed_by === userName ? 'you' : project.completed_by}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProject(project.id);
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors ml-3"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Comments Modal */}
      {selectedProject && (
        <CommentsModal
          item={selectedProject}
          onClose={() => setSelectedProject(null)}
          userName={userName}
          tableName="project_comments"
          foreignKeyName="project_id"
        />
      )}
    </div>
  );
}
