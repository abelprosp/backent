import { BadRequestException } from '@nestjs/common';

const IDENTIFIER_RE = /^[a-z][a-z0-9_]{0,62}$/;
const SCHEMA_RE = /^tenant_[a-z0-9_]{1,58}$/;

export function assertSqlIdentifier(
  name: string,
  label = 'identificador',
): string {
  if (!name || !IDENTIFIER_RE.test(name)) {
    throw new BadRequestException(`${label} SQL inválido`);
  }
  return name;
}

export function assertSqlSchemaName(schemaName: string): string {
  if (!schemaName || !SCHEMA_RE.test(schemaName)) {
    throw new BadRequestException('Schema de tenant inválido');
  }
  return schemaName;
}

export function quoteIdent(name: string, label?: string): string {
  return `"${assertSqlIdentifier(name, label)}"`;
}

export function qualifiedTable(schemaName: string, tableName: string): string {
  return `${quoteIdent(assertSqlSchemaName(schemaName))}.${quoteIdent(tableName, 'tabela')}`;
}

export function assertOrderDirection(order: string): 'ASC' | 'DESC' {
  const upper = order.toUpperCase();
  if (upper !== 'ASC' && upper !== 'DESC') {
    throw new BadRequestException('Direção de ordenação inválida');
  }
  return upper;
}

export function assertAllowedOrderColumn(
  column: string,
  allowed: Set<string>,
): string {
  assertSqlIdentifier(column, 'coluna de ordenação');
  if (!allowed.has(column)) {
    throw new BadRequestException('Coluna de ordenação não permitida');
  }
  return column;
}

export function assertAllowedColumns(
  data: Record<string, unknown>,
  allowed: Set<string>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    assertSqlIdentifier(key, 'coluna');
    if (!allowed.has(key)) {
      throw new BadRequestException(`Coluna não permitida: ${key}`);
    }
    sanitized[key] = value;
  }
  return sanitized;
}

export function assertSafeSqlDefault(defaultValue: string): string {
  const allowed =
    /^(NOW\(\)|CURRENT_TIMESTAMP|gen_random_uuid\(\)|true|false|null|\d+(\.\d+)?|'[^']*')$/i;
  if (!allowed.test(defaultValue.trim())) {
    throw new BadRequestException('Valor default SQL não permitido');
  }
  return defaultValue.trim();
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
}
