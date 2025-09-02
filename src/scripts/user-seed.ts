import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';
import { Role, User } from '../modules/users/user.schema';
import { CreateUserDto } from '../modules/users/dto/create-user.dto';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const usersService = app.get(UsersService);
    const userModel = app.get<Model<User>>(getModelToken(User.name));

    console.log('Starting user seeding...');
    
    const testUsers = [
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        password: 'password123',
        phone: '+1234567890',
        role: Role.ADMIN
      },
      {
        firstName: 'Customer',
        lastName: 'User',
        email: 'customer@test.com',
        password: 'password123',
        phone: '+1234567891',
        role: Role.CUSTOMER
      },
      {
        firstName: 'Provider',
        lastName: 'User',
        email: 'provider@test.com',
        password: 'password123',
        phone: '+1234567892',
        role: Role.PROVIDER
      },
      {
        firstName: 'Messenger',
        lastName: 'User',
        email: 'messenger@test.com',
        password: 'password123',
        phone: '+1234567893',
        role: Role.MESSENGER
      }
    ];

    console.log('Checking for existing test users...');

    // Verificar si los usuarios ya existen
    const existingUsers = await Promise.all(
      testUsers.map(user => userModel.findOne({ email: user.email }))
    );

    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      
      if (existingUsers[i]) {
        console.log(`User ${user.email} already exists, skipping...`);
        continue;
      }

      try {
        console.log(`Creating ${user.role} user: ${user.email}`);
        
        // Crear el DTO
        const createUserDto: CreateUserDto = {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: user.password,
          phone: user.phone,
          role: user.role,          
        };
        
        const result = await usersService.create({...createUserDto}, user.role);
        console.log(`${user.role} user created successfully: ${result.data?.email || user.email}`);
        
      } catch (error) {
        console.error(`Error creating ${user.role} user:`, error.message);
      }
    }

    console.log('User seeding completed!');
    console.log('\n Test Users Created:');
    console.log('Admin:     admin@test.com     / password123');
    console.log('Customer:  customer@test.com  / password123');
    console.log('Provider:  provider@test.com  / password123');
    console.log('Messenger: messenger@test.com / password123');
    
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await app.close();
  }
}

// Execute the seed if the file is directly executed
if (require.main === module) {
  seed();
}

export { seed };