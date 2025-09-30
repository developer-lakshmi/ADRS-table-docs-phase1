import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

/* ============================================================================
   Thunks
============================================================================ */

// Fetch all uploaded files
export const fetchUploadedFiles = createAsyncThunk(
  "fileManagement/fetchUploadedFiles",
  async (projectId, { rejectWithValue }) => {
    try {
      const url = projectId
        ? `http://localhost:5000/files?projectId=${projectId}`
        : "http://localhost:5000/files";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch uploaded files from the server.");
      }
      const files = await response.json();
      console.log("Fetched files from server:", files);
      return files;
    } catch (error) {
      console.error("Fetch files error:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Save new files by appending them (POST)
export const saveNewFilesToDB = createAsyncThunk(
  "fileManagement/saveNewFilesToDB",
  async ({ files, projectId }, { rejectWithValue }) => {
    try {
      console.log("=== REDUX UPLOAD DEBUG START ===");
      console.log("Input files array:", files);
      console.log("Files count:", files.length);
      console.log("Project ID:", projectId);
      
      // Log each file's properties
      files.forEach((file, index) => {
        console.log(`File ${index + 1}:`, {
          name: file.name,
          size: file.size,
          type: file.type,
          category: file.category,
          lastModified: file.lastModified
        });
      });

      const formData = new FormData();
      
      // Extract category from first file (all files in batch should have same category)
      let category = 'pid'; // default
      if (files.length > 0) {
        if (files[0].category) {
          category = files[0].category;
          console.log("Category extracted from first file:", category);
        } else {
          console.log("No category found on first file, using default:", category);
        }
      }
      
      console.log("Final category to send:", category);
      
      // Add files to FormData
      files.forEach((file, index) => {
        console.log(`Adding file ${index + 1} to FormData:`, file.name);
        formData.append("files", file);
      });
      
      // Add other data
      formData.append("projectId", projectId);
      formData.append("category", category);

      // Log FormData contents
      console.log("FormData contents:");
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File - ${value.name} (${value.size} bytes, ${value.type})`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      console.log("Sending POST request to /upload...");
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed with response:", errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Upload success response:", result);
      console.log("=== REDUX UPLOAD DEBUG END ===");
      
      return result.files;
    } catch (error) {
      console.error("=== UPLOAD ERROR ===");
      console.error("Error details:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      return rejectWithValue(error.message);
    }
  }
);

// Overwrite all uploaded files (DELETE)
export const overwriteFilesInDB = createAsyncThunk(
  "fileManagement/overwriteFilesInDB",
  async (fileIds, { rejectWithValue }) => {
    try {
      const deletePromises = fileIds.map((id) =>
        fetch(`http://localhost:5000/files/${id}`, { method: "DELETE" })
      );
      await Promise.all(deletePromises);
      return fileIds;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/* ============================================================================
   Slice
============================================================================ */

const fileUploadSlice = createSlice({
  name: "fileManagement",
  initialState: {
    files: [], // Store for uploaded files
    loading: false, // Loading state for file operations
    error: null,
  },
  reducers: {
    addFiles: (state, action) => {
      state.files = [...state.files, ...action.payload];
    },
    clearFiles: (state) => {
      state.files = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUploadedFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUploadedFiles.fulfilled, (state, action) => {
        state.files = action.payload; // Update the files in the Redux store
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchUploadedFiles.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(saveNewFilesToDB.pending, (state) => {
        state.loading = true; // Set loading to true when uploading files
        state.error = null;
      })
      .addCase(saveNewFilesToDB.fulfilled, (state, action) => {
        state.files = [...state.files, ...action.payload]; // Append new files
        state.loading = false; // Set loading to false after upload
        state.error = null;
      })
      .addCase(saveNewFilesToDB.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false; // Set loading to false on error
      });
  },
});

export const { addFiles, clearFiles } = fileUploadSlice.actions;
export default fileUploadSlice.reducer;
