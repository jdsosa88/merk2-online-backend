import { appConfig } from './types/app.config';
import { databaseConfig } from './types/database.config';
import { authConfig } from './types/auth.config';
import { mailerConfig } from './types/mailer.config';
import { productsConfig } from './types/products.config';
import { verificationCodeConfig } from './types/verification-code.config';
import { businessConfig } from './types/business.config';
import { expoConfig } from './types/expo.config';
import { firebaseConfig } from './types/firebase.config';

export default () => ({
  ...appConfig(),
  ...databaseConfig(),
  ...authConfig(),
  ...mailerConfig(),
  ...businessConfig(),
  ...productsConfig(),
  ...verificationCodeConfig(),
  ...expoConfig(),
  ...firebaseConfig(),
});
