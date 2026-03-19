import { Controller, Post, UseInterceptors, UploadedFile, Body, UseGuards, Get, Query, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImagesService } from './images.service';
import { CreateImageFromUrlDto } from './dto/create-image.dto';
import { FileService } from 'src/common/services/file.service'; // el mismo de antes
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { IdDto } from 'src/common/dto/id.dto';
import { Response } from 'express';
import { FindByFilenameDto } from './dto/find-by-filename.dto';
import { ApiGetImageByFilename, ApiGetImageById } from './decorators/swagger-images.decorator';

@Controller('images')
@UseGuards(JwtAuthGuard)
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) { }

  @Get()
  @ApiGetImageById()
  async getImageFileById(@Query() idDto: IdDto, @Res() res: Response) {
    return this.imagesService.getImageById(idDto.id, res);
  }

   @Get('by-filename')
   @ApiGetImageByFilename()
  async getImageFileByFilename(@Query() filenameDto: FindByFilenameDto, @Res() res: Response) {   
      return this.imagesService.findByFilename(filenameDto.filename, res);
  }
}