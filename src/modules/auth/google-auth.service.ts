// src/auth/services/google-auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { GoogleUser } from './interfaces/google-user.interface';

@Injectable()
export class GoogleAuthService {
  private googleClient: OAuth2Client;

  constructor(private configService: ConfigService) {
    this.googleClient = new OAuth2Client(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
    );
  }

  async validateGoogleToken(token: string): Promise<GoogleUser> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: this.configService.get('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();      
      if (!payload) throw new UnauthorizedException('Invalid google token');
      console.log({payload});
      
      return {
        email: payload.email,
        firstName: payload.given_name || payload.name?.split(' ')[0] || '',
        lastName: payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '',
        picture: payload.picture,
        googleId: payload.sub,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Google token');
    }
  }
}