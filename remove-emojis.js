const fs = require('fs');
const path = require('path');

// Comprehensive emoji regex (covers most common emojis)
const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{1F004}\u{1F0CF}\u{1F18E}\u{1F191}-\u{1F251}\u{FE0F}]/gu;

function removeEmojis(text) {
  return text.replace(emojiRegex, '');
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleaned = removeEmojis(content);
    
    if (content !== cleaned) {
      fs.writeFileSync(filePath, cleaned, 'utf8');
      console.log(`Cleaned: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css') || file.endsWith('.json')) {
      processFile(fullPath);
    }
  });
}

const targetDir = path.join(__dirname, 'frontend', 'src');
console.log(`Processing files in ${targetDir}...`);
processDirectory(targetDir);
console.log('Done!');
