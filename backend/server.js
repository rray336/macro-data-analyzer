const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const ExcelJS = require("exceljs");
const XLSX = require("xlsx");
const OpenAI = require("openai");

// Load environment variables from .env file
require("dotenv").config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 5000;

// In-memory cache for OpenAI responses
const aiResponseCache = {};

// Middleware
app.use(cors());
app.use(express.json());

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Test route
app.get("/", (req, res) => {
  res.send("Server running");
});

// Upload route: receive Excel file, return sheets
app.post("/upload", upload.single("excelFile"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);

    const sheetNames = workbook.worksheets.map((ws) => ws.name);

    // Save last uploaded file path globally for image serving
    global.lastUploadedFilePath = req.file.path;

    // Clear AI response cache when new file is uploaded
    Object.keys(aiResponseCache).forEach(key => delete aiResponseCache[key]);
    console.log("AI response cache cleared due to new file upload");

    res.json({
      message: "File uploaded successfully",
      filePath: req.file.path,
      sheets: sheetNames,
    });
  } catch (err) {
    console.error("Error reading Excel file:", err);
    res.status(500).json({ error: "Failed to read Excel file" });
  }
});

function getCellText(worksheet, row, col) {
  const cell = worksheet.getCell(row, col);
  if (cell && cell.value) {
    if (typeof cell.value === "string") return cell.value;
    if (typeof cell.value === "object" && cell.value.richText) {
      return cell.value.richText.map((obj) => obj.text).join("");
    }
  }
  return null;
}

// Function to get OpenAI response with optional image and caching
async function getOpenAIResponse(prompt, imageBuffer = null, mimeType = null, cacheKey = null) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return "OpenAI API key not configured";
    }

    // Check cache first if cacheKey is provided
    if (cacheKey && aiResponseCache[cacheKey]) {
      console.log(`Cache hit for key: ${cacheKey}`);
      return aiResponseCache[cacheKey];
    }

    let messages = [];

    if (imageBuffer && mimeType) {
      // Convert image buffer to base64
      const base64Image = imageBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: prompt
          },
          {
            type: "image_url",
            image_url: {
              url: dataUrl,
              detail: "high"
            }
          }
        ]
      });
    } else {
      // Text-only message
      messages.push({
        role: "user",
        content: prompt
      });
    }

    console.log(`Making OpenAI API call for key: ${cacheKey || 'no-cache'}`);
    const completion = await openai.chat.completions.create({
      model: imageBuffer ? "gpt-4o" : "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content.trim();

    // Cache the response if cacheKey is provided and response is not an error
    if (cacheKey && !response.startsWith('AI Error:')) {
      aiResponseCache[cacheKey] = response;
      console.log(`Cached response for key: ${cacheKey}`);
    }

    return response;
  } catch (error) {
    console.error("OpenAI API error:", error);
    return `AI Error: ${error.message}`;
  }
}

// Analyze route: given filePath + sheetName, return sheet data + images + tags
app.post("/analyze", express.urlencoded({ extended: true }), async (req, res) => {
  const { filePath, sheetName } = req.body;

  if (!filePath || !sheetName) {
    return res.status(400).json({ error: "Missing filePath or sheetName" });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) {
      return res.status(404).json({ error: "Sheet not found" });
    }

    // Use xlsx to extract JSON data preview (plain JSON)
    const xlsxBuffer = await workbook.xlsx.writeBuffer();
    const xlsxWork = XLSX.read(xlsxBuffer, { type: "buffer" });
    const sheet = xlsxWork.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null });

    // Extract images metadata from worksheet with safe serialization + tagging
    const worksheetImages = worksheet.getImages();
    const media = workbook.media;

    const images = await Promise.all(worksheetImages.map(async (img) => {
      const imageData = media.find((m) => m.index === img.imageId);

      // Top-left cell of image range
      const tl = img.range.tl;

      // Collect all cell text by checking cells 2 rows above and 2 columns around
      const allCellTexts = [];
      for (let r = tl.nativeRow - 3; r <= tl.nativeRow; r++) {
        for (let c = Math.max(1, tl.nativeCol - 2); c <= tl.nativeCol + 2; c++) {
          const text = getCellText(worksheet, r, c);
          if (text) allCellTexts.push(text.trim());
        }
      }

      // Extract specific tags: Title, Period, AI
      let title = null;
      let period = null;
      let ai = null;

      allCellTexts.forEach(text => {
        if (text.toLowerCase().startsWith('title:')) {
          title = text.substring(6).trim();
        } else if (text.toLowerCase().startsWith('period:')) {
          period = text.substring(7).trim();
        } else if (text.toLowerCase().startsWith('ai:')) {
          ai = text.substring(3).trim();
        }
      });

      // If AI text is found, get OpenAI response with image
      if (ai) {
        let mimeType = null;
        if (imageData?.extension === "jpeg" || imageData?.extension === "jpg") {
          mimeType = "image/jpeg";
        } else if (imageData?.extension === "png") {
          mimeType = "image/png";
        } else if (imageData?.extension === "gif") {
          mimeType = "image/gif";
        }
        
        // Generate cache key: combination of image ID and AI prompt
        const cacheKey = `img_${img.imageId}_${Buffer.from(ai).toString('base64')}`;
        
        ai = await getOpenAIResponse(ai, imageData?.buffer, mimeType, cacheKey);
      }

      // Use title as image name, fallback to original naming
      const imageName = title || `Image ${img.imageId}`;

      return {
        id: img.imageId,
        name: imageName,
        title: title,
        period: period,
        ai: ai,
        range: {
          tl: tl ? { nativeRow: tl.nativeRow, nativeCol: tl.nativeCol } : null,
          br: img.range.br ? { nativeRow: img.range.br.nativeRow, nativeCol: img.range.br.nativeCol } : null,
        },
        extension: imageData ? imageData.extension : null,
        tags: [...new Set(allCellTexts)], // keep all tags for reference
      };
    }));

    res.json({
      rowCount: jsonData.length,
      columnNames: jsonData.length > 0 ? Object.keys(jsonData[0]) : [],
      sampleData: jsonData.slice(0, 5),
      images,
    });
  } catch (err) {
    console.error("Error analyzing sheet:", err);
    res.status(500).json({ error: "Failed to analyze sheet" });
  }
});

// Serve image data by imageId
app.get("/image/:imageId", async (req, res) => {
  const imageId = parseInt(req.params.imageId, 10);
  if (isNaN(imageId)) {
    return res.status(400).json({ error: "Invalid imageId" });
  }

  try {
    if (!global.lastUploadedFilePath) {
      return res.status(400).json({ error: "No uploaded file available" });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(global.lastUploadedFilePath);

    // Find the media with matching imageId
    const mediaItem = workbook.media.find((m) => m.index === imageId);
    if (!mediaItem) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Set content-type header based on extension
    let mimeType = "application/octet-stream";
    if (mediaItem.extension === "jpeg" || mediaItem.extension === "jpg") mimeType = "image/jpeg";
    else if (mediaItem.extension === "png") mimeType = "image/png";
    else if (mediaItem.extension === "gif") mimeType = "image/gif";

    res.setHeader("Content-Type", mimeType);
    res.send(mediaItem.buffer);
  } catch (err) {
    console.error("Error serving image:", err);
    res.status(500).json({ error: "Failed to serve image" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});
