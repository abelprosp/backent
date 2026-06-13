import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { PrismaService } from '@/prisma/prisma.service';
import { randomUUID } from 'crypto';

import { sanitizeFilename } from '@/common/security/sql.util';

@Injectable()
export class StorageService implements OnModuleInit {
  private client!: Minio.Client;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
      port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY ?? 'backent_minio',
      secretKey: process.env.MINIO_SECRET_KEY ?? 'backent_minio_secret',
    });
  }

  async ensureBucket(bucket: string) {
    const exists = await this.client.bucketExists(bucket);
    if (!exists) {
      await this.client.makeBucket(bucket);
    }
  }

  async upload(projectId: string, file: Express.Multer.File, isPublic = false) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new Error('Projeto não encontrado');

    const bucket = project.storageBucket ?? `backent-${projectId.slice(0, 8)}`;
    await this.ensureBucket(bucket);
    const safeName = sanitizeFilename(file.originalname);
    const key = `${Date.now()}-${randomUUID()}-${safeName}`;

    await this.client.putObject(bucket, key, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    const record = await this.prisma.storageFile.create({
      data: {
        projectId,
        bucket,
        key,
        filename: safeName,
        mimeType: file.mimetype,
        size: file.size,
        isPublic,
      },
    });

    return {
      id: record.id,
      key,
      filename: safeName,
      size: file.size,
      mimeType: file.mimetype,
      url: await this.getUrl(bucket, key),
    };
  }

  async getUrl(bucket: string, key: string) {
    return this.client.presignedGetObject(bucket, key, 24 * 60 * 60);
  }

  async delete(projectId: string, fileId: string) {
    const file = await this.prisma.storageFile.findFirst({
      where: { id: fileId, projectId },
    });
    if (!file) return { success: false };

    await this.client.removeObject(file.bucket, file.key);
    await this.prisma.storageFile.delete({ where: { id: fileId } });
    return { success: true };
  }

  async list(projectId: string) {
    return this.prisma.storageFile.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
