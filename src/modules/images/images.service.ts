import { Injectable, ConflictException, NotFoundException, HttpStatus, BadRequestException, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Image, ImageDocument, ImageProvider } from './schemas/image.schema';
import { CreateImageFromUrlDto } from './dto/create-image.dto';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { Response } from 'express';

@Injectable()
export class ImagesService {
  constructor(
    @InjectModel(Image.name) private imageModel: Model<ImageDocument>,
  ) { }

  async createFromFile(file: Express.Multer.File, alt?: string): Promise<Image> {
    const existing = await this.imageModel.findOne({ filename: file.filename });
    if (existing) {
      throw new ConflictException(`Filename ${file.filename} already exists`);
    }

    const image = new this.imageModel({
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      alt,
      provider: ImageProvider.LOCAL,
    });
    return image.save();
  }

  async createFromUrl(createImageDto: CreateImageFromUrlDto): Promise<Image> {
    const image = new this.imageModel({
      url: createImageDto.url,
      alt: createImageDto.alt,
      provider: ImageProvider.EXTERNAL,
    });
    return image.save();
  }

  async findById(id: string): Promise<Image> {
    const _id = new Types.ObjectId(id);
    const image = await this.imageModel.findById(_id);
    if (!image) throw new NotFoundException('Image not found');
    return image;
  }

  async findByName(filename: string): Promise<Image> {
    const image = await this.imageModel.findOne({ filename });
    if (!image) throw new NotFoundException('Image not found');
    return image;
  }

  async delete(id: string): Promise<void> {
    try {
      const image = await this.findById(id);
      if (image.provider === ImageProvider.LOCAL && image.filename) {
        await this.deleteImageFile(image.filename);
      }
      await this.imageModel.deleteOne({ _id: image._id });
    } catch (error) {
      if (error instanceof NotFoundException) {
        console.error(`Failed to delete image with id: ${id}:`, error);
      } else {
        throw error;
      }
    }
  }

  async deleteImageFile(filename: string) {
    try {
      await unlink(join('./uploads', filename));
    } catch (err) {
      console.error(`Failed to delete file ${filename}:`, err);
    }
  }

  async getImageById(id: string, res: Response) {
    try {
      const image = await this.findById(id);
      await this.serveImage(image, res);
    } catch (error) {
      throw error;
    }
  }

  async findByFilename(filename: string, res: Response){
    try {
      const image = await this.imageModel.findOne({ filename });
      if (!image) throw new NotFoundException('Image not found');
      await this.serveImage(image, res);
      return image;
    } catch (error) {
      throw error;
    }

  }

  private async serveImage(image: any, res: Response) {
    if (image.provider === ImageProvider.LOCAL && image.filename) {
      // Servir archivo local
      const filePath = join(process.cwd(), 'uploads', image.filename);
      return res.sendFile(filePath);
    } else if (image.provider === ImageProvider.EXTERNAL && image.url) {
      // Redirigir a la URL externa
      return res.redirect(HttpStatus.FOUND, image.url);
    } else {
      throw new BadRequestException('Image file not available');
    }
  }

}