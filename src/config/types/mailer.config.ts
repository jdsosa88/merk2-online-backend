export const mailerConfig = () => ({
  mailer: {
    transport: {
      host: process.env.MAILER_HOST,
      port: parseInt(process.env.MAILER_PORT || '587', 10),
      secure: process.env.MAILER_SECURE === 'true',
      auth: {
        user: process.env.MAILER_AUTH_USER,
        pass: process.env.MAILER_AUTH_PASS,
      },
    },
    defaults: {
      from: `"${process.env.MAILER_EMAIL_FROM_NAME}" <${process.env.MAILER_EMAIL_FROM_DOMAIN}>`,
    },
  },
});