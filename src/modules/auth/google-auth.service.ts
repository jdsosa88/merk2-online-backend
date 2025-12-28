// src/auth/services/google-auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { GoogleUser } from './types/google-user.interface';

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
      const clientId = this.configService.get('GOOGLE_CLIENT_ID');
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      if (!payload) throw new UnauthorizedException('Invalid google token');
      return {
        email: payload.email,
        firstName: payload.given_name || payload.name?.split(' ')[0] || '',
        lastName:
          payload.family_name ||
          payload.name?.split(' ').slice(1).join(' ') ||
          '',
        picture: payload.picture,
        googleId: payload.sub,
      };
    } catch (error: any) {
      if (
        error.message?.includes('audience') ||
        error.code === 'auth/id-token-aud-claim-mismatch'
      ) {
        throw new UnauthorizedException(
          `Invalid Google token: Client ID mismatch. Make sure you're using the correct Google Client ID in your Flutter app.`,
        );
      }

      throw new UnauthorizedException('Invalid Google token');
    }
  }
}
