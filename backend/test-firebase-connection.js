const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const databaseURL = 'https://founderx-fac03-default-rtdb.asia-southeast1.firebasedatabase.app';

console.log('Testing connection to:', databaseURL);
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL
});

const db = app.database();
db.ref('/').once('value')
  .then(snapshot => {
    console.log('🎉 SUCCESS!');
    console.log('Database snapshot exists:', snapshot.exists());
    console.log('Keys in root:', Object.keys(snapshot.val() || {}));
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ FAILED:', err);
    process.exit(1);
  });
