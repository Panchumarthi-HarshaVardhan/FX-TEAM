const path = require('path');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

dotenv.config();

const databaseURL = process.env.FIREBASE_DATABASE_URL;
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!databaseURL) {
  throw new Error('FIREBASE_DATABASE_URL is required in environment variables');
}

const hasIndividualEnvVars = process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL;
if (!serviceAccountPath && !hasIndividualEnvVars && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  throw new Error('Either FIREBASE_SERVICE_ACCOUNT_PATH, FIREBASE_SERVICE_ACCOUNT_JSON, or individual FIREBASE environment variables must be provided');
}

let serviceAccount;

if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL) {
  serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`
  };
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} else {
  if (!serviceAccountPath) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH or individual FIREBASE environment variables are required');
  }
  const resolvedPath = path.isAbsolute(serviceAccountPath)
    ? serviceAccountPath
    : path.resolve(__dirname, '..', serviceAccountPath);

  if (!require('fs').existsSync(resolvedPath)) {
    throw new Error(
      `Firebase service account not found at ${resolvedPath}. ` +
        'Download it from Firebase Console and save as backend/firebase-service-account.json, ' +
        'or set FIREBASE_SERVICE_ACCOUNT_JSON or individual FIREBASE env variables.'
    );
  }
  serviceAccount = require(resolvedPath);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL
  });
}

const db = admin.database();

module.exports = { admin, db };
