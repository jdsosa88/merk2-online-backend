export const firebaseConfig = () => ({
  firebase: {
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || undefined,
    projectId: process.env.FIREBASE_PROJECT_ID || undefined,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || undefined,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined,
  },
});
