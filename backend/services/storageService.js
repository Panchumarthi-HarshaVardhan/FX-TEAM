const fs = require('fs');
const path = require('path');

class LocalStorageProvider {
  async upload(fileBuffer, originalName, mimeType, host, protocol) {
    const publicDir = path.join(__dirname, '../public');
    const uploadDir = path.join(publicDir, 'uploads');
    const docDir = path.join(uploadDir, 'documents');

    // Create directories if they do not exist
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    if (!fs.existsSync(docDir)) fs.mkdirSync(docDir, { recursive: true });

    const timestamp = Date.now();
    const cleanName = originalName.replace(/[^a-zA-Z0-9.]/g, '_');
    const filename = `doc_${timestamp}_${cleanName}`;
    const filePath = path.join(docDir, filename);

    fs.writeFileSync(filePath, fileBuffer);

    const activeHost = host || 'localhost:3000';
    const activeProtocol = protocol || 'http';
    const url = `${activeProtocol}://${activeHost}/public/uploads/documents/${filename}`;

    return {
      fileUrl: url,
      fileKey: filename,
      mimeType,
      sizeBytes: fileBuffer.length
    };
  }

  async download(fileKey) {
    const filePath = path.join(__dirname, '../public/uploads/documents', fileKey);
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    return fs.readFileSync(filePath);
  }
}

// Future Firestore/Firebase Storage implementation placeholder
class FirebaseStorageProvider {
  async upload(fileBuffer, originalName, mimeType, host, protocol) {
    // Left unimplemented for Phase 16, to be implemented by Firebase developer
    throw new Error('FirebaseStorageProvider not implemented yet');
  }

  async download(fileKey) {
    throw new Error('FirebaseStorageProvider not implemented yet');
  }
}

// Instantiate active provider based on environment config
const provider = new LocalStorageProvider();

module.exports = {
  upload: (fileBuffer, originalName, mimeType, host, protocol) => 
    provider.upload(fileBuffer, originalName, mimeType, host, protocol),
  download: (fileKey) => 
    provider.download(fileKey)
};
