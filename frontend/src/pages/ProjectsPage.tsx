import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, FolderKanban } from 'lucide-react';
import { projectService } from '@/services/projectService';
import { generateProjects } from '@/data/demo';
import { Project } from '@/types';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';

const DEMO_PROJECTS = generateProjects(30);

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['projects', search],
    queryFn: () => projectService.getAll({ search }),
  });

  const deleteMutation = useMutation({
    mutationFn: projectService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted');
    },
  });

  // Use API data if available, otherwise demo
  const projects = (data?.data && data.data.length > 0) ? data.data : DEMO_PROJECTS as unknown as Project[];
  const filtered = search
    ? projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-dark-400 mt-0.5">{filtered.length} projects</p>
        </div>
        <button onClick={() => { setEditProject(null); setShowModal(true); }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
          placeholder="Search projects..."
          aria-label="Search projects"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-dark-700 rounded w-3/4 mb-3" />
              <div className="h-3 bg-dark-700 rounded w-full mb-2" />
              <div className="h-3 bg-dark-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="card-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-blue-500/20 border border-primary-500/20 flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{project.name}</h3>
                    <p className="text-[11px] text-dark-500">{project.framework} • {project.environment}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditProject(project); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-dark-700/50 text-dark-500 hover:text-dark-300 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(project.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-dark-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-dark-400 mt-3 line-clamp-2">{project.description || 'No description'}</p>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-dark-700/50">
                <span className="text-[11px] text-dark-500"><strong className="text-dark-300">{project.test_suites_count}</strong> Suites</span>
                <span className="text-[11px] text-dark-500"><strong className="text-dark-300">{project.test_cases_count}</strong> Cases</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-dark-700/50 text-dark-400">{project.environment}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && <ProjectModal project={editProject} onClose={() => setShowModal(false)} />}
    </div>
  );
}

function ProjectModal({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    framework: project?.framework || 'playwright',
    repository_url: project?.repository_url || '',
    environment: project?.environment || 'development',
  });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Partial<Project>) => project ? projectService.update(project.id, data) : projectService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(project ? 'Project updated' : 'Project created');
      onClose();
    },
    onError: () => toast.error('Operation failed'),
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); mutation.mutate(form); };

  return (
    <Modal title={project ? 'Edit Project' : 'New Project'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1.5">Project Name</label>
          <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1.5">Description</label>
          <textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Framework</label>
            <select className="input-field" value={form.framework} onChange={(e) => setForm({ ...form, framework: e.target.value })}>
              <option value="playwright">Playwright</option>
              <option value="cypress">Cypress</option>
              <option value="selenium">Selenium</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Environment</label>
            <select className="input-field" value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })}>
              <option value="development">Development</option>
              <option value="qa">QA</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1.5">Repository URL</label>
          <input className="input-field" value={form.repository_url} onChange={(e) => setForm({ ...form, repository_url: e.target.value })} placeholder="https://github.com/..." />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button type="submit" className="btn-primary text-sm" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : project ? 'Update' : 'Create'}</button>
        </div>
      </form>
    </Modal>
  );
}
