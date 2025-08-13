# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Excel Macro Data Analyzer is a full-stack application that allows users to upload Excel files, extract images from sheets, and get AI-powered analysis using OpenAI's GPT-4o vision model. The application uses an intelligent tagging system to extract contextual information from cells around images.

## Architecture

- **Backend**: Express.js server (`backend/`) with file upload, Excel processing, and OpenAI integration
- **Frontend**: React with Vite (`frontend/`) providing file upload and interactive image browsing
- **Communication**: REST API between frontend (port 3000) and backend (port 5000)

### Key Components

**Backend (`backend/server.js`)**:
- File upload handling with multer (stores in `uploads/` directory)
- Excel processing using ExcelJS and XLSX libraries
- Intelligent tagging system that scans 4×5 cell grids around images for "Title:", "Period:", and "AI:" prefixes
- OpenAI GPT-4o integration for image analysis with response caching
- Image serving endpoints

**Frontend (`frontend/src/App.jsx`)**:
- File upload interface
- Sheet selection dropdown
- Image browsing with intelligent naming from Title tags
- Display of Period information and AI analysis results

## Development Commands

### Backend
```bash
cd backend
npm start                    # Start backend server on port 5000
# Alternative: node server.js
```

### Frontend
```bash
cd frontend
npm run dev                  # Start Vite dev server on port 3000 with HMR
npm run build               # Build for production
npm run lint                # Run ESLint
npm run preview             # Preview production build
```

### Full Development Setup
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

## Environment Setup

1. Copy `backend/.env.example` to `backend/.env`
2. Set `OPENAI_API_KEY` with a valid OpenAI API key
3. Optionally configure `PORT` (defaults to 5000)

## Key Technologies

- **Excel Processing**: ExcelJS for image extraction, XLSX for sheet data
- **AI Integration**: OpenAI GPT-4o vision model for image analysis
- **Caching**: In-memory cache for AI responses (cleared on new uploads)
- **File Handling**: Multer for uploads, images served as binary with correct MIME types

## Intelligent Tagging System

The application searches for specific prefixes in cells around images:
- **Title:**: Used as display name in dropdowns and as image heading
- **Period:**: Shows temporal/context information above image
- **AI:**: Sent as prompt to OpenAI along with the image for analysis

Tag extraction scans a 4×5 grid (3 rows above, 2 columns around each image) for case-insensitive matches.

## Development Notes

- Backend serves static images via `/image/:imageId` endpoint
- CORS is enabled for localhost development
- AI responses are cached by image+prompt combination
- Cache is automatically cleared when new Excel files are uploaded
- Frontend uses absolute URLs (`http://localhost:5000`) for API calls