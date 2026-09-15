import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DeliveryZone,
  DeliveryZoneDocument,
} from './schemas/delivery-zone.schema';
import {
  PlatformDeliveryConfig,
  PlatformDeliveryConfigDocument,
} from './schemas/platform-delivery-config.schema';
import { CreateDeliveryZoneDto } from './dto/create-delivery-zone.dto';
import { UpdateDeliveryZoneDto } from './dto/update-delivery-zone.dto';
import { ListDeliveryZonesQueryDto } from './dto/list-zones-query.dto';
import { UpdatePlatformDeliveryConfigDto } from './dto/update-platform-delivery-config.dto';
import {
  DEFAULT_WEIGHT_SURCHARGE_TIERS,
  DEFAULT_ZONE_PRICE_CENTS,
} from './types/delivery.constants';
import { WeightSurchargeTier } from './schemas/weight-surcharge-tier.schema';
import { StoreDeliveryConfig } from './schemas/store-delivery.schema';
import { MoneyUtils } from 'src/common/utils/money.utils';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectModel(DeliveryZone.name)
    private readonly zoneModel: Model<DeliveryZoneDocument>,
    @InjectModel(PlatformDeliveryConfig.name)
    private readonly platformConfigModel: Model<PlatformDeliveryConfigDocument>,
  ) {}

  async listZones(query: ListDeliveryZonesQueryDto): Promise<DeliveryZone[]> {
    const filter: Record<string, unknown> = { isActive: true };
    if (query.province) {
      filter.province = new RegExp(`^${this.escapeRegex(query.province.trim())}$`, 'i');
    }
    if (query.municipality) {
      filter.municipality = new RegExp(
        `^${this.escapeRegex(query.municipality.trim())}$`,
        'i',
      );
    }

    return this.zoneModel
      .find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .exec();
  }

  async listAllZones(includeInactive = false): Promise<DeliveryZone[]> {
    const filter = includeInactive ? {} : { isActive: true };
    return this.zoneModel.find(filter).sort({ sortOrder: 1, name: 1 }).exec();
  }

  async findZoneById(id: string): Promise<DeliveryZoneDocument> {
    const zone = await this.zoneModel.findById(id).exec();
    if (!zone) {
      throw new NotFoundException(`Delivery zone ${id} not found`);
    }
    return zone;
  }

  async createZone(dto: CreateDeliveryZoneDto): Promise<DeliveryZone> {
    const payload = CreateDeliveryZoneDto.toCents(dto);

    const zone = new this.zoneModel({
      ...payload,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });
    return zone.save();
  }

  async updateZone(id: string, dto: UpdateDeliveryZoneDto): Promise<DeliveryZone> {
    const payload = UpdateDeliveryZoneDto.toCents(dto);
    const zone = await this.zoneModel
      .findByIdAndUpdate(id, payload, { new: true, runValidators: true })
      .exec();

    if (!zone) {
      throw new NotFoundException(`Delivery zone ${id} not found`);
    }
    return zone;
  }

  async removeZone(id: string): Promise<DeliveryZone> {
    const zone = await this.zoneModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();

    if (!zone) {
      throw new NotFoundException(`Delivery zone ${id} not found`);
    }
    return zone;
  }

  async getPlatformConfig(): Promise<PlatformDeliveryConfigDocument> {
    let config = await this.platformConfigModel.findOne({ key: 'default' }).exec();
    if (!config) {
      config = await this.platformConfigModel.create({
        key: 'default',
        weightSurchargeTiers: [...DEFAULT_WEIGHT_SURCHARGE_TIERS],
      });
    }
    return config;
  }

  async getPlatformWeightTiers(): Promise<WeightSurchargeTier[]> {
    const config = await this.getPlatformConfig();
    return config.weightSurchargeTiers;
  }

  async updatePlatformConfig(
    dto: UpdatePlatformDeliveryConfigDto,
  ): Promise<PlatformDeliveryConfig> {
    const payload = UpdatePlatformDeliveryConfigDto.toCents(dto);
    this.assertValidTiers({ weightSurchargeTiers: payload.weightSurchargeTiers });

    const config = await this.platformConfigModel
      .findOneAndUpdate({ key: 'default' }, payload, {
        new: true,
        upsert: true,
        runValidators: true,
      })
      .exec();

    return config!;
  }

  /** Precios por zona listos para una tienda nueva (copia defaults de plataforma). */
  async buildDefaultStoreDeliveryConfig(
    province?: string,
    municipality?: string,
  ): Promise<StoreDeliveryConfig> {
    const zones =
      province && municipality
        ? await this.listZones({ province, municipality })
        : await this.listAllZones(false);

    return {
      zonePrices: zones.map((zone) => ({
        zoneId: zone._id,
        priceCents: zone.defaultPriceCents ?? DEFAULT_ZONE_PRICE_CENTS,
      })),
      weightSurchargeTiers: [],
    };
  }

  /** Provincias/municipios con al menos una zona activa (para selector del provider). */
  async listSalesRegions(): Promise<
    Array<{ province: string; municipality: string; zoneCount: number }>
  > {
    const rows = await this.zoneModel
      .aggregate<{
        _id: { province: string; municipality: string };
        zoneCount: number;
      }>([
        { $match: { isActive: true } },
        {
          $group: {
            _id: { province: '$province', municipality: '$municipality' },
            zoneCount: { $sum: 1 },
          },
        },
        { $sort: { '_id.province': 1, '_id.municipality': 1 } },
      ])
      .exec();

    return rows.map((row) => ({
      province: row._id.province,
      municipality: row._id.municipality,
      zoneCount: row.zoneCount,
    }));
  }

  formatStoreDeliveryConfig(
    config: StoreDeliveryConfig | undefined,
    zones: DeliveryZone[],
    platformTiers: WeightSurchargeTier[],
  ) {
    const zonePrices = zones.map((zone) => {
      const storePrice = config?.zonePrices?.find(
        (zp) => zp.zoneId.toString() === zone._id.toString(),
      );
      const priceCents = storePrice?.priceCents ?? zone.defaultPriceCents;
      return {
        zoneId: zone._id.toString(),
        zoneName: zone.name,
        province: zone.province,
        municipality: zone.municipality,
        price: MoneyUtils.centsToDecimal(priceCents),
        platformDefaultPrice: MoneyUtils.centsToDecimal(zone.defaultPriceCents),
      };
    });

    const effectiveTiers =
      config?.weightSurchargeTiers?.length
        ? config.weightSurchargeTiers
        : platformTiers;

    return {
      zonePrices,
      weightSurchargeTiers: effectiveTiers.map((tier) => ({
        minWeight: tier.minWeight,
        maxWeight: tier.maxWeight,
        surcharge: MoneyUtils.centsToDecimal(tier.surchargeCents),
      })),
      usesPlatformWeightTiers: !config?.weightSurchargeTiers?.length,
    };
  }

  private assertValidTiers(payload: { weightSurchargeTiers?: WeightSurchargeTier[] }) {
    const tiers = payload.weightSurchargeTiers;
    if (!tiers?.length) {
      return;
    }

    for (const tier of tiers) {
      if (tier.minWeight > tier.maxWeight) {
        throw new BadRequestException(
          `Invalid tier: minWeight (${tier.minWeight}) cannot exceed maxWeight (${tier.maxWeight})`,
        );
      }
    }

    const sorted = [...tiers].sort((a, b) => a.minWeight - b.minWeight);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].minWeight <= sorted[i - 1].maxWeight) {
        throw new BadRequestException('Weight surcharge tiers cannot overlap');
      }
    }
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
