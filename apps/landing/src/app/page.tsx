'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Database,
  Zap,
  Shield,
  Code2,
  ArrowRight,
  Check,
  ChevronDown,
} from 'lucide-react';
import { APP_TAGLINE } from '@backent/shared';
import { Logo } from '@/components/logo';

const features = [
  { icon: Database, title: 'Banco visual', desc: 'Crie tabelas como no Airtable. Relacionamentos, índices e constraints.' },
  { icon: Code2, title: 'API automática', desc: 'REST API + Swagger gerados instantaneamente para cada tabela.' },
  { icon: Shield, title: 'Auth completa', desc: 'Login, registro, magic link e controle de permissões por projeto.' },
  { icon: Zap, title: 'No-code ready', desc: 'Conectores para Bubble, FlutterFlow, N8N, Make, Zapier e mais.' },
];

const plans = [
  { name: 'Free', price: 'R$ 0', features: ['5GB storage', '10K requests/mês', '1 projeto', '10 tabelas'] },
  { name: 'Pro', price: 'R$ 29', features: ['25GB storage', '100K requests/mês', '5 projetos', 'Realtime + Webhooks'], popular: true },
  { name: 'Business', price: 'R$ 99', features: ['100GB storage', '1M requests/mês', '20 projetos', 'Domínio customizado'] },
  { name: 'Enterprise', price: 'Sob consulta', features: ['500GB+ storage', 'SLA dedicado', 'Multi-VPS', 'Suporte prioritário'] },
];

const faqs = [
  { q: 'Preciso saber programar?', a: 'Não. A Backent foi feita para criadores no-code. Interface visual para tudo.' },
  { q: 'Como conecto ao Bubble?', a: 'Gere sua API Key, copie a URL e configure o API Connector do Bubble em 2 minutos.' },
  { q: 'Meus dados são seguros?', a: 'Isolamento multi-tenant por schema, criptografia, rate limit e auditoria completa.' },
  { q: 'Posso migrar depois?', a: 'Sim. Export CSV, APIs padrão REST e SDKs JS/Python/PHP para portabilidade total.' },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo href="/" size="md" />
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-gray-400 hover:text-white">Features</a>
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white">Pricing</a>
            <a href="#faq" className="text-sm text-gray-400 hover:text-white">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="http://localhost:3000/login" className="text-sm text-gray-400 hover:text-white">
              Entrar
            </Link>
            <Link
              href="http://localhost:3000/register"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pb-32 pt-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300">
              <Zap className="h-3.5 w-3.5" />
              Backend cloud para no-code
            </span>

            <h1 className="mt-8 text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              {APP_TAGLINE.split(' ').slice(0, 4).join(' ')}
              <br />
              <span className="gradient-text">
                {APP_TAGLINE.split(' ').slice(4).join(' ')}
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
              Banco de dados, APIs REST automáticas, autenticação, storage e webhooks —
              provisionados em segundos. Sem servidores. Sem DevOps.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="http://localhost:3000/register"
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-3.5 text-base font-medium text-white transition hover:bg-violet-500"
              >
                Criar backend grátis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="flex items-center gap-2 rounded-xl border border-white/10 px-8 py-3.5 text-base text-gray-300 transition hover:border-white/20"
              >
                Ver demo
                <ChevronDown className="h-4 w-4" />
              </a>
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative mt-20"
          >
            <div className="glow rounded-2xl border border-white/10 bg-gray-900/80 p-2 backdrop-blur">
              <div className="rounded-xl bg-gray-950 p-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  <span className="ml-4 text-xs text-gray-500">dashboard.backent.io</span>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {['15.4K Requests', '8 Tabelas', '1.2 GB Storage', '3 Webhooks'].map((stat) => (
                    <div key={stat} className="rounded-lg border border-white/5 bg-white/5 p-4 text-left">
                      <p className="text-xs text-gray-500">{stat.split(' ')[1]}</p>
                      <p className="mt-1 text-lg font-semibold">{stat.split(' ')[0]}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 h-32 rounded-lg border border-white/5 bg-gradient-to-t from-violet-500/10 to-transparent" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold">Tudo que seu app precisa</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-gray-400">
            Uma plataforma completa. Não apenas CRUD — infraestrutura moderna para no-code.
          </p>
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="rounded-xl border border-white/5 bg-white/5 p-6 transition hover:border-violet-500/30"
              >
                <f.icon className="h-8 w-8 text-violet-400" />
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold">Planos simples</h2>
          <p className="mt-4 text-center text-gray-400">Comece grátis. Escale quando precisar.</p>
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 ${
                  plan.popular
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-white/5 bg-white/5'
                }`}
              >
                {plan.popular && (
                  <span className="text-xs font-medium text-violet-400">Mais popular</span>
                )}
                <h3 className="mt-2 text-xl font-semibold">{plan.name}</h3>
                <p className="mt-2 text-3xl font-bold">{plan.price}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                      <Check className="h-4 w-4 text-violet-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className="mt-8 w-full rounded-lg border border-white/10 py-2 text-sm transition hover:bg-white/5">
                  Começar
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-3xl font-bold">Perguntas frequentes</h2>
          <div className="mt-12 space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-xl border border-white/5 p-6">
                <h3 className="font-medium">{faq.q}</h3>
                <p className="mt-2 text-sm text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold">Pronto para começar?</h2>
          <p className="mt-4 text-gray-400">
            Crie seu backend em minutos. Grátis para sempre no plano Free.
          </p>
          <Link
            href="http://localhost:3000/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-3.5 font-medium text-white hover:bg-violet-500"
          >
            Criar conta grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-8 text-center text-sm text-gray-500">
        © 2026 Backent. Seu backend pronto em minutos.
      </footer>
    </div>
  );
}
