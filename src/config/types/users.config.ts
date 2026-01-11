export const usersConfig = () => ({
  users: {
    phoneVerificationRequired: 
      process.env.USER_PHONE_VERIFICATION_REQUIRED === 'true',
  }
});