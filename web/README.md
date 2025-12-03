# Blood Report Analyzer
A web-based AI-powered tool that lets users upload their blood test reports and receive clear, human-friendly explanations of abnormal values, along with follow-up conversational Q&A.

# Features 
## Upload and Processing
* Drag-and-drop or file selection upload
* Supports TXT, PDF, DOC, DOCX (images optional)
* File handling using Multer
* Secure backend storage in /uploads directory
* Extracts data from medical reports for analysis

## AI Analysis
* Uses Gemini 2.0 Flash model
* Highlights all out-of-range metrics
* Explains meaning of each test value in layman terms
* Distinguishes between minor and serious deviations
* Gives health suggestions and risk interpretation           

## Follow-Up Conversation
* Users can ask additional questions
* Conversation memory preserved until page refresh
* Contextual responses based on original uploaded report
* Interactive doctor-style explanation

# Quick Start

## Running the Server
`npm install`
`node server.js`

Server runs on:
`http://localhost:3000`

## Using the Application
1. Open the webpage 
2. Drag or select a blood report file
3. Click *Analyze Report*
4. View the AI-generated interpretation
5. Ask follow-up questions if needed

# Upload Format Support
Supported formats:
* `.txt`
* `.pdf`
* `.doc`, `.docx`
* `.png`, `.jpg`

# Technical Details
* *Backend:* Node.js + Express
* *File Upload:* Multer
* *AI Model:* Gemini 2.0 Flash
* *PDF Parsing:* pdf-parse
* *DOCX Parsing:* mammoth
* *Frontend :* Vanilla JS + HTML + CSS
* *In-browser conversation memory* 

# Project Structure
``` 
Blood-test-analyzer/
├── web/
│   ├── public/
│   │   ├── index.html           # UI
│   │   ├── style.css            # Styling
│   │   └── script.js            # Frontend logic
│   └── uploads/                 # Stored files
├── server.js                    # Backend + AI processing
└── package.json 
```
