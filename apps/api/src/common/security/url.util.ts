import { BadRequestException } from '@nestjs/common';
import { isIP } from 'net';

const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  'metadata.goog',
]);

function isPrivateIp(host: string): boolean {
  if (!isIP(host)) return false;
  if (host.startsWith('10.')) return true;
  if (host.startsWith('192.168.')) return true;
  if (host.startsWith('127.')) return true;
  if (host.startsWith('169.254.')) return true;
  const parts = host.split('.').map(Number);
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  return false;
}

export function assertSafeWebhookUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new BadRequestException('URL de webhook inválida');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new BadRequestException('Webhook deve usar HTTP ou HTTPS');
  }

  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || host.endsWith('.local') || isPrivateIp(host)) {
    throw new BadRequestException('URL de webhook não permitida (SSRF)');
  }

  return parsed.toString();
}

export function assertSafeConnectorId(id: string): string {
  if (!/^[a-z0-9-]{2,32}$/.test(id)) {
    throw new BadRequestException('Conector inválido');
  }
  return id;
}
