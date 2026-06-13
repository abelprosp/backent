'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@backent.io');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-card p-12 lg:flex">
        <div className="flex items-center">
          <Logo size="lg" />
        </div>
        <div>
          <h2 className="text-3xl font-semibold leading-tight">
            Seu backend pronto
            <br />
            <span className="gradient-text">em minutos.</span>
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Banco de dados, APIs automáticas, auth, storage e webhooks —
            tudo sem DevOps.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">© 2026 Backent</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <h1 className="text-2xl font-semibold">Entrar</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acesse seu dashboard Backent
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                placeholder="voce@empresa.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Entrar <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-4 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-xs text-muted-foreground">
            Demo: <strong className="text-foreground">admin@backent.io</strong> /{' '}
            <strong className="text-foreground">admin123!</strong>
          </p>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Não tem conta?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Criar conta grátis
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
