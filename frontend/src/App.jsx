import React, { useState, useEffect } from "react";

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
      const res = await fetch("http://localhost:5000/upload", {
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

        const res = await fetch("http://localhost:5000/analyze", {
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
    <div style={{ maxWidth: 700, margin: "20px auto", fontFamily: "Arial, sans-serif" }}>
      <h1>Excel Macro Data Analyzer</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          disabled={loading}
        />
        <button onClick={handleUpload} disabled={loading} style={{ marginLeft: 10 }}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: 20 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {sheets.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <label>
            <strong>Select Sheet:</strong>{" "}
            <select
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
          </label>
        </div>
      )}

      {images.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <label>
            <strong>Select Chart/Image:</strong>{" "}
            <select
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
          </label>
        </div>
      )}

      {selectedImageId && selectedImage && (
        <div>
          <h3>{selectedImage.title || `Image ${selectedImageId}`}</h3>
          
          {selectedImage.period && (
            <div style={{ marginBottom: 5, fontSize: 14 }}>
              {selectedImage.period}
            </div>
          )}
          
          {selectedImage.ai && (
            <div style={{ marginBottom: 10, fontSize: 14 }}>
              {selectedImage.ai}
            </div>
          )}
          
          <img
            src={`http://localhost:5000/image/${selectedImageId}`}
            alt={selectedImage.title || `Chart ${selectedImageId}`}
            style={{ maxWidth: "100%", border: "1px solid #ccc", borderRadius: 4 }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
