'use client';

import { API_URL } from './utils';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

const fetchOpts: RequestInit = {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
};

/** Token em memória para Authorization header; refresh fica em cookie httpOnly. */
let memoryAccessToken: string | null = null;

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return memoryAccessToken;
}

export function saveTokens(tokens: AuthTokens) {
  memoryAccessToken = tokens.accessToken;
}

export function clearTokens() {
  memoryAccessToken = null;
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...fetchOpts,
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      'Não foi possível conectar à API. Verifique se o servidor está rodando (porta 4000).',
    );
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.includes('Credenciais') ? 'Email ou senha incorretos' : text || 'Erro de autenticação');
  }
  return res.json();
}

export async function refreshSession(): Promise<AuthTokens | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      ...fetchOpts,
      body: JSON.stringify({}),
    });
    if (!res.ok) return null;
    const tokens = (await res.json()) as AuthTokens;
    saveTokens(tokens);
    return tokens;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const tokens = await authFetch<AuthTokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  saveTokens(tokens);
  return tokens;
}

export async function register(
  email: string,
  password: string,
  name?: string,
): Promise<AuthTokens> {
  const tokens = await authFetch<AuthTokens>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
  saveTokens(tokens);
  return tokens;
}

export async function fetchMe(token?: string): Promise<AuthUser> {
  const headers: Record<string, string> = {};
  const accessToken = token ?? getAccessToken();
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/users/me`, {
      credentials: 'include',
      headers,
    });
  } catch {
    throw new Error(
      'Não foi possível conectar à API. Verifique se o servidor está rodando (porta 4000).',
    );
  }

  if (!res.ok) {
    if (res.status === 401) {
      if (accessToken) {
        clearTokens();
        return fetchMe();
      }
      const refreshed = await refreshSession();
      if (refreshed) {
        return fetchMe(refreshed.accessToken);
      }
      clearTokens();
    }
    throw new Error('Sessão expirada');
  }

  return res.json();
}

export async function logout() {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
  } catch {
    // ignore
  }
  clearTokens();
}
