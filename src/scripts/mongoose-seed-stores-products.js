const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '../config/envs/.env.development'),
});

const OWNER_EMAIL = process.env.SEED_PROVIDER_EMAIL || 'seller.applicant@test.com';

const defaultWeek = [
  { day: 1, name: 'Lunes', startHour: '08:00', endHour: '18:00', isOpen: true },
  { day: 2, name: 'Martes', startHour: '08:00', endHour: '18:00', isOpen: true },
  { day: 3, name: 'Miércoles', startHour: '08:00', endHour: '18:00', isOpen: true },
  { day: 4, name: 'Jueves', startHour: '08:00', endHour: '18:00', isOpen: true },
  { day: 5, name: 'Viernes', startHour: '08:00', endHour: '18:00', isOpen: true },
  { day: 6, name: 'Sábado', startHour: '08:00', endHour: '18:00', isOpen: false },
  { day: 0, name: 'Domingo', startHour: '08:00', endHour: '18:00', isOpen: false },
];

const StoreSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    slogan: { type: String, default: '' },
    description: { type: String, required: true },
    address: { type: String, required: true },
    week: {
      type: [
        {
          day: Number,
          name: String,
          startHour: String,
          endHour: String,
          isOpen: { type: Boolean, default: true },
        },
      ],
      default: [],
    },
    messengers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    status: { type: String, default: 'active' },
    messengerAssignmentType: { type: String, default: 'automatic' },
  },
  { collection: 'stores', timestamps: true },
);

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, default: 'simple' },
    price: { type: Number, required: true },
    finalPrice: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    requiresElaboration: { type: Boolean, default: false },
    isReservable: { type: Boolean, default: false },
    sku: { type: String, required: true, unique: true, uppercase: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    timesOrdered: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
    colors: { type: [String], default: [] },
    addons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true, discriminatorKey: 'type' },
);

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    level: Number,
    isRoot: Boolean,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const UserSchema = new mongoose.Schema(
  {
    email: String,
    role: String,
    stores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Store' }],
  },
  { collection: 'users', strict: false },
);

const Store = mongoose.models.Store || mongoose.model('Store', StoreSchema);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const STORE_DEFS = [
  {
    name: 'Merendero',
    slogan: 'Snacks y bebidas para el antojo',
    description: 'Punto de venta de galletas, refrescos, golosinas y condimentos',
    address: 'Calle Principal 100, Ciudad',
    products: [
      { name: 'Galleticas de soda saladas', category: 'Snacks y dulces', priceCents: 150, stock: 40, sku: 'MER-GAL-SAL' },
      { name: 'Galleticas de soda dulces', category: 'Snacks y dulces', priceCents: 150, stock: 40, sku: 'MER-GAL-DUL' },
      { name: 'Paquete refresco', category: 'Refrescos', priceCents: 800, stock: 20, sku: 'MER-REF-PAQ' },
      { name: 'Refresco en pomo', category: 'Refrescos', priceCents: 250, stock: 50, sku: 'MER-REF-POM' },
      { name: 'Refresco en lata', category: 'Refrescos', priceCents: 200, stock: 50, sku: 'MER-REF-LAT' },
      { name: 'Malta', category: 'Refrescos', priceCents: 220, stock: 35, sku: 'MER-MALTA' },
      { name: 'Chupa chupa', category: 'Snacks y dulces', priceCents: 50, stock: 100, sku: 'MER-CHUPA' },
      { name: 'Caramelos', category: 'Snacks y dulces', priceCents: 100, stock: 80, sku: 'MER-CARAM' },
      { name: 'Bombones', category: 'Snacks y dulces', priceCents: 300, stock: 40, sku: 'MER-BOMB' },
      { name: 'Mantequilla', category: 'Lácteos y huevos', priceCents: 350, stock: 25, sku: 'MER-MANT' },
      { name: 'Mayonesa', category: 'Comida', priceCents: 400, stock: 20, sku: 'MER-MAYO' },
      { name: 'Pelly', category: 'Snacks y dulces', priceCents: 120, stock: 60, sku: 'MER-PELLY' },
      { name: 'Chicles', category: 'Snacks y dulces', priceCents: 80, stock: 90, sku: 'MER-CHICLE' },
    ],
  },
  {
    name: 'Pastelería Cakes',
    slogan: 'Cakes a pedido, elaborados y reservables',
    description: 'Punto de venta de cakes de diferentes tipos con elaboración y reserva por día',
    address: 'Avenida Dulce 25, Ciudad',
    products: [
      { name: 'Cake de chocolate', category: 'Panadería', priceCents: 2500, stock: 0, sku: 'CAKE-CHOC', requiresElaboration: true, isReservable: true },
      { name: 'Cake de vainilla', category: 'Panadería', priceCents: 2200, stock: 0, sku: 'CAKE-VAIN', requiresElaboration: true, isReservable: true },
      { name: 'Cake tres leches', category: 'Panadería', priceCents: 2800, stock: 0, sku: 'CAKE-3LEC', requiresElaboration: true, isReservable: true },
      { name: 'Cake red velvet', category: 'Panadería', priceCents: 3000, stock: 0, sku: 'CAKE-REDV', requiresElaboration: true, isReservable: true },
      { name: 'Cake de queso', category: 'Panadería', priceCents: 2700, stock: 0, sku: 'CAKE-QUES', requiresElaboration: true, isReservable: true },
      { name: 'Cake de zanahoria', category: 'Panadería', priceCents: 2600, stock: 0, sku: 'CAKE-ZANA', requiresElaboration: true, isReservable: true },
      { name: 'Cake de limón', category: 'Panadería', priceCents: 2400, stock: 0, sku: 'CAKE-LIMON', requiresElaboration: true, isReservable: true },
      { name: 'Cake de fresa', category: 'Panadería', priceCents: 2550, stock: 0, sku: 'CAKE-FRESA', requiresElaboration: true, isReservable: true },
    ],
  },
];

async function resolveCategory(name, cache) {
  if (cache.has(name)) return cache.get(name);
  const cat = await Category.findOne({ name, isActive: { $ne: false } }).exec();
  if (!cat) {
    throw new Error(
      `Categoría "${name}" no encontrada. Ejecuta antes: npm run seed:categories`,
    );
  }
  cache.set(name, cat._id);
  return cat._id;
}

async function seedStoresAndProducts() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI environment variable is not set');

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected');

  const owner = await User.findOne({ email: OWNER_EMAIL }).exec();
  if (!owner) {
    throw new Error(
      `Owner ${OWNER_EMAIL} not found. Ejecuta antes: npm run seed:users`,
    );
  }
  if (owner.role !== 'PROVIDER') {
    throw new Error(`User ${OWNER_EMAIL} must have role PROVIDER (got ${owner.role})`);
  }

  console.log(`Using owner: ${OWNER_EMAIL} (${owner._id})`);

  const categoryCache = new Map();
  const createdStoreIds = [];

  for (const def of STORE_DEFS) {
    let store = await Store.findOne({ name: def.name, owner: owner._id }).exec();
    if (store) {
      console.log(`Store "${def.name}" already exists, updating week/products…`);
      store.week = defaultWeek;
      store.slogan = def.slogan;
      store.description = def.description;
      store.address = def.address;
      store.status = 'active';
      await store.save();
    } else {
      store = await Store.create({
        owner: owner._id,
        name: def.name,
        slogan: def.slogan,
        description: def.description,
        address: def.address,
        week: defaultWeek,
        messengers: [],
        products: [],
        status: 'active',
        messengerAssignmentType: 'automatic',
      });
      console.log(`Created store "${def.name}" (${store._id})`);
    }

    createdStoreIds.push(store._id);
    const productIds = [...(store.products || []).map((id) => id.toString())];

    for (const p of def.products) {
      const categoryId = await resolveCategory(p.category, categoryCache);
      const existing = await Product.findOne({ sku: p.sku }).exec();
      if (existing) {
        existing.name = p.name;
        existing.price = p.priceCents;
        existing.finalPrice = p.priceCents;
        existing.stock = p.stock ?? 0;
        existing.requiresElaboration = Boolean(p.requiresElaboration);
        existing.isReservable = Boolean(p.isReservable);
        existing.store = store._id;
        existing.category = categoryId;
        existing.isAvailable = true;
        existing.isActive = true;
        await existing.save();
        console.log(`  Updated product ${p.sku}`);
        if (!productIds.includes(existing._id.toString())) {
          productIds.push(existing._id.toString());
        }
        continue;
      }

      const created = await Product.create({
        name: p.name,
        description: p.name,
        type: 'simple',
        price: p.priceCents,
        finalPrice: p.priceCents,
        stock: p.stock ?? 0,
        isAvailable: true,
        requiresElaboration: Boolean(p.requiresElaboration),
        isReservable: Boolean(p.isReservable),
        sku: p.sku,
        store: store._id,
        category: categoryId,
        timesOrdered: 0,
        averageRating: 0,
        totalReviews: 0,
        isActive: true,
        images: [],
        colors: [],
        addons: [],
      });
      productIds.push(created._id.toString());
      console.log(`  Created product ${p.sku}`);
    }

    store.products = productIds.map((id) => new mongoose.Types.ObjectId(id));
    await store.save();
  }

  const existingStores = (owner.stores || []).map((id) => id.toString());
  const merged = new Set([...existingStores, ...createdStoreIds.map((id) => id.toString())]);
  owner.stores = [...merged].map((id) => new mongoose.Types.ObjectId(id));
  await owner.save();
  console.log(`Linked ${createdStoreIds.length} stores to provider`);

  console.log('Seed completed successfully');
}

async function cleanSeed() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI environment variable is not set');

  await mongoose.connect(mongoUri);

  const names = STORE_DEFS.map((s) => s.name);
  const skus = STORE_DEFS.flatMap((s) => s.products.map((p) => p.sku));

  const stores = await Store.find({ name: { $in: names } }).exec();
  const storeIds = stores.map((s) => s._id);

  const prodResult = await Product.deleteMany({
    $or: [{ sku: { $in: skus } }, { store: { $in: storeIds } }],
  });
  console.log(`Deleted ${prodResult.deletedCount} products`);

  const storeResult = await Store.deleteMany({ _id: { $in: storeIds } });
  console.log(`Deleted ${storeResult.deletedCount} stores`);

  const owner = await User.findOne({ email: OWNER_EMAIL }).exec();
  if (owner?.stores?.length) {
    const remove = new Set(storeIds.map((id) => id.toString()));
    owner.stores = owner.stores.filter((id) => !remove.has(id.toString()));
    await owner.save();
    console.log('Unlinked stores from provider');
  }
}

async function main() {
  try {
    if (process.argv[2] === 'clean') {
      await cleanSeed();
    } else {
      await seedStoresAndProducts();
    }
  } catch (error) {
    console.error('Store/product seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
