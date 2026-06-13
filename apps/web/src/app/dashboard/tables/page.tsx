'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Table2, Eye } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/dashboard/dashboard-shell';
import { useRequireProject } from '@/contexts/workspace-context';
import { apiClient, type ProjectTable, type ColumnDef } from '@/lib/api-client';
import { COLUMN_TYPES } from '@backent/shared';
import {
  Alert,
  Button,
  Card,
  Input,
  Modal,
  Select,
} from '@/components/ui';

export default function TablesPage() {
  const { project, projects } = useRequireProject();
  const [tables, setTables] = useState<ProjectTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<ColumnDef[]>([
    { name: 'id', type: 'uuid', primaryKey: true },
    { name: 'name', type: 'varchar' },
  ]);
  const [error, setError] = useState('');

  async function loadTables() {
    if (!project) return;
    setLoading(true);
    try {
      const data = await apiClient.getTables(project.id);
      setTables(data);
    } catch {
      setTables([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTables();
  }, [project?.id]);

  function addColumn() {
    setColumns([...columns, { name: '', type: 'varchar' }]);
  }

  function updateColumn(i: number, field: keyof ColumnDef, value: string | boolean) {
    const next = [...columns];
    next[i] = { ...next[i], [field]: value };
    setColumns(next);
  }

  function removeColumn(i: number) {
    setColumns(columns.filter((_, idx) => idx !== i));
  }

  async function handleCreate() {
    if (!project || !tableName.trim()) return;
    setError('');
    try {
      await apiClient.createTable(project.id, {
        name: tableName.trim().toLowerCase().replace(/\s+/g, '_'),
        displayName: tableName,
        columns: columns.filter((c) => c.name.trim()),
      });
      setShowCreate(false);
      setTableName('');
      setColumns([
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'name', type: 'varchar' },
      ]);
      await loadTables();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar tabela');
    }
  }

  async function handleDelete(name: string) {
    if (!project || !confirm(`Excluir tabela "${name}"?`)) return;
    await apiClient.deleteTable(project.id, name);
    await loadTables();
  }

  if (!project) {
    return (
      <>
        <PageHeader title="Tabelas" description="Gerenciador visual de banco de dados" />
        <EmptyState
          title="Selecione um projeto"
          description="Escolha um projeto no menu superior ou crie um novo."
          action={
            projects.length === 0 ? (
              <Link href="/dashboard/projects">
                <Button>Criar projeto</Button>
              </Link>
            ) : undefined
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Tabelas"
        description={`Projeto: ${project.name}`}
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Nova tabela
          </Button>
        }
      />

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : tables.length === 0 ? (
        <EmptyState
          title="Nenhuma tabela"
          description="Crie tabelas visualmente — a API REST é gerada automaticamente."
          action={<Button onClick={() => setShowCreate(true)}>Criar tabela</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tables.map((t) => (
            <Card key={t.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Table2 className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-medium">{t.displayName ?? t.name}</h3>
                    <p className="text-xs text-muted-foreground">{t.name}</p>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {(t.columns as ColumnDef[]).length} colunas · {t.rowCount} registros
              </p>
              <div className="mt-4 flex gap-2">
                <Link href={`/dashboard/tables/${t.name}`} className="flex-1">
                  <Button size="sm" variant="secondary" className="w-full">
                    <Eye className="h-3 w-3" /> Ver dados
                  </Button>
                </Link>
                <Button size="sm" variant="danger" onClick={() => handleDelete(t.name)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nova tabela">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {error && <Alert>{error}</Alert>}
          <div>
            <label className="text-sm font-medium">Nome da tabela</label>
            <Input
              className="mt-1"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="users"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Colunas</label>
              <Button size="sm" variant="ghost" onClick={addColumn}>
                + Coluna
              </Button>
            </div>
            <div className="mt-2 space-y-2">
              {columns.map((col, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="nome"
                    value={col.name}
                    onChange={(e) => updateColumn(i, 'name', e.target.value)}
                  />
                  <Select
                    value={col.type}
                    onChange={(e) => updateColumn(i, 'type', e.target.value)}
                  >
                    {COLUMN_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                  <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={col.primaryKey ?? false}
                      onChange={(e) => updateColumn(i, 'primaryKey', e.target.checked)}
                    />
                    PK
                  </label>
                  {columns.length > 1 && (
                    <Button size="sm" variant="ghost" onClick={() => removeColumn(i)}>
                      ✕
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={handleCreate}>
            Criar tabela
          </Button>
        </div>
      </Modal>
    </>
  );
}
