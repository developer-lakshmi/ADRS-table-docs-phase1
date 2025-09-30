const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Directory to store uploaded files
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// In-memory file metadata storage
let filesMetadata = [];

const METADATA_FILE = path.join(UPLOAD_DIR, "metadata.json");

// Load metadata from file
const loadMetadata = () => {
  if (fs.existsSync(METADATA_FILE)) {
    try {
      const data = fs.readFileSync(METADATA_FILE, "utf8");
      filesMetadata = JSON.parse(data);

      // Add default category to existing files without category
      let updated = false;
      filesMetadata = filesMetadata.map((file) => {
        if (!file.category) {
          file.category = "pid"; // Default to P&ID
          updated = true;
        }
        return file;
      });

      if (updated) {
        saveMetadata();
        console.log("Added default category to existing files");
      }

      console.log("Loaded metadata from file:", filesMetadata.length, "files");
    } catch (error) {
      console.error("Error loading metadata:", error);
      filesMetadata = [];
    }
  } else {
    console.log("No metadata file found, starting fresh");
    filesMetadata = [];
  }
};

// Save metadata to file
const saveMetadata = () => {
  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(filesMetadata, null, 2));
    console.log("Metadata saved successfully");
  } catch (error) {
    console.error("Error saving metadata:", error);
  }
};

// On server start
loadMetadata();

// API to upload files
app.post("/upload", upload.array("files"), (req, res) => {
  const projectId = req.body.projectId;
  const category = req.body.category || "pid"; // Get category from form data

  console.log("=== UPLOAD REQUEST DEBUG ===");
  console.log("- ProjectId:", projectId);
  console.log("- Category from request body:", req.body.category);
  console.log("- Final category:", category);
  console.log("- Files count:", req.files ? req.files.length : 0);
  console.log("- Request body keys:", Object.keys(req.body));
  console.log("- Full request body:", req.body);

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  const uploadedFiles = req.files.map((file) => {
    const fileData = {
      id: file.filename,
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      url: `http://localhost:5000/uploads/${file.filename}`,
      lastModified: Date.now(),
      projectId,
      category, // Store the category
    };
    
    console.log("- Created file with category:", fileData.category);
    return fileData;
  });

  // Add to metadata
  filesMetadata = [...filesMetadata, ...uploadedFiles];
  saveMetadata();

  console.log(`Successfully uploaded ${uploadedFiles.length} files with category: ${category}`);
  console.log("=== END UPLOAD DEBUG ===");
  
  res.status(200).json({ message: "Files uploaded successfully", files: uploadedFiles });
});

// API to fetch uploaded files
app.get("/files", (req, res) => {
  const { projectId } = req.query;

  console.log("=== FETCH FILES DEBUG ===");
  console.log("- ProjectId:", projectId);
  console.log("- Total files:", filesMetadata.length);

  if (projectId) {
    const projectFiles = filesMetadata.filter((file) => file.projectId === projectId);
    console.log("- Project files:", projectFiles.length);
    console.log(
      "- By category:",
      projectFiles.reduce((acc, file) => {
        acc[file.category] = (acc[file.category] || 0) + 1;
        return acc;
      }, {})
    );
    res.status(200).json(projectFiles);
  } else {
    res.status(200).json(filesMetadata);
  }
});

// API to delete a file
app.delete("/files/:id", (req, res) => {
  const fileId = req.params.id;
  const fileIndex = filesMetadata.findIndex((file) => file.id === fileId);

  if (fileIndex !== -1) {
    const file = filesMetadata[fileIndex];
    const filePath = path.join(UPLOAD_DIR, file.id);

    // Delete the physical file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from metadata
    filesMetadata.splice(fileIndex, 1);
    saveMetadata();

    res.status(200).json({ message: "File deleted successfully" });
  } else {
    res.status(404).json({ message: "File not found" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});