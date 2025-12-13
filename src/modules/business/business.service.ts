import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Business, BusinessDocument } from './schemas/business.schema';
import { Model } from 'mongoose';


@Injectable()
export class BusinessService {

  constructor(
    @InjectModel(Business.name) private businessModel: Model<BusinessDocument>,
  ) {}
}
