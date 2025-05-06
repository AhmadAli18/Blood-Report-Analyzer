  const express = require('express');
  const multer = require('multer');
  const path = require('path');
  const app = express();
  const PORT = 3000;
  console.log('Uploads folder path:', path.join(__dirname, 'uploads'));
  // 1. Ensure uploads directory exists
  const uploadDir = path.join(process.cwd(), 'uploads');
  const fs = require('fs');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Serve static files
  app.use(express.static(path.join(__dirname, 'public')));
 // console.log('Uploads folder path:', path.join(__dirname, 'uploads'));
  console.log('Current working dir:', process.cwd());
  console.log('Upload folder being used:', uploadDir);

  // 2. Multer setup with absolute path
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir); // Use the absolute path
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  });
  const upload = multer({ storage });

  // 3. Upload endpoint
  app.post('/upload', upload.single('file'), (req, res) => {
    console.log('Upload endpoint hit!');
  
    if (!req.file) {
      console.log('No file received.');
      return res.status(400).send('No file uploaded.');
    }
  
    console.log('File saved to:', req.file.path);
    res.send(`File uploaded: ${req.file.originalname}`);
  });
  app.listen(PORT, () => {
    console.log('Server running at http://localhost:${PORT}');
  });    