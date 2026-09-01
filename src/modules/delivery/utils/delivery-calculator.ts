import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { WeightSurchargeTier } from '../schemas/weight-surcharge-tier.schema';
import { StoreDeliveryConfig } from '../schemas/store-delivery.schema';
import { DeliveryZone } from '../schemas/delivery-zone.schema';
import { DEFAULT_PRODUCT_INFLUENCE_WEIGHT } from '../types/delivery.constants';
import { MoneyUtils } from 'src/common/utils/money.utils';

export type DeliveryCartItem = {
  influenceWeight: number;
  quantity: number;
};

export type DeliveryChargeBreakdown = {
  deliveryChargeCents: number;
  zoneBaseCents: number;
  weightSurchargeCents: number;
  totalInfluenceWeight: number;
};

export function sumInfluenceWeight(items: DeliveryCartItem[]): number {
  return items.reduce(
    (sum, item) =>
      sum +
      (item.influenceWeight ?? DEFAULT_PRODUCT_INFLUENCE_WEIGHT) * item.quantity,
    0,
  );
}

export function resolveWeightSurchargeCents(
  totalWeight: number,
  tiers: WeightSurchargeTier[],
): number {
  if (!tiers.length) {
    return 0;
  }

  const sorted = [...tiers].sort((a, b) => a.minWeight - b.minWeight);
  const match = sorted.find(
    (tier) => totalWeight >= tier.minWeight && totalWeight <= tier.maxWeight,
  );

  if (!match) {
    const last = sorted[sorted.length - 1];
    if (totalWeight > last.maxWeight) {
      return last.surchargeCents;
    }
    throw new BadRequestException(
      `Total influence weight ${totalWeight} is below the minimum configured tier (${sorted[0].minWeight})`,
    );
  }

  return match.surchargeCents;
}

export function resolveZoneBasePriceCents(
  zoneId: Types.ObjectId | string,
  zone: Pick<DeliveryZone, 'defaultPriceCents'>,
  deliveryConfig?: StoreDeliveryConfig | null,
): number {
  const zoneIdStr = zoneId.toString();
  const storePrice = deliveryConfig?.zonePrices?.find(
    (zp) => zp.zoneId.toString() === zoneIdStr,
  );

  return storePrice?.priceCents ?? zone.defaultPriceCents;
}

export function calculateDeliveryCharge(params: {
  items: DeliveryCartItem[];
  zone: Pick<DeliveryZone, 'defaultPriceCents'>;
  zoneId: Types.ObjectId | string;
  storeDeliveryConfig?: StoreDeliveryConfig | null;
  platformTiers: WeightSurchargeTier[];
}): DeliveryChargeBreakdown {
  const totalInfluenceWeight = sumInfluenceWeight(params.items);
  const tiers =
    params.storeDeliveryConfig?.weightSurchargeTiers?.length
      ? params.storeDeliveryConfig.weightSurchargeTiers
      : params.platformTiers;

  const zoneBaseCents = resolveZoneBasePriceCents(
    params.zoneId,
    params.zone,
    params.storeDeliveryConfig,
  );
  const weightSurchargeCents = resolveWeightSurchargeCents(
    totalInfluenceWeight,
    tiers,
  );
  const deliveryChargeCents = MoneyUtils.sumCents(
    zoneBaseCents,
    weightSurchargeCents,
  );

  return {
    deliveryChargeCents,
    zoneBaseCents,
    weightSurchargeCents,
    totalInfluenceWeight,
  };
}
