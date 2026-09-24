import { Injectable, Logger } from '@nestjs/common';
import { encode } from 'blurhash';
import { rename, stat, unlink, writeFile } from 'fs/promises';
import { basename, dirname, extname, join } from 'path';
import type { Sharp, SharpOptions } from 'sharp';

// Sharp 0.35 ships ESM types (`export default`) but CJS runtime (`module.exports = fn`).
// Nest compiles without esModuleInterop, so `import sharp from 'sharp'` becomes `.default`.
const loaded: unknown = require('sharp');
const sharp = (
  typeof loaded === 'function'
    ? loaded
    : (loaded as { default: unknown }).default
) as (input?: string | Buffer, options?: SharpOptions) => Sharp;

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
      const fileStat = await stat(originalPath).catch(() => undefined);
      if (!fileStat || fileStat.size === 0) {
        throw new Error(`Uploaded file is empty (${file.originalname})`);
      }

      // Phone/Telegram JPEGs often carry recoverable libvips warnings.
      // Default failOn: 'warning' rejects those as invalid even though browsers show them.
      const webpResult = await this.createPipeline(originalPath)
        .rotate()
        .resize({
          width: this.maxDimension,
          height: this.maxDimension,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toColorspace('srgb')
        .webp({ quality: this.webpQuality, effort: 4 })
        .toBuffer({ resolveWithObject: true });

      const blurhash = await this.encodeBlurhashFromBuffer(webpResult.data);

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
      this.logger.warn(
        `Failed to optimize "${file.originalname}": ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  private createPipeline(input: string | Buffer): Sharp {
    return sharp(input, {
      failOn: 'none',
      sequentialRead: true,
      animated: false,
    });
  }

  private async encodeBlurhashFromBuffer(buffer: Buffer): Promise<string> {
    const { data, info } = await this.createPipeline(buffer)
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' })
      .toBuffer({ resolveWithObject: true });

    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
  }
}
