import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '@/common/guards/auth.guard';
import { ProjectAccessGuard } from '@/common/guards/access.guard';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'text/csv',
  'video/mp4',
  'application/json',
]);

@ApiTags('Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
@Controller('projects/:projectId/storage')
export class StorageController {
  constructor(private storageService: StorageService) {}

  @Get()
  list(@Param('projectId') projectId: string) {
    return this.storageService.list(projectId);
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE, files: 1 },
    }),
  )
  async upload(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não permitido');
    }
    return this.storageService.upload(projectId, file);
  }

  @Delete(':fileId')
  delete(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
  ) {
    return this.storageService.delete(projectId, fileId);
  }
}
