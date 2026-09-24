import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Injectable()
export class FileService {
  private readonly uploadDir = './uploads';

  constructor() {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  static getDiskStorage() {
    return diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
        callback(null, uniqueName);
      },
    });
  }

  static imageFileFilter(req: any, file: any, callback: any) {
    const mime = String(file.mimetype || '').toLowerCase();
    const ext = extname(file.originalname || '').toLowerCase();
    const allowedExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const allowedMime = /\/(jpg|jpeg|pjpeg|png|x-png|gif|webp)$/;
    const mimeMissing = !mime || mime === 'application/octet-stream';

    if (allowedMime.test(mime) || (mimeMissing && allowedExt.includes(ext))) {
      return callback(null, true);
    }
    return callback(new BadRequestException('Only image files are allowed'), false);
  }
}