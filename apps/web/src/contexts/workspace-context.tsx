'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { apiClient, type Project, type Workspace } from '@/lib/api-client';

const PROJECT_KEY = 'backent_selected_project';

interface WorkspaceContextValue {
  workspace: Workspace | null;
  projects: Project[];
  selectedProject: Project | null;
  loading: boolean;
  error: string | null;
  refreshProjects: () => Promise<void>;
  selectProject: (project: Project | null) => void;
  setWorkspace: (ws: Workspace) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspaceState] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectProject = useCallback((project: Project | null) => {
    setSelectedProject(project);
    if (project) {
      localStorage.setItem(PROJECT_KEY, project.id);
    } else {
      localStorage.removeItem(PROJECT_KEY);
    }
  }, []);

  const refreshProjects = useCallback(async () => {
    if (!workspace) return;
    const list = await apiClient.getProjects(workspace.id);
    setProjects(list);
    const savedId = localStorage.getItem(PROJECT_KEY);
    const saved = list.find((p) => p.id === savedId);
    const active = list.find((p) => p.status === 'ACTIVE');
    selectProject(saved ?? active ?? list[0] ?? null);
  }, [workspace, selectProject]);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const workspaces = await apiClient.getWorkspaces();
        if (workspaces.length === 0) {
          setError('Nenhum workspace encontrado');
          return;
        }
        setWorkspaceState(workspaces[0]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar workspace');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!workspace) return;
    refreshProjects().catch((e) =>
      setError(e instanceof Error ? e.message : 'Erro ao carregar projetos'),
    );
  }, [workspace, refreshProjects]);

  const setWorkspace = (ws: Workspace) => {
    setWorkspaceState(ws);
    selectProject(null);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        projects,
        selectedProject,
        loading,
        error,
        refreshProjects,
        selectProject,
        setWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}

export function useRequireProject() {
  const { selectedProject, projects, loading } = useWorkspace();
  return { project: selectedProject, projects, loading };
}
