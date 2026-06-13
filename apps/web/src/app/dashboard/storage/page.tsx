'use client';

import { useEffect, useState, useRef } from 'react';
import { Upload, Trash2, FileIcon } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/dashboard/dashboard-shell';
import { useRequireProject } from '@/contexts/workspace-context';
import { apiClient, type StorageFile } from '@/lib/api-client';
import { formatBytes } from '@/lib/utils';
import { Alert, Button, Card } from '@/components/ui';

export default function StoragePage() {
  const { project } = useRequireProject();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    if (!project) return;
    setFiles(await apiClient.getStorageFiles(project.id));
  }

  useEffect(() => {
    load().catch(() => setFiles([]));
  }, [project?.id]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!project || !file) return;
    setUploading(true);
    setError('');
    try {
      await apiClient.uploadFile(project.id, file);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDelete(id: string) {
    if (!project || !confirm('Excluir arquivo?')) return;
    await apiClient.deleteFile(project.id, id);
    await load();
  }

  if (!project) {
    return (
      <>
        <PageHeader title="Storage" description="Arquivos compatíveis com S3" />
        <EmptyState title="Selecione um projeto" description="Storage é isolado por projeto." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Storage"
        description={`Projeto: ${project.name} · Bucket: ${project.storageBucket ?? 'auto'}`}
        action={
          <>
            <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} />
            <Button disabled={uploading} onClick={() => inputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              {uploading ? 'Enviando...' : 'Upload'}
            </Button>
          </>
        }
      />

      {error && <Alert className="mb-4">{error}</Alert>}

      {files.length === 0 ? (
        <EmptyState
          title="Nenhum arquivo"
          description="Faça upload de imagens, PDFs, vídeos e outros arquivos."
          action={
            <Button onClick={() => inputRef.current?.click()}>
              <Upload className="h-4 w-4" /> Enviar arquivo
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {files.map((f) => (
            <Card key={f.id} className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileIcon className="h-8 w-8 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{f.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(f.size)} · {f.mimeType}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="danger" onClick={() => handleDelete(f.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
