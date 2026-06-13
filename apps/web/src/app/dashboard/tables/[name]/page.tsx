'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/dashboard/dashboard-shell';
import { useRequireProject } from '@/contexts/workspace-context';
import { apiClient } from '@/lib/api-client';
import { Alert, Button, Input, Modal } from '@/components/ui';
import Link from 'next/link';

export default function TableDataPage() {
  const params = useParams();
  const router = useRouter();
  const tableName = params.name as string;
  const { project, loading: workspaceLoading } = useRequireProject();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newRow, setNewRow] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  async function load(page = 1) {
    if (!project) return;
    setLoading(true);
    try {
      const [result, tables] = await Promise.all([
        apiClient.getRows(project.id, tableName, page),
        apiClient.getTables(project.id),
      ]);
      setRows(result.data);
      setMeta({ page: result.meta.page, total: result.meta.total, totalPages: result.meta.totalPages });
      const tableMeta = tables.find((t) => t.name === tableName);
      if (result.data.length > 0) {
        setColumns(Object.keys(result.data[0]).filter((k) => k !== 'created_at' && k !== 'updated_at'));
      } else if (tableMeta) {
        setColumns(
          (tableMeta.columns as { name: string }[])
            .map((c) => c.name)
            .filter((n) => n !== 'id'),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!workspaceLoading && !project) {
      router.replace('/dashboard/tables');
    }
  }, [workspaceLoading, project, router]);

  useEffect(() => {
    if (project) load();
  }, [project?.id, tableName]);

  async function handleAdd() {
    if (!project) return;
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(newRow)) {
      if (v !== '') data[k] = v;
    }
    await apiClient.insertRow(project.id, tableName, data);
    setShowAdd(false);
    setNewRow({});
    await load(meta.page);
  }

  async function handleDelete(id: string) {
    if (!project || !confirm('Excluir registro?')) return;
    await apiClient.deleteRow(project.id, tableName, id);
    await load(meta.page);
  }

  if (workspaceLoading || !project) {
    return (
      <EmptyState
        title={workspaceLoading ? 'Carregando...' : 'Selecione um projeto'}
        description={
          workspaceLoading
            ? 'Aguarde enquanto carregamos seus dados.'
            : 'Escolha um projeto no menu superior para ver os registros.'
        }
      />
    );
  }

  return (
    <>
      <div className="mb-4">
        <Link
          href="/dashboard/tables"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar às tabelas
        </Link>
      </div>

      <PageHeader
        title={tableName}
        description={`${meta.total} registros`}
        action={
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" /> Novo registro
          </Button>
        }
      />

      {error && <Alert className="mb-4">{error}</Alert>}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              {columns.map((col) => (
                <th key={col} className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {col}
                </th>
              ))}
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum registro
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={String(row.id ?? i)} className="border-b border-border hover:bg-secondary/30">
                  {columns.map((col) => (
                    <td key={col} className="max-w-[200px] truncate px-4 py-3">
                      {String(row[col] ?? '')}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    {row.id != null && row.id !== '' && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(String(row.id))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={meta.page <= 1}
            onClick={() => load(meta.page - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {meta.page} / {meta.totalPages}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={meta.page >= meta.totalPages}
            onClick={() => load(meta.page + 1)}
          >
            Próxima
          </Button>
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Novo registro">
        <div className="space-y-3">
          {columns
            .filter((c) => c !== 'id')
            .map((col) => (
              <div key={col}>
                <label className="text-sm font-medium">{col}</label>
                <Input
                  className="mt-1"
                  value={newRow[col] ?? ''}
                  onChange={(e) => setNewRow({ ...newRow, [col]: e.target.value })}
                />
              </div>
            ))}
          <Button className="w-full" onClick={handleAdd}>
            Salvar
          </Button>
        </div>
      </Modal>
    </>
  );
}
