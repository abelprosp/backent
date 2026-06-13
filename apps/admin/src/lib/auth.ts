'use client';

function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') return '/api/v1';
  return 'http://localhost:4000/api/v1';
}

const API_URL = getApiUrl();

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

export function saveTokens(tokens: { accessToken: string; refreshToken?: string }) {
  memoryAccessToken = tokens.accessToken;
}

export function clearTokens() {
  memoryAccessToken = null;
}

export async function ensureSession() {
  try {
    return await fetchMe();
  } catch {
    // tenta renovar via cookie httpOnly
  }

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      ...fetchOpts,
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error('Sessão expirada');
    const tokens = await res.json();
    saveTokens(tokens);
    return fetchMe();
  } catch {
    throw new Error('Sessão expirada');
  }
}

export async function fetchMe() {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/users/me`, {
      credentials: 'include',
      headers,
    });
  } catch {
    throw new Error('Não foi possível conectar à API');
  }

  if (!res.ok) {
    if (res.status === 401) {
      if (token) {
        clearTokens();
        return fetchMe();
      }
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          ...fetchOpts,
          body: JSON.stringify({}),
        });
        if (refreshRes.ok) {
          const tokens = await refreshRes.json();
          saveTokens(tokens);
          return fetchMe();
        }
      } catch {
        // ignore
      }
    }
    throw new Error('Sessão inválida');
  }
  return res.json() as Promise<{ id: string; email: string; role: string; name: string }>;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    ...fetchOpts,
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Credenciais inválidas');
  const tokens = await res.json();
  saveTokens(tokens);
  return tokens;
}

export async function logout() {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      ...fetchOpts,
      body: JSON.stringify({}),
    });
  } catch {
    // ignore
  }
  clearTokens();
}

export async function adminFetch<T>(path: string): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
