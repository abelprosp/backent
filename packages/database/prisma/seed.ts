import { PrismaClient, PlanTier, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Backent platform database...');

  const plans = [
    {
      name: 'Free',
      tier: PlanTier.FREE,
      priceMonthly: 0,
      priceYearly: 0,
      storageGb: 5,
      apiRequests: 10000,
      maxProjects: 1,
      maxTables: 10,
      maxUsers: 100,
      bandwidthGb: 10,
      realtimeEnabled: false,
      webhooksEnabled: false,
      customDomain: false,
    },
    {
      name: 'Pro',
      tier: PlanTier.PRO,
      priceMonthly: 2900,
      priceYearly: 29000,
      storageGb: 25,
      apiRequests: 100000,
      maxProjects: 5,
      maxTables: 50,
      maxUsers: 1000,
      bandwidthGb: 50,
      realtimeEnabled: true,
      webhooksEnabled: true,
      customDomain: false,
    },
    {
      name: 'Business',
      tier: PlanTier.BUSINESS,
      priceMonthly: 9900,
      priceYearly: 99000,
      storageGb: 100,
      apiRequests: 1000000,
      maxProjects: 20,
      maxTables: 200,
      maxUsers: 10000,
      bandwidthGb: 200,
      realtimeEnabled: true,
      webhooksEnabled: true,
      customDomain: true,
    },
    {
      name: 'Enterprise',
      tier: PlanTier.ENTERPRISE,
      priceMonthly: 0,
      priceYearly: 0,
      storageGb: 500,
      apiRequests: 10000000,
      maxProjects: 100,
      maxTables: 1000,
      maxUsers: 100000,
      bandwidthGb: 1000,
      realtimeEnabled: true,
      webhooksEnabled: true,
      customDomain: true,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { tier: plan.tier },
      update: plan,
      create: plan,
    });
  }

  const serverNode = await prisma.serverNode.upsert({
    where: { host: 'localhost' },
    update: {},
    create: {
      name: 'Primary VPS',
      host: 'localhost',
      port: 5432,
      region: 'sa-east-1',
      capacity: 100,
      storageTotal: 400,
      isPrimary: true,
    },
  });

  const adminPassword = await bcrypt.hash('admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@backent.io' },
    update: {},
    create: {
      email: 'admin@backent.io',
      passwordHash: adminPassword,
      name: 'Backent Admin',
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
    },
  });

  const freePlan = await prisma.plan.findUnique({
    where: { tier: PlanTier.FREE },
  });

  if (freePlan) {
    const workspace = await prisma.workspace.upsert({
      where: { slug: 'backent-demo' },
      update: {},
      create: {
        name: 'Backent Demo',
        slug: 'backent-demo',
        ownerId: admin.id,
        planId: freePlan.id,
      },
    });

    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: admin.id,
        },
      },
      update: {},
      create: {
        workspaceId: workspace.id,
        userId: admin.id,
        role: 'owner',
      },
    });
  }

  const templates = [
    {
      name: 'SaaS Starter',
      description: 'Template completo para SaaS com users, subscriptions e invoices',
      category: 'saas',
      isPublic: true,
      schema: {
        tables: [
          {
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid', primaryKey: true },
              { name: 'email', type: 'varchar', unique: true },
              { name: 'name', type: 'varchar' },
              { name: 'avatar_url', type: 'text', nullable: true },
              { name: 'created_at', type: 'timestamptz', default: 'now()' },
            ],
          },
          {
            name: 'subscriptions',
            columns: [
              { name: 'id', type: 'uuid', primaryKey: true },
              { name: 'user_id', type: 'uuid', references: 'users.id' },
              { name: 'plan', type: 'varchar' },
              { name: 'status', type: 'varchar' },
              { name: 'expires_at', type: 'timestamptz', nullable: true },
            ],
          },
        ],
      },
    },
    {
      name: 'E-commerce',
      description: 'Produtos, categorias, pedidos e clientes',
      category: 'ecommerce',
      isPublic: true,
      schema: {
        tables: [
          {
            name: 'products',
            columns: [
              { name: 'id', type: 'uuid', primaryKey: true },
              { name: 'name', type: 'varchar' },
              { name: 'price', type: 'decimal' },
              { name: 'stock', type: 'integer' },
              { name: 'category_id', type: 'uuid', nullable: true },
            ],
          },
          {
            name: 'orders',
            columns: [
              { name: 'id', type: 'uuid', primaryKey: true },
              { name: 'customer_email', type: 'varchar' },
              { name: 'total', type: 'decimal' },
              { name: 'status', type: 'varchar' },
            ],
          },
        ],
      },
    },
    {
      name: 'Blog CMS',
      description: 'Posts, autores, categorias e comentários',
      category: 'cms',
      isPublic: true,
      schema: {
        tables: [
          {
            name: 'posts',
            columns: [
              { name: 'id', type: 'uuid', primaryKey: true },
              { name: 'title', type: 'varchar' },
              { name: 'slug', type: 'varchar', unique: true },
              { name: 'content', type: 'text' },
              { name: 'published', type: 'boolean', default: false },
            ],
          },
        ],
      },
    },
  ];

  for (const template of templates) {
    const existing = await prisma.projectTemplate.findFirst({
      where: { name: template.name },
    });
    if (!existing) {
      await prisma.projectTemplate.create({ data: template });
    }
  }

  console.log('✅ Seed completed');
  console.log(`   Admin: admin@backent.io / admin123!`);
  console.log(`   Server: ${serverNode.name} (${serverNode.host})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
