import React, { useState, useEffect } from "react";
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [filePath, setFilePath] = useState("");
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [images, setImages] = useState([]);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
    setSheets([]);
    setSelectedSheet("");
    setImages([]);
    setSelectedImageId(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an Excel file first.");
      return;
    }
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("excelFile", file);

    try {
      const res = await fetch("/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setFilePath(data.filePath);
        setSheets(data.sheets);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch (err) {
      setError("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // Fetch images when selectedSheet changes
  useEffect(() => {
    if (!selectedSheet) {
      setImages([]);
      setSelectedImageId(null);
      return;
    }

    const fetchImages = async () => {
      setError("");
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("filePath", filePath);
        params.append("sheetName", selectedSheet);

        const res = await fetch("/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });

        const data = await res.json();
        if (res.ok) {
          setImages(data.images || []);
          setSelectedImageId(null);
        } else {
          setError(data.error || "Failed to fetch images");
          setImages([]);
        }
      } catch (err) {
        setError("Failed to fetch images");
        setImages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [selectedSheet, filePath]);

  const selectedImage = images.find((img) => String(img.id) === String(selectedImageId));

  return (
    <div className="app-container">
      <h1 className="app-title">📊 Macro Data Analyzer (with AI)</h1>
      <p className="app-subtitle">Intelligent image analysis with AI-powered insights</p>

      <div className="welcome-section">
        <div className="welcome-content">
          <h2 className="welcome-title">Thank you for visiting.</h2>
          <p className="welcome-text">
            The name <em>Macro Data Analyzer</em> comes from my own use case—tracking 100+ macroeconomic and commodity datapoints, where I needed a natural language (AI) overlay to help shape narratives.
          </p>
          <p className="welcome-text">
            That said, the app is more general-purpose. It can:
          </p>
          <ul className="capabilities-list">
            <li>Analyze charts or analytics (in the form of images) and provide natural language descriptions.</li>
            <li>Process multi-sheet Excel files, with each sheet containing charts/analytics as images.</li>
            <li>Use simple image tags (top-left of each image):
              <ol className="tags-list">
                <li><strong>Title</strong></li>
                <li><strong>Period</strong> (last updated)</li>
                <li><strong>AI</strong> (a question specific to that image)</li>
              </ol>
            </li>
            <li>Cache the LLM analysis so each sheet is only processed once per session.</li>
          </ul>
        </div>
      </div>

      <div className="upload-section">
        <div className="file-input">
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            disabled={loading}
          />
          <button 
            onClick={handleUpload} 
            disabled={loading} 
            className="btn btn-primary"
          >
            {loading && <span className="loading-spinner"></span>}
            {loading ? "Uploading..." : "📤 Upload File"}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {sheets.length > 0 && (
        <div className="section">
          <h2 className="section-title">📊 Select Worksheet</h2>
          <div className="form-group">
            <label className="form-label">Choose a sheet to analyze:</label>
            <select
              className="form-select"
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Select a Sheet --</option>
              {sheets.map((sheet) => (
                <option key={sheet} value={sheet}>
                  {sheet}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="section">
          <h2 className="section-title">📈 Available Charts</h2>
          <div className="form-group">
            <label className="form-label">Select an image to analyze:</label>
            <select
              className="form-select"
              value={selectedImageId || ""}
              onChange={(e) => setSelectedImageId(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Select an Image --</option>
              {images.map((img) => (
                <option key={img.id} value={img.id}>
                  {img.name || `Image ${img.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {selectedImageId && selectedImage && (
        <div className="section">
          <div className="image-preview">
            <h2 className="image-title">{selectedImage.title || `Image ${selectedImageId}`}</h2>
            
            {selectedImage.period && (
              <div className="image-meta">
                <strong>Period:</strong> {selectedImage.period}
              </div>
            )}
            
            {selectedImage.ai && (
              <div className="ai-response">
                <div className="ai-response-header">
                  <h3 className="ai-response-title">AI Analysis</h3>
                </div>
                <div className="ai-response-content">
                  {selectedImage.ai}
                </div>
              </div>
            )}
            
            <div className="image-display">
              <img
                src={`/image/${selectedImageId}`}
                alt={selectedImage.title || `Chart ${selectedImageId}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
