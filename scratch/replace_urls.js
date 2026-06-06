const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'frontend', 'src');

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach((file) => {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res) => {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

walk(srcDir, (err, files) => {
  if (err) throw err;
  
  files.forEach((file) => {
    const ext = path.extname(file);
    if (ext !== '.js' && ext !== '.jsx') return;
    
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if there are hardcoded URLs
    if (content.includes('http://localhost:3000')) {
      console.log(`Processing: ${path.relative(srcDir, file)}`);
      
      // Perform replacements
      let newContent = content;
      newContent = newContent.replace(/'http:\/\/localhost:3000([^']*)'/g, '`${API_URL}$1`');
      newContent = newContent.replace(/"http:\/\/localhost:3000([^"]*)"/g, '`${API_URL}$1`');
      newContent = newContent.replace(/`http:\/\/localhost:3000([^`]*)`/g, '`${API_URL}$1`');
      
      // Add import if not present
      if (!newContent.includes('utils/api')) {
        const lines = newContent.split('\n');
        let insertIndex = 0;
        
        // Find insert index (skip 'use client')
        if (lines[0] && (lines[0].trim().startsWith("'use client'") || lines[0].trim().startsWith('"use client"'))) {
          insertIndex = 1;
        }
        
        lines.splice(insertIndex, 0, "import { API_URL } from '@/utils/api';");
        newContent = lines.join('\n');
      }
      
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`  Updated successfully!`);
    }
  });
});
