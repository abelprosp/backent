import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NO_CODE_CONNECTORS } from '@backent/shared';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtAuthGuard } from '@/common/guards/auth.guard';
import { ProjectAccessGuard } from '@/common/guards/access.guard';
import { assertSafeConnectorId } from '@/common/security/url.util';

@ApiTags('Connectors')
@Controller('connectors')
export class ConnectorsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list() {
    return NO_CODE_CONNECTORS;
  }

  @Get(':connector/projects/:projectId/snippet')
  @UseGuards(JwtAuthGuard, ProjectAccessGuard)
  @ApiBearerAuth()
  async getSnippet(
    @Param('connector') connector: string,
    @Param('projectId') projectId: string,
  ) {
    assertSafeConnectorId(connector);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    const apiUrl =
      project?.apiUrl ??
      `${process.env.API_URL}/api/v1/projects/${projectId}/data`;

    const snippets: Record<string, object> = {
      bubble: {
        type: 'API Connector',
        baseUrl: apiUrl,
        headers: { 'X-API-Key': 'YOUR_API_KEY' },
        example: `GET ${apiUrl}/users`,
      },
      n8n: {
        node: 'HTTP Request',
        method: 'GET',
        url: `${apiUrl}/users`,
        headers: { 'X-API-Key': 'YOUR_API_KEY' },
      },
    };

    return {
      connector,
      apiUrl,
      snippet: snippets[connector] ?? { message: 'Use X-API-Key header com sua key' },
    };
  }
}
