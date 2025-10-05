const fs = require('fs');
const path = require('path');

exports.deleteFile = (filePath) => {
  const fullPath = path.join(__dirname, '..', filePath); // Resolve the full path
  fs.unlink(fullPath, (err) => {
    if (err) {
      console.error('❌ Failed to delete file:', err);
    } else {
      console.log('✅ File deleted:', fullPath);
    }
  });
};
