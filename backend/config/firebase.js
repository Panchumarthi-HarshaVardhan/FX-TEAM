const path = require('path');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

dotenv.config();

const databaseURL = process.env.FIREBASE_DATABASE_URL;
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!databaseURL) {
  throw new Error('FIREBASE_DATABASE_URL is required in environment variables');
}

if (!serviceAccountPath) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH is required in environment variables');
}

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} else {
  const resolvedPath = path.isAbsolute(serviceAccountPath)
    ? serviceAccountPath
    : path.resolve(__dirname, '..', serviceAccountPath);

  if (!require('fs').existsSync(resolvedPath)) {
    throw new Error(
      `Firebase service account not found at ${resolvedPath}. ` +
        'Download it from Firebase Console and save as backend/firebase-service-account.json, ' +
        'or set FIREBASE_SERVICE_ACCOUNT_JSON in .env.'
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
