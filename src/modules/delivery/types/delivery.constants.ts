import { MoneyUtils } from 'src/common/utils/money.utils';

export const DELIVERY_REGION = {
  province: 'Granma',
  municipality: 'Manzanillo',
} as const;

/** Zonas iniciales de Manzanillo (admin puede añadir más). */
export const DEFAULT_MANZANILLO_ZONES = [
  'Centro del pueblo',
  'ICP',
  'Pesquera',
  'La Loma',
  'Caimari',
  'Nuevo Manzanillo',
  'Barrio de Oro',
  'Rpto Vázquez',
  'Horacio',
  'La Vuelta',
  'Blanquizal',
  'Las Guazasas',
  'Las Novillas',
  'Pueblo Nuevo',
  'Valerino',
  'San Felipe',
  'La Terminal de Trenes',
] as const;

/** Precio base por defecto para cada zona (150 CUP). */
export const DEFAULT_ZONE_PRICE_CENTS = MoneyUtils.decimalToCents(150);

/**
 * Recargos por peso influenciador acumulado del pedido.
 * Entre 0.1–1.5 solo se cobra el precio base de zona.
 */
export const DEFAULT_WEIGHT_SURCHARGE_TIERS = [
  { minWeight: 0.1, maxWeight: 1.5, surchargeCents: 0 },
  { minWeight: 1.6, maxWeight: 2.5, surchargeCents: MoneyUtils.decimalToCents(200) },
  { minWeight: 2.6, maxWeight: 3.5, surchargeCents: MoneyUtils.decimalToCents(400) },
  { minWeight: 3.6, maxWeight: 4.5, surchargeCents: MoneyUtils.decimalToCents(600) },
  { minWeight: 4.6, maxWeight: 5.5, surchargeCents: MoneyUtils.decimalToCents(800) },
  { minWeight: 5.6, maxWeight: 6.5, surchargeCents: MoneyUtils.decimalToCents(800) },
  { minWeight: 6.6, maxWeight: 999, surchargeCents: MoneyUtils.decimalToCents(1000) },
] as const;

/** Peso influenciador por defecto para productos sin valor definido. */
export const DEFAULT_PRODUCT_INFLUENCE_WEIGHT = 0.1;
