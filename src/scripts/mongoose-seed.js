const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '../config/envs/.env.development'),
});

// Definir el schema directamente
const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: false },
  isActive: { type: Boolean, default: false },
  role: { 
    type: String, 
    enum: ['ADMIN', 'CUSTOMER', 'PROVIDER', 'MESSENGER'],
    default: 'CUSTOMER' 
  }
}, { timestamps: true });

// Transformar el JSON para omitir password
UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

const User = mongoose.model('User', UserSchema);

const testUsers = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
    password: 'pwdmerk225mzllo',
    phone: '+1234567890',
    role: 'ADMIN',
    isActive: true
  },
  {
    firstName: 'Customer',
    lastName: 'User',
    email: 'customer@test.com',
    password: 'pwdmerk225mzllo',
    phone: '+1234567891',
    role: 'CUSTOMER',
    isActive: true,
    geolocation: {
      address: 'Calle Principal 123, Santo Domingo',
      latitude: 18.4861,
      longitude: -69.9312,
    },
  },
  {
    firstName: 'Provider',
    lastName: 'User',
    email: 'provider@test.com',
    password: 'pwdmerk225mzllo',
    phone: '+1234567892',
    role: 'PROVIDER',
    isActive: true
  },
  {
    firstName: 'Messenger',
    lastName: 'User',
    email: 'messenger@test.com',
    password: 'pwdmerk225mzllo',
    phone: '+1234567893',
    role: 'MESSENGER',
    isActive: true
  }
];

async function seedUsers() {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully');

    console.log('Starting user seeding...');

    for (const userData of testUsers) {
      try {
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          console.log(`User ${userData.email} already exists, skipping...`);
          continue;
        }

        console.log(`Creating ${userData.role} user: ${userData.email}`);

        // Hash the password
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Create user
        const newUser = new User({
          ...userData,
          password: hashedPassword
        });

        await newUser.save();
        console.log(`${userData.role} user created successfully: ${userData.email}`);

      } catch (error) {
        console.error(`Error creating ${userData.role} user:`, error.message);
      }
    }

    console.log('User seeding completed!');
    console.log('\nTest Users Created:');
    console.log('Admin:     admin@test.com');
    console.log('Customer:  customer@test.com');
    console.log('Provider:  provider@test.com');
    console.log('Messenger: messenger@test.com');
    console.log('\nSeller onboarding (new): POST /seller-applications → admin approve → POST /stores');

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

async function cleanUsers() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully');

    console.log('Starting test users cleanup...');

    const testEmails = testUsers.map(user => user.email);

    for (const email of testEmails) {
      const result = await User.deleteOne({ email });
      if (result.deletedCount > 0) {
        console.log(`Deleted test user: ${email}`);
      } else {
        console.log(`Test user not found: ${email}`);
      }
    }

    console.log('Test users cleanup completed!');

  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Check command line arguments
const command = process.argv[2];

if (command === 'clean') {
  cleanUsers();
} else {
  seedUsers();
}