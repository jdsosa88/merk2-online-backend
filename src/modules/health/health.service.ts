import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private readonly connection: Connection
  ) {}

  async checkDatabase(): Promise<boolean> {
    try {      
      if (!this.connection.db) {
        throw new Error('Database connection is undefined');
      }
      await this.connection.db.admin().ping();
      return true;
    } catch (error) {
      return false;
    }
  }
  
  getUptime(): number {
    return process.uptime();
  }
}