import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { User } from '../modules/users/user.schema';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

async function cleanTestUsers() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const userModel = app.get<Model<User>>(getModelToken(User.name));

    console.log('Starting test users cleanup...');

    // Emails de los usuarios de prueba
    const testUserEmails = [
      'admin@test.com',
      'customer@test.com',
      'provider@test.com',
      'messenger@test.com'
    ];

    console.log('Looking for test users to delete...');

    for (const email of testUserEmails) {
      const user = await userModel.findOne({ email });
      
      if (user) {
        await userModel.deleteOne({ email });
        console.log(`Deleted test user: ${email}`);
      } else {
        console.log(`Test user not found: ${email}`);
      }
    }

    console.log('Test users cleanup completed!');
    
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await app.close();
  }
}

// Ejecutar la limpieza si el archivo se ejecuta directamente
if (require.main === module) {
  cleanTestUsers();
}

export { cleanTestUsers };