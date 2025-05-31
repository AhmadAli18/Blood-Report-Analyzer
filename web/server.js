const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); 


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.txt', '.docx', '.png', '.jpg', '.jpeg'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 
  }
});

async function analyzeBloodReport(text) {
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

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

async function handleFollowUpQuestion(originalText, analysis, question) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  const prompt = `
  You are a medical assistant helping a patient understand their blood test results.
  Below is the original blood test data and initial analysis. 
  Please answer the patient's follow-up question in detail but with simple language.

  Original Blood Test Data:
  ${originalText}

  Initial Analysis:
  ${analysis}

  Patient's Question: ${question}

  Please provide:
  1. A clear, concise answer to the specific question
  2. Additional context if relevant
  3. Any warnings if values are concerning
  4. Suggestions for next steps if appropriate
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini follow-up error:', error);
    throw new Error(`Failed to answer question: ${error.message}`);
  }
}

// Upload
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    console.log('Processing file:', req.file.originalname);

    let extractedText = '';
    if (ext === '.txt') {
      extractedText = fs.readFileSync(filePath, 'utf-8');
    } else if (ext === '.pdf') {
      const pdfData = await pdfParse(fs.readFileSync(filePath));
      extractedText = pdfData.text;
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value;
    } else if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
      extractedText = text;
    }

    if (!extractedText.trim()) {
      throw new Error('No text could be extracted from the file.');
    }

    // Analyze the extracted text
    const analysis = await analyzeBloodReport(extractedText);

    // Clean up the uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });

    res.json({ 
      message: `Analysis complete for: ${req.file.originalname}`,
      text: extractedText,  
      analysis: analysis    
    });

  } catch (error) {
    console.error('Upload error:', error.message);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.status(500).json({ 
      error: error.message || 'Analysis failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.post('/followup', async (req, res) => {
  try {
    const { originalText, analysis, question } = req.body;
    
    if (!originalText || !question) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const answer = await handleFollowUpQuestion(originalText, analysis, question);
    
    res.json({ 
      answer: answer
    });

  } catch (error) {
    console.error('Follow-up error:', error.message);
    res.status(500).json({ 
      error: error.message || 'Failed to process follow-up question',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});