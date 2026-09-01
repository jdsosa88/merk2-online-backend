const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '../config/envs/.env.development'),
});

const DEFAULT_ZONE_PRICE_CENTS = 15000;

const DEFAULT_WEIGHT_SURCHARGE_TIERS = [
  { minWeight: 0.1, maxWeight: 1.5, surchargeCents: 0 },
  { minWeight: 1.6, maxWeight: 2.5, surchargeCents: 20000 },
  { minWeight: 2.6, maxWeight: 3.5, surchargeCents: 40000 },
  { minWeight: 3.6, maxWeight: 4.5, surchargeCents: 60000 },
  { minWeight: 4.6, maxWeight: 5.5, surchargeCents: 80000 },
  { minWeight: 5.6, maxWeight: 6.5, surchargeCents: 80000 },
  { minWeight: 6.6, maxWeight: 999, surchargeCents: 100000 },
];

const MANZANILLO_ZONES = [
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
];

const DeliveryZoneSchema = new mongoose.Schema(
  {
    province: { type: String, required: true },
    municipality: { type: String, required: true },
    name: { type: String, required: true },
    defaultPriceCents: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'delivery_zones' },
);

DeliveryZoneSchema.index({ province: 1, municipality: 1, name: 1 }, { unique: true });

const PlatformDeliveryConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    weightSurchargeTiers: {
      type: [
        {
          minWeight: Number,
          maxWeight: Number,
          surchargeCents: Number,
        },
      ],
      required: true,
    },
  },
  { timestamps: true, collection: 'platform_delivery_config' },
);

const DeliveryZone = mongoose.model('DeliveryZone', DeliveryZoneSchema);
const PlatformDeliveryConfig = mongoose.model(
  'PlatformDeliveryConfig',
  PlatformDeliveryConfigSchema,
);

async function seedDelivery() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const existingZones = await DeliveryZone.countDocuments({
    province: 'Granma',
    municipality: 'Manzanillo',
  });

  if (existingZones === 0) {
    const docs = MANZANILLO_ZONES.map((name, index) => ({
      province: 'Granma',
      municipality: 'Manzanillo',
      name,
      defaultPriceCents: DEFAULT_ZONE_PRICE_CENTS,
      isActive: true,
      sortOrder: index,
    }));
    await DeliveryZone.insertMany(docs);
    console.log(`Inserted ${docs.length} delivery zones for Manzanillo`);
  } else {
    console.log(`Skipping zones seed (${existingZones} already exist)`);
  }

  const platformConfig = await PlatformDeliveryConfig.findOne({ key: 'default' });
  if (!platformConfig) {
    await PlatformDeliveryConfig.create({
      key: 'default',
      weightSurchargeTiers: DEFAULT_WEIGHT_SURCHARGE_TIERS,
    });
    console.log('Platform delivery config created');
  } else {
    console.log('Platform delivery config already exists');
  }

  await mongoose.disconnect();
  console.log('Delivery seed completed');
}

async function cleanDelivery() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined');
  }

  await mongoose.connect(mongoUri);
  await DeliveryZone.deleteMany({ province: 'Granma', municipality: 'Manzanillo' });
  await PlatformDeliveryConfig.deleteMany({ key: 'default' });
  await mongoose.disconnect();
  console.log('Delivery seed data cleaned');
}

const command = process.argv[2];
if (command === 'clean') {
  cleanDelivery().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  seedDelivery().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
