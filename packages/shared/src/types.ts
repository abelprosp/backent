export type PlanTier = 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';

export type ProjectStatus =
  | 'PROVISIONING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'MIGRATING'
  | 'DELETED';

export type ColumnType =
  | 'uuid'
  | 'varchar'
  | 'text'
  | 'integer'
  | 'bigint'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'timestamptz'
  | 'json'
  | 'jsonb';

export interface ColumnDefinition {
  name: string;
  type: ColumnType;
  primaryKey?: boolean;
  unique?: boolean;
  nullable?: boolean;
  default?: string;
  references?: string;
}

export interface TableDefinition {
  name: string;
  displayName?: string;
  description?: string;
  columns: ColumnDefinition[];
  indexes?: IndexDefinition[];
  constraints?: ConstraintDefinition[];
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
}

export interface ConstraintDefinition {
  name: string;
  type: 'check' | 'foreign_key' | 'unique';
  definition: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh' | 'project';
}

export interface ProjectJwtPayload {
  sub: string;
  projectId: string;
  email: string;
  role: string;
}

export interface UsageStats {
  apiRequests: number;
  storageBytes: number;
  bandwidthBytes: number;
  tableCount: number;
  authUsers: number;
}

export interface NoCodeConnector {
  id: string;
  name: string;
  logo: string;
  docsUrl: string;
}

export interface WebhookPayload {
  event: string;
  table: string;
  record: Record<string, unknown>;
  oldRecord?: Record<string, unknown>;
  timestamp: string;
  projectId: string;
}
