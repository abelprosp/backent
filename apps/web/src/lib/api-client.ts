import { getAccessToken } from './auth';
import { API_URL } from './utils';

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData
      ? {}
      : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers,
    });
  } catch {
    throw new Error(
      'Não foi possível conectar à API. Verifique se o servidor está rodando (porta 4000).',
    );
  }
  if (!res.ok) {
    let message = 'Erro na requisição';
    try {
      const text = await res.text();
      const json = JSON.parse(text);
      message = json.message ?? json.error ?? text;
      if (Array.isArray(message)) message = message.join(', ');
    } catch {
      // keep default
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface Plan {
  id: string;
  name: string;
  tier: string;
  priceMonthly: number;
  storageGb: number;
  apiRequests: number;
  maxProjects: number;
  maxTables: number;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  role?: string;
  plan: Plan;
  _count?: { projects: number; members: number };
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: string;
  apiUrl?: string;
  schemaName: string;
  storageBucket?: string;
  createdAt: string;
  provisionedAt?: string;
  tables?: ProjectTable[];
  apiKeys?: ApiKey[];
  serverNode?: { name: string; region: string };
  workspace?: { plan: Plan };
  _count?: { tables: number; apiKeys: number };
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: string;
  createdAt: string;
  revoked: boolean;
}

export interface ProjectTable {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  columns: ColumnDef[];
  rowCount: number;
  createdAt: string;
}

export interface ColumnDef {
  name: string;
  type: string;
  primaryKey?: boolean;
  unique?: boolean;
  nullable?: boolean;
  default?: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  lastTriggeredAt?: string;
  createdAt: string;
}

export interface StorageFile {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  key: string;
  isPublic: boolean;
  createdAt: string;
}

export interface ProjectMetrics {
  tables: number;
  apiKeys: number;
  webhooks: number;
  files: number;
  apiRequests7d: number;
  status: string;
  metrics: Array<{ date: string; apiRequests: number; storageBytes: string }>;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  downloads: number;
}

export interface WorkspaceUsage {
  projects: number;
  apiRequests: number;
  storageBytes: number;
  bandwidthBytes: number;
}

export const apiClient = {
  getWorkspaces: () => request<Workspace[]>('/workspaces'),

  getWorkspaceUsage: (id: string) =>
    request<WorkspaceUsage>(`/workspaces/${id}/usage`),

  getProjects: (workspaceId: string) =>
    request<Project[]>(`/workspaces/${workspaceId}/projects`),

  getProject: (id: string) => request<Project>(`/projects/${id}`),

  createProject: (
    workspaceId: string,
    data: { name: string; description?: string; templateId?: string },
  ) =>
    request<{ project: Project; apiKey: string }>(
      `/workspaces/${workspaceId}/projects`,
      { method: 'POST', body: JSON.stringify(data) },
    ),

  deleteProject: (id: string) =>
    request<{ success: boolean }>(`/projects/${id}`, { method: 'DELETE' }),

  createApiKey: (projectId: string, name: string) =>
    request<{ key: string; prefix: string }>(`/projects/${projectId}/api-keys`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  getTables: (projectId: string) =>
    request<ProjectTable[]>(`/projects/${projectId}/tables`),

  createTable: (
    projectId: string,
    table: {
      name: string;
      displayName?: string;
      description?: string;
      columns: ColumnDef[];
    },
  ) =>
    request<ProjectTable>(`/projects/${projectId}/tables`, {
      method: 'POST',
      body: JSON.stringify(table),
    }),

  deleteTable: (projectId: string, tableName: string) =>
    request<{ success: boolean }>(
      `/projects/${projectId}/tables/${tableName}`,
      { method: 'DELETE' },
    ),

  getRows: (
    projectId: string,
    tableName: string,
    page = 1,
    limit = 50,
  ) =>
    request<{
      data: Record<string, unknown>[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>(
      `/projects/${projectId}/tables/${tableName}/rows?page=${page}&limit=${limit}`,
    ),

  insertRow: (
    projectId: string,
    tableName: string,
    data: Record<string, unknown>,
  ) =>
    request<{ success: boolean }>(
      `/projects/${projectId}/tables/${tableName}/rows`,
      { method: 'POST', body: JSON.stringify(data) },
    ),

  deleteRow: (projectId: string, tableName: string, id: string) =>
    request<{ success: boolean }>(
      `/projects/${projectId}/tables/${tableName}/rows/${id}`,
      { method: 'DELETE' },
    ),

  getWebhooks: (projectId: string) =>
    request<Webhook[]>(`/projects/${projectId}/webhooks`),

  createWebhook: (
    projectId: string,
    data: { name: string; url: string; events: string[] },
  ) =>
    request<Webhook>(`/projects/${projectId}/webhooks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteWebhook: (projectId: string, id: string) =>
    request<{ success: boolean }>(
      `/projects/${projectId}/webhooks/${id}`,
      { method: 'DELETE' },
    ),

  getStorageFiles: (projectId: string) =>
    request<StorageFile[]>(`/projects/${projectId}/storage`),

  uploadFile: (projectId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{
      id: string;
      filename: string;
      size: number;
      url: string;
    }>(`/projects/${projectId}/storage/upload`, {
      method: 'POST',
      body: form,
    });
  },

  deleteFile: (projectId: string, fileId: string) =>
    request<{ success: boolean }>(
      `/projects/${projectId}/storage/${fileId}`,
      { method: 'DELETE' },
    ),

  getMetrics: (projectId: string) =>
    request<ProjectMetrics>(`/projects/${projectId}/metrics`),

  getTemplates: () => request<Template[]>('/templates'),

  getConnectors: () =>
    request<Array<{ id: string; name: string; logo: string }>>('/connectors'),

  getConnectorSnippet: (connector: string, projectId: string) =>
    request<{ connector: string; apiUrl: string; snippet: Record<string, unknown> }>(
      `/connectors/${connector}/projects/${projectId}/snippet`,
    ),

  getPlans: () => request<Plan[]>('/billing/plans'),

  getBillingLimits: (workspaceId: string) =>
    request<{
      plan: Plan;
      usage: { apiRequests: number; storageBytes: number };
      limits: Record<string, number>;
    }>(`/billing/workspaces/${workspaceId}/limits`),

  updateProfile: (data: { name?: string }) =>
    request<{ id: string; email: string; name: string }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getAdminDashboard: () =>
    request<{
      users: number;
      activeProjects: number;
      workspaces: number;
      servers: Array<{ name: string; status: string; currentLoad: number; capacity: number }>;
    }>('/admin/dashboard'),

  getAdminUsers: (page = 1) =>
    request<{
      data: Array<{ id: string; email: string; name: string; role: string; createdAt: string }>;
      meta: { total: number };
    }>(`/admin/users?page=${page}`),

  getAuditLogs: () =>
    request<
      Array<{
        id: string;
        action: string;
        resource: string;
        createdAt: string;
        user?: { email: string };
      }>
    >('/admin/audit-logs'),
};
