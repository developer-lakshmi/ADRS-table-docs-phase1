import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { setSelectedFiles } from "../../../../../redux/slices/file-upload/fileSelectionSlice";
import { showNotification } from "../../../../../redux/slices/notification/notificationSlice";
import { fetchUploadedFiles } from "../../../../../redux/slices/shared/fileUploadSlice";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";

const formatSize = (size) => {
  if (!size) return "0 KB";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const getType = (file) => {
  if (!file.type && file.name) {
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "pdf") return "PDF";
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) return "Image";
  }
  if (file.type && file.type.toLowerCase().includes("pdf")) return "PDF";
  if (file.type && file.type.toLowerCase().includes("image")) return "Image";
  return "Other";
};

const ReferenceDocuments = ({ projectId }) => {
  const dispatch = useDispatch();
  const files = useSelector((state) => state.fileManagement.files);
  const loading = useSelector((state) => state.fileManagement.loading);
  const isSubSidebarOpen = useSelector((state) => state.sidebar.isSubSidebarOpen);
  const isMobileSidebarOpen = useSelector((state) => state.sidebar.isMobileSidebarOpen);

  console.log("=== ReferenceDocuments Debug ===");
  console.log("All files:", files);
  console.log("Files count:", files.length);

  // Filter files for Reference documents
  const referenceFiles = files.filter(file => {
    const isRef = file.category === 'reference';
    console.log(`File: ${file.name}, Category: ${file.category}, Is Reference: ${isRef}`);
    return isRef;
  });

  console.log("Reference Files:", referenceFiles.length);

  useEffect(() => {
    console.log("Initial fetch for project:", projectId);
    if (projectId) {
      dispatch(fetchUploadedFiles(projectId));
    }
  }, [dispatch, projectId]);

  const createRows = (fileList) => fileList.map((file, index) => ({
    id: file.id || file.name || index + 1,
    serialNo: index + 1,
    name: file.name || "N/A",
    type: getType(file),
    size: formatSize(file.size),
    lastModified: formatDate(file.lastModified),
  }));

  const referenceRows = createRows(referenceFiles);

  // Reference columns (without action and status columns)
  const referenceColumns = [
    { field: "serialNo", headerName: "Serial No", width: 150, headerAlign: "center", align: "center" },
    {
      field: "name",
      headerName: "Document Title",
      minWidth: 350,
      renderCell: (params) => (
        <Tooltip title={params.value} arrow>
          <span
            className="text-gray-700 truncate block max-w-[180px] sm:max-w-[240px] md:max-w-[320px] lg:max-w-[450px]"
            style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {params.value}
          </span>
        </Tooltip>
      ),
    },
    {
      field: "type",
      headerName: "Type",
      width: 150,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <span>
          {params.value === "PDF" || params.value === "Image" ? params.value : ""}
        </span>
      ),
    },
    {
      field: "size",
      headerName: "Size",
      width: 150,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "lastModified",
      headerName: "Last Modified",
      width: 180,
      headerAlign: "center",
      align: "center",
    },
  ];

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const category = 'reference';
    
    console.log(`=== Reference Documents File Upload Debug ===`);
    console.log(`Category: ${category}`);
    console.log(`Files selected:`, newFiles.map(f => f.name));
    
    const formData = new FormData();
    newFiles.forEach(file => {
      formData.append('files', file);
    });
    formData.append('projectId', projectId);
    formData.append('category', category);
    
    fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(result => {
      console.log('Upload success:', result);
      dispatch(showNotification({ 
        message: `${newFiles.length} reference file(s) uploaded successfully.`, 
        type: "success" 
      }));
      dispatch(fetchUploadedFiles(projectId));
    })
    .catch(error => {
      console.error('Upload error:', error);
      dispatch(showNotification({ 
        message: "Failed to upload files to the server.", 
        type: "error" 
      }));
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const newFiles = Array.from(e.dataTransfer.files);
    const category = 'reference';
    
    console.log(`=== Reference Documents Drag & Drop Upload Debug ===`);
    console.log(`Category: ${category}`);
    console.log(`Files dropped:`, newFiles.map(f => f.name));
    
    const formData = new FormData();
    newFiles.forEach(file => {
      formData.append('files', file);
    });
    formData.append('projectId', projectId);
    formData.append('category', category);
    
    fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(result => {
      console.log('Drop upload success:', result);
      dispatch(showNotification({ 
        message: `${newFiles.length} reference file(s) uploaded successfully.`, 
        type: "success" 
      }));
      dispatch(fetchUploadedFiles(projectId));
    })
    .catch(error => {
      console.error('Drop upload error:', error);
      dispatch(showNotification({ 
        message: "Failed to upload files to the server.", 
        type: "error" 
      }));
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleRowSelection = (selectionModel) => {
    const selectedIds = Array.from(selectionModel.ids || []);
    const selectedRows = referenceRows.filter((row) => selectedIds.includes(row.id));
    dispatch(setSelectedFiles(selectedRows));
  };

  return (
    <div
      className="w-full max-w-full mx-auto 2xl:max-w-[1400px]"
      style={{
        maxWidth: isMobileSidebarOpen
          ? "100vw"
          : isSubSidebarOpen
            ? "calc(100vw - 32px - 150px)"
            : "calc(100vw - 32px)",
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <CircularProgress />
          <p className="ml-4 text-gray-600">Loading files...</p>
        </div>
      ) : (
        <div className="p-1 sm:p-2 h-full w-full min-w-[320px] 2xl:max-w-[1400px] 2xl:mx-auto">
          
          {/* Header */}
          {/* <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-green-600 text-white shadow-md">
              🤖 Reference Documents
            </div>
          </div> */}

          {/* File Table or Empty State */}
          {referenceFiles.length > 0 ? (
            <Paper
              sx={{
                width: "100%",
                maxWidth: "100%",
                height: {
                  lg: "calc(100vh - 200px)",
                  xl: "calc(100vh - 300px)",
                },
                minHeight: 300,
                overflow: "hidden",
                boxShadow: 3,
                borderRadius: 3,
                border: "1px solid #e5e7eb",
                display: "flex",
                flexDirection: "column",
                "@media (min-width: 1536px)": {
                  maxWidth: "1400px",
                  margin: "0 auto",
                },
              }}
            >
              <DataGrid
                rows={referenceRows}
                columns={referenceColumns}
                checkboxSelection
                onRowSelectionModelChange={handleRowSelection}
                pageSizeOptions={[10, 20, 30, 100]}
                pagination
                autoHeight={false}
                disableColumnResize={false}
                sx={{
                  width: "100%",
                  height: "100%",
                  fontFamily: "inherit",
                  fontSize: "1rem",
                  "& .MuiDataGrid-main": {
                    overflow: "hidden",
                  },
                  "& .MuiDataGrid-virtualScroller": {
                    overflow: "auto",
                  },
                  "& .MuiDataGrid-virtualScrollerContent": {
                    width: "100% !important",
                  },
                  "& .MuiDataGrid-columnHeaders": {
                    background: "#f0fdf4",
                    fontWeight: 700,
                    fontSize: "1rem",
                    minHeight: "52px !important",
                  },
                  "& .MuiDataGrid-columnHeader": {
                    "&:focus": {
                      outline: "none",
                    },
                    "&:focus-within": {
                      outline: "none",
                    },
                  },
                  "& .MuiDataGrid-row": {
                    background: "#fff",
                    minHeight: "52px !important",
                    "&:hover": {
                      background: "#dcfce7",
                    },
                  },
                  "& .MuiDataGrid-cell": {
                    borderBottom: "1px solid #e5e7eb",
                    padding: "8px 16px",
                    display: "flex",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    "&:focus": {
                      outline: "none",
                    },
                    "&:focus-within": {
                      outline: "none",
                    },
                  },
                  "& .MuiDataGrid-cellContent": {
                    width: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  },
                  "& .Mui-selected-row": {
                    backgroundColor: "rgba(25, 118, 210, 0.08)",
                    "&:hover": {
                      backgroundColor: "rgba(25, 118, 210, 0.16)",
                    },
                  },
                  "& .MuiDataGrid-footerContainer": {
                    borderTop: "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                  },
                  "@media (min-width: 1536px)": {
                    "& .MuiDataGrid-columnHeaders": {
                      fontSize: "1.1rem",
                      minHeight: "56px !important",
                    },
                    "& .MuiDataGrid-row": {
                      minHeight: "56px !important",
                    },
                    "& .MuiDataGrid-cell": {
                      padding: "12px 20px",
                      fontSize: "1.05rem",
                    },
                  },
                  "@media (min-width: 1280px) and (max-width: 1535px)": {
                    "& .MuiDataGrid-columnHeaders": {
                      fontSize: "1.05rem",
                      minHeight: "54px !important",
                    },
                    "& .MuiDataGrid-row": {
                      minHeight: "54px !important",
                    },
                    "& .MuiDataGrid-cell": {
                      padding: "10px 18px",
                      fontSize: "1.02rem",
                    },
                  },
                  "@media (max-width: 768px)": {
                    "& .MuiDataGrid-columnHeaders": {
                      fontSize: "0.875rem",
                      minHeight: "48px !important",
                    },
                    "& .MuiDataGrid-row": {
                      minHeight: "48px !important",
                    },
                    "& .MuiDataGrid-cell": {
                      padding: "6px 12px",
                      fontSize: "0.875rem",
                    },
                  },
                  "@media (max-width: 480px)": {
                    fontSize: "0.75rem",
                    "& .MuiDataGrid-columnHeaders": {
                      fontSize: "0.75rem",
                      minHeight: "44px !important",
                    },
                    "& .MuiDataGrid-row": {
                      minHeight: "44px !important",
                    },
                    "& .MuiDataGrid-cell": {
                      padding: "4px 8px",
                      fontSize: "0.75rem",
                    },
                  },
                }}
              />
            </Paper>
          ) : (
            <div className="mt-2 flex justify-center 2xl:max-w-[1400px] 2xl:mx-auto">
              <div
                className="w-full max-w-sm sm:max-w-md lg:max-w-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 rounded-lg text-center"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <div className="mb-4">
                  <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                    🤖 AI Model Study
                  </div>
                </div>
                
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                  No reference documents uploaded yet
                </p>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Upload reference documents, manuals, and training materials to help improve the AI model accuracy.
                </p>
                
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
                  Drag and drop files here, or click the button below to browse
                </p>
                
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="reference-file-upload-input"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                />
                <label 
                  htmlFor="reference-file-upload-input" 
                  className="inline-flex items-center px-6 py-3 rounded-lg cursor-pointer transition-colors font-medium shadow-sm bg-green-600 hover:bg-green-700 text-white"
                >
                  🤖 Browse Reference Documents
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReferenceDocuments;