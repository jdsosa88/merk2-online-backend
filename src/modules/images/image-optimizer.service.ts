import { Injectable, Logger } from '@nestjs/common';
import { encode } from 'blurhash';
import { rename, unlink, writeFile } from 'fs/promises';
import { basename, dirname, extname, join } from 'path';
import sharp, { type Sharp } from 'sharp';

export type OptimizedLocalImage = {
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  blurhash: string;
  path: string;
};

@Injectable()
export class ImageOptimizerService {
  private readonly logger = new Logger(ImageOptimizerService.name);

  /** Max edge length — keeps product photos sharp on retina without huge files. */
  private readonly maxDimension = 1920;
  private readonly webpQuality = 80;

  async optimizeLocalUpload(file: Express.Multer.File): Promise<OptimizedLocalImage> {
    const originalPath = file.path || join(process.cwd(), 'uploads', file.filename);
    const baseName = basename(file.filename, extname(file.filename));
    const webpFilename = `${baseName}.webp`;
    const webpPath = join(dirname(originalPath), webpFilename);
    const tempPath = `${webpPath}.tmp`;

    try {
      const resized = sharp(originalPath)
        .rotate()
        .resize({
          width: this.maxDimension,
          height: this.maxDimension,
          fit: 'inside',
          withoutEnlargement: true,
        });

      const [webpResult, blurhash] = await Promise.all([
        resized
          .clone()
          .webp({ quality: this.webpQuality, effort: 4 })
          .toBuffer({ resolveWithObject: true }),
        this.encodeBlurhash(resized.clone()),
      ]);

      await writeFile(tempPath, webpResult.data);
      await rename(tempPath, webpPath);

      if (originalPath !== webpPath) {
        await unlink(originalPath).catch((err) => {
          this.logger.warn(`Could not remove original upload ${originalPath}: ${err?.message}`);
        });
      }

      return {
        filename: webpFilename,
        mimeType: 'image/webp',
        size: webpResult.info.size,
        url: `/uploads/${webpFilename}`,
        blurhash,
        path: webpPath,
      };
    } catch (error) {
      await unlink(webpPath).catch(() => undefined);
      await unlink(tempPath).catch(() => undefined);
      throw error;
    }
  }

  private async encodeBlurhash(pipeline: Sharp): Promise<string> {
    const { data, info } = await pipeline
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' })
      .toBuffer({ resolveWithObject: true });

    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
  }
}
