import { createHash, randomBytes } from 'crypto';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `bk_${randomBytes(32).toString('hex')}`;
  const prefix = key.slice(0, 11);
  const hash = createHash('sha256').update(key).digest('hex');
  return { key, prefix, hash };
}

export function generateSchemaName(projectSlug: string, workspaceSlug: string): string {
  const name = `tenant_${workspaceSlug}_${projectSlug}`.replace(/-/g, '_');
  return name.slice(0, 63);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function columnTypeToSql(type: string): string {
  const map: Record<string, string> = {
    uuid: 'UUID',
    varchar: 'VARCHAR(255)',
    text: 'TEXT',
    integer: 'INTEGER',
    bigint: 'BIGINT',
    decimal: 'DECIMAL(10,2)',
    boolean: 'BOOLEAN',
    date: 'DATE',
    timestamptz: 'TIMESTAMPTZ',
    json: 'JSON',
    jsonb: 'JSONB',
  };
  return map[type] ?? 'TEXT';
}
