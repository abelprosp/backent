import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateSecureToken(bytes = 48): string {
  return randomBytes(bytes).toString('hex');
}

export function signWebhookPayload(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyWebhookSignature(
  secret: string,
  payload: string,
  signature: string,
): boolean {
  const expected = signWebhookPayload(secret, payload);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function getRequiredSecret(
  value: string | undefined,
  name: string,
  minLength = 32,
): string {
  if (!value || value.length < minLength) {
    throw new Error(
      `${name} ausente ou muito curto (mínimo ${minLength} caracteres). Configure no .env`,
    );
  }
  if (
    process.env.NODE_ENV === 'production' &&
    /change-me|dev-secret|admin123/i.test(value)
  ) {
    throw new Error(`${name} inseguro para produção`);
  }
  return value;
}
