const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '../config/envs/.env.development'),
});

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    subcategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    level: { type: Number, default: 0 },
    isRoot: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    description: { type: String, trim: true },
    icon: { type: String, trim: true },
    color: { type: String, trim: true },
  },
  { timestamps: true },
);

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

/**
 * Roots + optional children.
 * Required: Comida, Aseo, Ropa (covers all clothing types).
 */
const categoryTree = [
  {
    name: 'Comida',
    description: 'Alimentos frescos, preparados y despensa',
    icon: 'restaurant',
    color: '#FF5F00',
    children: [
      { name: 'Frutas y vegetales', description: 'Productos frescos' },
      { name: 'Carnes y embutidos', description: 'Carnes, aves y embutidos' },
      { name: 'Lácteos y huevos', description: 'Leche, queso, yogurt y huevos' },
      { name: 'Panadería', description: 'Pan, bollería y repostería' },
      { name: 'Comida preparada', description: 'Platos listos para consumir' },
      { name: 'Snacks y dulces', description: 'Botanas, chocolates y golosinas' },
    ],
  },
  {
    name: 'Aseo',
    description: 'Higiene personal y limpieza del hogar',
    icon: 'cleaning_services',
    color: '#2E7D32',
    children: [
      { name: 'Higiene personal', description: 'Jabón, shampoo, cuidado personal' },
      { name: 'Limpieza del hogar', description: 'Detergentes, desinfectantes y utensilios' },
      { name: 'Cuidado bucal', description: 'Pasta dental, cepillos e hilo' },
    ],
  },
  {
    name: 'Ropa',
    description: 'Todo tipo de prendas y accesorios de vestir',
    icon: 'checkroom',
    color: '#515F78',
    children: [
      { name: 'Ropa de hombre', description: 'Prendas para hombre' },
      { name: 'Ropa de mujer', description: 'Prendas para mujer' },
      { name: 'Ropa infantil', description: 'Prendas para niños y bebés' },
      { name: 'Calzado', description: 'Zapatos, tenis y sandalias' },
      { name: 'Accesorios de vestir', description: 'Cinturones, gorras, bolsos y complementos' },
      { name: 'Ropa deportiva', description: 'Prendas y calzado deportivo' },
    ],
  },
  {
    name: 'Bebidas',
    description: 'Refrescos, jugos, agua y bebidas calientes',
    icon: 'local_cafe',
    color: '#A63B00',
    children: [
      { name: 'Agua y jugos', description: 'Agua embotellada y jugos' },
      { name: 'Refrescos', description: 'Gaseosas y bebidas energéticas' },
      { name: 'Café y té', description: 'Bebidas calientes e insumos' },
    ],
  },
  {
    name: 'Hogar',
    description: 'Artículos para la casa y cocina',
    icon: 'home',
    color: '#8F7065',
    children: [
      { name: 'Cocina', description: 'Utensilios y vajilla' },
      { name: 'Decoración', description: 'Adornos y textiles del hogar' },
    ],
  },
  {
    name: 'Electrónica',
    description: 'Dispositivos y accesorios tecnológicos',
    icon: 'devices',
    color: '#39475F',
    children: [
      { name: 'Celulares y accesorios', description: 'Teléfonos, fundas y cargadores' },
      { name: 'Audio y video', description: 'Audífonos, parlantes y pantallas' },
    ],
  },
  {
    name: 'Salud',
    description: 'Cuidado de la salud y bienestar',
    icon: 'health_and_safety',
    color: '#BA1A1A',
    children: [
      { name: 'Farmacia', description: 'Medicamentos de venta libre' },
      { name: 'Bienestar', description: 'Vitaminas y cuidado preventivo' },
    ],
  },
  {
    name: 'Mascotas',
    description: 'Alimento y accesorios para mascotas',
    icon: 'pets',
    color: '#F59E0B',
  },
];

async function upsertRoot(data) {
  let category = await Category.findOne({ name: data.name });
  if (category) {
    category.description = data.description;
    category.icon = data.icon;
    category.color = data.color;
    category.isRoot = true;
    category.level = 0;
    category.isActive = true;
    category.parents = [];
    await category.save();
    console.log(`Updated root: ${data.name}`);
    return category;
  }

  category = await Category.create({
    name: data.name,
    description: data.description,
    icon: data.icon,
    color: data.color,
    isRoot: true,
    level: 0,
    isActive: true,
    parents: [],
    subcategories: [],
  });
  console.log(`Created root: ${data.name}`);
  return category;
}

async function upsertChild(parent, data) {
  let category = await Category.findOne({ name: data.name });
  if (category) {
    category.description = data.description;
    category.isRoot = false;
    category.level = parent.level + 1;
    category.isActive = true;
    category.parents = [parent._id];
    await category.save();
  } else {
    category = await Category.create({
      name: data.name,
      description: data.description,
      isRoot: false,
      level: parent.level + 1,
      isActive: true,
      parents: [parent._id],
      subcategories: [],
    });
    console.log(`  + child: ${data.name}`);
  }

  if (!parent.subcategories.some((id) => id.toString() === category._id.toString())) {
    parent.subcategories.push(category._id);
  }
  return category;
}

async function seedCategories() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI environment variable is not set');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected. Seeding categories...');

  for (const rootData of categoryTree) {
    const root = await upsertRoot(rootData);
    root.subcategories = root.subcategories || [];

    for (const child of rootData.children || []) {
      await upsertChild(root, child);
    }

    await root.save();
  }

  const total = await Category.countDocuments();
  console.log(`\nCategory seeding completed. Total categories: ${total}`);
}

async function cleanCategories() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI environment variable is not set');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);

  const names = [];
  for (const root of categoryTree) {
    names.push(root.name);
    for (const child of root.children || []) {
      names.push(child.name);
    }
  }

  const result = await Category.deleteMany({ name: { $in: names } });
  console.log(`Deleted ${result.deletedCount} seeded categories`);
}

async function main() {
  try {
    if (process.argv[2] === 'clean') {
      await cleanCategories();
    } else {
      await seedCategories();
    }
  } catch (error) {
    console.error('Category seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

main();
