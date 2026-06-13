'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { Logo } from '@/components/logo';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@backent.io');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/');
    } catch {
      setError('Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-xl border border-white/10 bg-white/5 p-8">
        <Logo size="lg" />
        <p className="text-sm text-white/60">Painel administrativo</p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white"
          placeholder="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white"
          placeholder="Senha"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-red-600 py-2 text-white hover:bg-red-500 disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="text-xs text-white/40">Demo: admin@backent.io / admin123!</p>
      </form>
    </div>
  );
}
