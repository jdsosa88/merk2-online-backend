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
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      return callback(new BadRequestException('Only image files are allowed'), false);
    }
    callback(null, true);
  }
}