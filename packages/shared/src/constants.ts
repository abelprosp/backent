export const APP_NAME = 'Backent';
export const APP_SLOGAN = 'Seu backend pronto em minutos.';
export const APP_TAGLINE = 'Crie o backend do seu SaaS em minutos.';

export const PLAN_LIMITS = {
  FREE: { storageGb: 5, apiRequests: 10000, maxProjects: 1, maxTables: 10 },
  PRO: { storageGb: 25, apiRequests: 100000, maxProjects: 5, maxTables: 50 },
  BUSINESS: {
    storageGb: 100,
    apiRequests: 1000000,
    maxProjects: 20,
    maxTables: 200,
  },
  ENTERPRISE: {
    storageGb: 500,
    apiRequests: 10000000,
    maxProjects: 100,
    maxTables: 1000,
  },
} as const;

export const NO_CODE_CONNECTORS = [
  { id: 'bubble', name: 'Bubble', logo: '/connectors/bubble.svg' },
  { id: 'flutterflow', name: 'FlutterFlow', logo: '/connectors/flutterflow.svg' },
  { id: 'weweb', name: 'WeWeb', logo: '/connectors/weweb.svg' },
  { id: 'n8n', name: 'N8N', logo: '/connectors/n8n.svg' },
  { id: 'make', name: 'Make', logo: '/connectors/make.svg' },
  { id: 'zapier', name: 'Zapier', logo: '/connectors/zapier.svg' },
  { id: 'wordpress', name: 'WordPress', logo: '/connectors/wordpress.svg' },
  { id: 'webflow', name: 'Webflow', logo: '/connectors/webflow.svg' },
] as const;

export const COLUMN_TYPES: { value: string; label: string; sql: string }[] = [
  { value: 'uuid', label: 'UUID', sql: 'UUID' },
  { value: 'varchar', label: 'Texto curto', sql: 'VARCHAR(255)' },
  { value: 'text', label: 'Texto longo', sql: 'TEXT' },
  { value: 'integer', label: 'Número inteiro', sql: 'INTEGER' },
  { value: 'bigint', label: 'Número grande', sql: 'BIGINT' },
  { value: 'decimal', label: 'Decimal', sql: 'DECIMAL(10,2)' },
  { value: 'boolean', label: 'Booleano', sql: 'BOOLEAN' },
  { value: 'date', label: 'Data', sql: 'DATE' },
  { value: 'timestamptz', label: 'Data/Hora', sql: 'TIMESTAMPTZ' },
  { value: 'json', label: 'JSON', sql: 'JSON' },
  { value: 'jsonb', label: 'JSONB', sql: 'JSONB' },
];

export const API_RATE_LIMITS = {
  FREE: { windowMs: 60000, max: 60 },
  PRO: { windowMs: 60000, max: 300 },
  BUSINESS: { windowMs: 60000, max: 1000 },
  ENTERPRISE: { windowMs: 60000, max: 10000 },
} as const;
