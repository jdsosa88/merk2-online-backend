export const verificationCodeConfig = () => ({
  verificationCode: {
    expiresHours: parseInt(process.env.VERIFICATION_EXPIRES_HOURS || '3', 10),
  }
});