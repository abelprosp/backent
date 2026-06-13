import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@backent/database';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** Queries tenant data using fully-qualified schema.table (no search_path). */
  async executeTenantQuery<T = unknown>(
    query: string,
    params: unknown[] = [],
  ): Promise<T> {
    return this.$queryRawUnsafe<T>(query, ...params);
  }

  async executeTenantCommand(
    command: string,
    params: unknown[] = [],
  ): Promise<number> {
    const result = await this.$executeRawUnsafe(command, ...params);
    return result as number;
  }
}
