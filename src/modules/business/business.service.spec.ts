import { Test, TestingModule } from '@nestjs/testing';
import { BusinessService } from './business.service';
import { Model } from 'mongoose';
import { Business, BusinessDocument } from './schemas/business.schema';
import { getModelToken } from '@nestjs/mongoose';

describe('BusinessController', () => {
  let service: BusinessService;
  let businessModel: jest.Mocked<Model<BusinessDocument>>;

  const mockBusinessModel = {}


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessService,
        {
          provide: getModelToken(Business.name),
          useValue: mockBusinessModel,
        },
      ],
    }).compile();

    service = module.get<BusinessService>(BusinessService);
    businessModel = module.get(getModelToken(Business.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
