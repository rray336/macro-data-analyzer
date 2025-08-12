Excel Macro Data Analyzer — Development Steps
Overview
This project is a browser-based app where users upload Excel files containing multiple sheets with charts and images. The app scans each sheet, extracts images with intelligent tagging system, and provides AI-powered analysis. Users can browse images interactively via dropdown menus with AI-generated insights.

Prerequisites
Windows machine

VS Code installed

Node.js and npm installed

Basic familiarity with React and Express.js

1. Setup Project Folders
   Create a main project folder, e.g.,

kotlin
Copy
Edit
macro-data-analyzer/
Inside, create two folders:

backend/ — for the Express backend server

frontend/ — for the React frontend app

2. Backend Setup
   2.1 Initialize backend
   bash
   Copy
   Edit
   cd macro-data-analyzer/backend
   npm init -y
   2.2 Install required backend packages
   bash
   Copy
   Edit
   npm install express cors multer exceljs xlsx openai dotenv
   2.3 Create uploads/ folder inside backend for uploaded files
   bash
   Copy
   Edit
   mkdir uploads
   2.4 Create .env file for OpenAI API configuration
   Create a .env file in the backend folder:
   OPENAI_API_KEY=your-openai-api-key-here
   PORT=5000
   
   2.5 Create backend server file server.js with:
   Express server running on port 5000

Multer middleware to accept Excel file uploads

OpenAI integration with GPT-4o vision model

In-memory caching for AI responses

Endpoint /upload to upload and read Excel sheets

Endpoint /analyze to read selected sheet and extract images + intelligent tags

Endpoint /image/:imageId to serve images by ID

3. Advanced Tagging System
   The app uses an intelligent tagging system that identifies specific tags around images:
   
   3.1 Tag Types:
   - Title: Content after "Title:" becomes the image display name
   - Period: Content after "Period:" shows temporal information
   - AI: Content after "AI:" is sent to OpenAI for analysis
   
   3.2 Tag Extraction Process:
   - Scans 4×5 grid of cells around each image (3 rows above, 2 columns around)
   - Searches for case-insensitive "Title:", "Period:", and "AI:" prefixes
   - Extracts content following each prefix
   
   3.3 AI Integration:
   - AI prompts are sent to GPT-4o along with the actual image
   - OpenAI provides contextual analysis of charts and images
   - Responses are cached to avoid repeated API calls
   - Supports both text and visual analysis in single request

4. Frontend Setup
   4.1 Initialize React app
   bash
   Copy
   Edit
   cd macro-data-analyzer/frontend
   npx create-react-app .
   4.2 Install any additional needed frontend dependencies (none required for current scope)
5. Frontend: Create App.jsx
   5.1 Features:
   Upload Excel file

Show sheets dropdown after upload

Show images dropdown with intelligent naming (using Title tags)

Display selected image with title as heading

Display Period and AI analysis above the image

Smart image identification and AI-powered insights

5.2 Full App.jsx code
(Complete React code with upload, dropdowns, image display, and tags — provided earlier)

6. Running the App
   6.1 Start Backend Server
   bash
   Copy
   Edit
   cd macro-data-analyzer/backend
   node server.js
   Alternate
   npm start
   Output:

arduino
Copy
Edit
✅ Backend server running on http://localhost:5000
6.2 Start Frontend React App
bash
Copy
Edit
cd macro-data-analyzer/frontend
npm start
Alternate
npm run dev
Opens in browser: http://localhost:3000

7. Usage Flow
   Upload .xlsx Excel file containing multiple sheets with images and tags.

After upload, select a sheet from the dropdown.

App processes each image, extracts Title/Period/AI tags from nearby cells.

AI prompts are automatically sent to OpenAI GPT-4o with the image for analysis.

Select an image from the second dropdown (shows intelligent names from Title tags).

View the selected image with:
- Title as heading
- Period information above image
- AI-generated analysis above image
- Cached responses for instant subsequent views

8. Important Notes
   ExcelJS version: tested on exceljs@4.4.0

Images are extracted using ExcelJS getImages()

Intelligent tagging system looks for "Title:", "Period:", "AI:" prefixes

AI integration requires valid OpenAI API key in .env file

GPT-4o model used for vision analysis (supports both text and images)

Response caching prevents repeated API calls for same image+prompt combinations

Backend serves images as binary data with correct MIME type

CORS enabled to allow frontend-backend communication on localhost

Cache is automatically cleared when new Excel files are uploaded

9. Summary of Key Packages
   Backend
   Package Purpose
   express Web server framework
   cors Cross-Origin Resource Sharing
   multer File upload middleware
   exceljs Read/write Excel files and images
   xlsx Additional Excel sheet JSON conversion
   openai OpenAI GPT-4o API integration for AI analysis
   dotenv Environment variable management for API keys

Frontend
Package Purpose
react Frontend UI library
react-dom React DOM renderer
react-scripts React build scripts & dev server

10. Troubleshooting Tips
    Make sure to restart the backend after any changes to server.js

Set valid OpenAI API key in .env file (required for AI features)

Check the console for errors on both frontend and backend

If images don't load, verify backend image route works directly

Ensure uploaded Excel files are .xlsx format and contain images

Tag format must be exact: "Title:", "Period:", "AI:" (case-insensitive)

AI analysis requires both text prompt and valid image data

Monitor console for cache hit/miss logs and API call status

IMPLEMENTED FEATURES ✅
✅ Intelligent tagging system with Title/Period/AI tags
✅ AI-powered image analysis using GPT-4o vision model  
✅ Smart image naming using Title tags in dropdowns
✅ Contextual AI analysis with both text prompts and visual data
✅ Response caching to optimize API usage and performance
✅ Environment variable management for secure API key storage

FUTURE ENHANCEMENTS
File-based or database cache persistence across server restarts
Bulk image processing and analysis
Enhanced UI with better styling and user experience
Support for additional file formats (CSV, other image types)
User authentication and project management
Export functionality for AI analysis results
