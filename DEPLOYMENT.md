# FounderX AWS Deployment Guide

This guide explains how to deploy the FounderX application to AWS, with the frontend on **AWS Amplify**, the backend on **AWS Elastic Beanstalk**, and the database on **Firebase Realtime Database**.

---

## Architecture Overview
- **Frontend**: Next.js (App Router), deployed on **AWS Amplify**.
- **Backend**: Express.js REST API, deployed on **AWS Elastic Beanstalk**.
- **Database**: **Firebase Realtime Database** (NoSQL Realtime database).

---

## 1. Backend Deployment (AWS Elastic Beanstalk)

### Steps to Deploy
1. **Prepare Source Bundle**:
   Zip the contents of the `backend` folder (ensure `node_modules` and `.env` are excluded).
   ```bash
   cd backend
   # Zip backend files (Windows PowerShell)
   Compress-Archive -Path *, .env.example -DestinationPath backend-deploy.zip -Force
   ```
2. **Create Elastic Beanstalk Application**:
   - Go to the **AWS Elastic Beanstalk Console**.
   - Create a new Application (e.g., `founderx-backend`).
   - Choose the **Node.js** Platform (recommended: Node.js 18 or 20 on AL2023).
   - Upload the `backend-deploy.zip` source bundle.
3. **Configure Environment Variables**:
   Under **Configuration > Software > Environment properties**, add the following environment variables (from your Firebase console and backend configuration):

   | Variable Name | Value Description |
   |---|---|
   | `PORT` | `8080` (Default Beanstalk port) |
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | A secure random string for signing JWT tokens |
   | `FRONTEND_URL` | The URL of your deployed AWS Amplify Frontend (e.g. `https://main.xxxx.amplifyapp.com`) |
   | `FIREBASE_DATABASE_URL` | `https://founderx-fac03-default-rtdb.asia-southeast1.firebasedatabase.app` |
   | `FIREBASE_PROJECT_ID` | `founderx-fac03` |
   | `FIREBASE_CLIENT_EMAIL` | The client email from your Firebase service account key JSON |
   | `FIREBASE_CLIENT_ID` | The client ID from your Firebase service account key JSON |
   | `FIREBASE_PRIVATE_KEY_ID` | The private key ID from your Firebase service account key JSON |
   | `FIREBASE_PRIVATE_KEY` | The private key string (must include literal `\n` characters) |

   > [!IMPORTANT]
   > Make sure the private key in Elastic Beanstalk includes the newline escape characters `\n` (e.g. `"-----BEGIN PRIVATE KEY-----\nMIIEvgIB...-----END PRIVATE KEY-----\n"`). The backend code automatically replaces `\n` string sequences with actual line breaks.

4. **Deploy**:
   Click **Apply** / **Create Environment**. AWS Elastic Beanstalk will automatically run `npm install` and start the server using `npm start` (which executes `node server.js`).

---

## 2. Frontend Deployment (AWS Amplify)

### Steps to Deploy
1. **Connect Repository**:
   - Go to the **AWS Amplify Console**.
   - Select **Host Web App** and choose your GitHub repository/branch (e.g., `main` or `nikhil`).
2. **Configure App Build Settings**:
   Under build settings, verify that Amplify configures Next.js correctly. The build command should be `npm run build` and the start command is handled by Amplify's Next.js hosting.
3. **Set Environment Variables**:
   Under **App Settings > Environment variables**, add:

   | Variable Name | Value |
   |---|---|
   | `VITE_API_URL` | The URL of your deployed Elastic Beanstalk backend (e.g., `https://founderx-backend.elasticbeanstalk.com`) |

   > [!NOTE]
   > The Next.js configuration [next.config.mjs](file:///c:/Users/DELL/FX-TEAM3/frontend/next.config.mjs) is configured to look for `VITE_API_URL` and bundle it using the Webpack `DefinePlugin` so that both server-side pages and client-side requests access the correct production API endpoint.

4. **Deploy**:
   Trigger the build. Amplify will automatically install dependencies, compile the optimized Next.js bundle, and host it.

---

## 3. Database Configurations (Firebase Realtime Database)
The application utilizes Firebase Realtime Database. All security rules must be configured in your Firebase Console to align with read/write requirements. The Firebase Admin SDK on the backend accesses the database with full administrator privileges using the provided environment variables.

---

## Local Verification Commands

If you need to test the project locally using the production environment variables configuration:

### Run Backend Locally:
```bash
cd backend
npm install
# Ensure environment variables are set or loaded from local .env
npm start
```

### Run Frontend Locally:
```bash
cd frontend
npm install
npm run build
npm start
```
