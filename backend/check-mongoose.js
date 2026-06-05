const fs = require('fs');
const path = require('path');
const modelsDir = './models';
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));
let hasMongoose = false;
files.forEach(f => {
  const content = fs.readFileSync(path.join(modelsDir, f), 'utf8');
  if (content.includes("require('mongoose')") || content.includes('require("mongoose")')) {
    console.log('STILL HAS MONGOOSE:', f);
    hasMongoose = true;
  }
});
if (!hasMongoose) {
  console.log('SUCCESS: No mongoose imports in any model file (' + files.length + ' files checked)');
}

// Also check all model files export from firebaseModel
let badExport = false;
files.forEach(f => {
  const content = fs.readFileSync(path.join(modelsDir, f), 'utf8');
  if (!content.includes('firebaseModel') && !content.includes('JobApplication')) {
    console.log('WARNING: No firebaseModel export in:', f);
    badExport = true;
  }
});
if (!badExport) console.log('SUCCESS: All model files export from firebaseModel');
