const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const app = express();
const PORT = 3000;
const { GoogleGenerativeAI } = require("@google/generative-ai");
// Set upload directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });
async function analyzeBloodReport(text) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  const prompt = `
  Analyze this blood test report and:
  1. List all metrics with abnormal values (mark as HIGH/LOW).
  2. Explain each abnormal metric in simple terms.
  3. Suggest possible health implications.
  4. Ignore normal values.

  Report format:
  - **Metric Name**: Value (Normal Range) → Risk Level
  - Explanation: [Simple explanation]
  - Suggestion: [Actionable advice]

  Blood Test Data:
  ${text}
  `;
  try{
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
  catch(error) {
    throw new Error(`Gemini API error : ${error.message}`);
  }
}
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

    let analysis = "Could not analyze this report. Please check if it's a valid blood test.";
    try {
      analysis = await analyzeBloodReport(extractedText);
    } catch (geminiError) {
      console.error('Gemini analysis failed:', geminiError.message);
    }
    res.json({ 
      message: `File uploaded: ${req.file.originalname}`,
      text: extractedText,  // Keep original parsed text
      analysis: analysis    // Add Gemini's analysis
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Analysis failed' });

  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});