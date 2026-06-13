'use client';

import { ChevronDown, FolderOpen } from 'lucide-react';
import { useState } from 'react';
import { useWorkspace } from '@/contexts/workspace-context';
import { Badge } from '@/components/ui';
import Link from 'next/link';

export function ProjectSelector() {
  const { projects, selectedProject, selectProject } = useWorkspace();
  const [open, setOpen] = useState(false);

  if (projects.length === 0) {
    return (
      <Link href="/dashboard/projects" className="text-sm text-primary hover:underline">
        + Criar primeiro projeto
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-secondary"
      >
        <FolderOpen className="h-4 w-4 text-primary" />
        <span className="max-w-[200px] truncate">
          {selectedProject?.name ?? 'Selecionar projeto'}
        </span>
        {selectedProject && (
          <Badge variant={selectedProject.status === 'ACTIVE' ? 'success' : 'warning'}>
            {selectedProject.status}
          </Badge>
        )}
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border border-border bg-card py-1 shadow-xl">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  selectProject(p);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-secondary"
              >
                <span className="truncate">{p.name}</span>
                <Badge variant={p.status === 'ACTIVE' ? 'success' : 'warning'}>
                  {p.status}
                </Badge>
              </button>
            ))}
            <Link
              href="/dashboard/projects"
              onClick={() => setOpen(false)}
              className="block border-t border-border px-3 py-2 text-sm text-primary hover:bg-secondary"
            >
              Gerenciar projetos
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
