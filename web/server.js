const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const app = express();
const PORT = 3000;

// Set upload directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Upload route
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    console.log('File path:', filePath);
    console.log('File extension:', ext);

    let extractedText = '';

    if (ext === '.txt') {
      extractedText = fs.readFileSync(filePath, 'utf-8');
    } else if (ext === '.pdf') {
      const pdfData = await pdfParse(fs.readFileSync(filePath));
      extractedText = pdfData.text;
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value;
    } else if ([".png", ".jpg", ".jpeg"].includes(ext)) {
      const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
      extractedText = text;
    } else {
      return res.status(400).json({ error: 'Unsupported file type.' });
    }

    console.log('Extracted text preview:', extractedText.slice(0, 100));

    res.json({ message: `File uploaded: ${req.file.originalname}`, text: extractedText });

  } catch (error) {
    console.error('Error while processing file:', error.message);
    console.error(error.stack);
    res.status(500).json({ error: 'Failed to process the file.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
