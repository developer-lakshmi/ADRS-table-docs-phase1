import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { Link } from "react-router-dom";
import { Button, Box, Tabs, Tab } from "@mui/material";
import { setSelectedFiles } from "../../../../../redux/slices/file-upload/fileSelectionSlice";
import { showNotification } from "../../../../../redux/slices/notification/notificationSlice";
import { fetchUploadedFiles, saveNewFilesToDB } from "../../../../../redux/slices/shared/fileUploadSlice";
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

const getStatusLabel = (status) => {
  if (status === "approved") return "Approved";
  if (status === "success") return "Processed";
  if (status === "need_approve") return "Need to approve";
  return "Not processed";
};

const FileManagementPage = ({ projectId, onActiveTabChange }) => {
  const dispatch = useDispatch();
  const files = useSelector((state) => state.fileManagement.files);
  const loading = useSelector((state) => state.fileManagement.loading);
  const fileStatuses = useSelector((state) => state.fileStatus);
  const appId = useSelector((state) => state.app.appId);
  const isSubSidebarOpen = useSelector((state) => state.sidebar.isSubSidebarOpen);
  const isMobileSidebarOpen = useSelector((state) => state.sidebar.isMobileSidebarOpen);

  // Active tab state - 0 for P&ID, 1 for Reference
  const [activeTab, setActiveTab] = useState(0);

  console.log("=== FileManagement Debug ===");
  console.log("All files:", files);
  console.log("Files count:", files.length);

  // Filter files based on category
  const pidFiles = files.filter(file => {
    const isPid = file.category === 'pid' || !file.category;
    console.log(`File: ${file.name}, Category: ${file.category}, Is P&ID: ${isPid}`);
    return isPid;
  });
  
  const referenceFiles = files.filter(file => {
    const isRef = file.category === 'reference';
    console.log(`File: ${file.name}, Category: ${file.category}, Is Reference: ${isRef}`);
    return isRef;
  });

  console.log("P&ID Files:", pidFiles.length);
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
    status: getStatusLabel(fileStatuses[file.id]),
  }));

  const pidRows = createRows(pidFiles);
  const referenceRows = createRows(referenceFiles);

  // P&ID columns (with status column)
  const pidColumns = [
    { field: "serialNo", headerName: "Serial No", width: 150, headerAlign: "center", align: "center" },
    {
      field: "name",
      headerName: "Drawing Title",
      minWidth: 280,
      renderCell: (params) => {
        const status = fileStatuses[params.row.id];
        const isSuccess = status === "success" || status === "approved" || status === "need_approve";
        return isSuccess ? (
          <Tooltip title={params.value} arrow>
            <Link
              to={`/app/${appId}/dashboard/project/${projectId}/view/${params.row.serialNo}`}
              className="text-blue-600 font-medium hover:underline truncate block max-w-[180px] sm:max-w-[240px] md:max-w-[320px] lg:max-w-[400px]"
              style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              state={{ projectId, fileId: params.row.id }}
            >
              {params.value}
            </Link>
          </Tooltip>
        ) : (
          <Tooltip title={params.value} arrow>
            <span
              className="text-gray-400 cursor-not-allowed truncate block max-w-[180px] sm:max-w-[240px] md:max-w-[320px] lg:max-w-[400px]"
              style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              title="Only successfully processed files can be viewed."
            >
              {params.value}
            </span>
          </Tooltip>
        );
      },
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
    {
      field: "status",
      headerName: "Status",
      width: 170,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        let color = "#9ca3af"; // gray
        if (params.value === "Processed") color = "#22c55e"; // green
        if (params.value === "Approved") color = "#0ea5e9"; // blue
        if (params.value === "Need to approve") color = "#f59e42"; // orange
        return (
          <span style={{
            color,
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: 0.2,
          }}>
            {params.value}
          </span>
        );
      }
    },
  ];

  // Reference columns (without status column)
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
    const category = activeTab === 0 ? 'pid' : 'reference';
    
    console.log(`=== File Upload Debug ===`);
    console.log(`Active Tab: ${activeTab}`);
    console.log(`Category determined: ${category}`);
    console.log(`Files selected:`, newFiles.map(f => f.name));
    
    // Create FormData and append category directly
    const formData = new FormData();
    newFiles.forEach(file => {
      formData.append('files', file);
    });
    formData.append('projectId', projectId);
    formData.append('category', category);
    
    console.log("FormData category:", category);
    
    // Send directly to server instead of through Redux
    fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(result => {
      console.log('Upload success:', result);
      dispatch(showNotification({ 
        message: `${newFiles.length} ${category === 'pid' ? 'P&ID' : 'reference'} file(s) uploaded successfully.`, 
        type: "success" 
      }));
      
      // Refresh file list
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
    const category = activeTab === 0 ? 'pid' : 'reference';
    
    console.log(`=== Drag & Drop Upload Debug ===`);
    console.log(`Active Tab: ${activeTab}`);
    console.log(`Category determined: ${category}`);
    console.log(`Files dropped:`, newFiles.map(f => f.name));
    
    // Create FormData and append category directly
    const formData = new FormData();
    newFiles.forEach(file => {
      formData.append('files', file);
    });
    formData.append('projectId', projectId);
    formData.append('category', category);
    
    // Send directly to server
    fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(result => {
      console.log('Drop upload success:', result);
      dispatch(showNotification({ 
        message: `${newFiles.length} ${category === 'pid' ? 'P&ID' : 'reference'} file(s) uploaded successfully.`, 
        type: "success" 
      }));
      
      // Refresh file list
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
    const currentRows = activeTab === 0 ? pidRows : referenceRows;
    const selectedIds = Array.from(selectionModel.ids || []);
    const selectedRows = currentRows.filter((row) => selectedIds.includes(row.id));
    dispatch(setSelectedFiles(selectedRows));
  };

  const handleTabChange = (event, newValue) => {
    console.log(`Switching to tab: ${newValue} (${newValue === 0 ? 'P&ID' : 'Reference'})`);
    setActiveTab(newValue);
    
    // Notify parent component about tab change
    if (onActiveTabChange) {
      onActiveTabChange(newValue);
    }
    
    // Clear selections when switching tabs
    dispatch(setSelectedFiles([]));
  };

  // Get current data based on active tab
  const currentFiles = activeTab === 0 ? pidFiles : referenceFiles;
  const currentRows = activeTab === 0 ? pidRows : referenceRows;
  const currentColumns = activeTab === 0 ? pidColumns : referenceColumns;

  return (
    <div
      className="w-full max-w-full mx-auto"
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
        <div className="p-2 sm:p-4 h-full w-full min-w-[320px]">
          

          {/* Tab Headers */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              aria-label="file management tabs"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  minWidth: 200,
                },
              }}
            >
              <Tab 
                label={
                  <span className="flex items-center gap-2">
                    📊 P&ID Files ({pidFiles.length})
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      Processing
                    </span>
                  </span>
                } 
                id="tab-0" 
                aria-controls="tabpanel-0" 
              />
              <Tab 
                label={
                  <span className="flex items-center gap-2">
                    🤖 Reference Documents ({referenceFiles.length})
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                       Model Study
                    </span>
                  </span>
                } 
                id="tab-1" 
                aria-controls="tabpanel-1" 
              />
            </Tabs>
          </Box>

          {/* File Table or Empty State */}
          {currentFiles.length > 0 ? (
            <Paper
              sx={{
                width: "100%",
                maxWidth: "100%",
                height: "calc(100vh - 260px)",
                minHeight: 300,
                overflow: "auto",
                boxShadow: 3,
                borderRadius: 3,
                border: "1px solid #e5e7eb",
              }}
            >
              <DataGrid
                rows={currentRows}
                columns={currentColumns}
                checkboxSelection
                onRowSelectionModelChange={handleRowSelection}
                pageSizeOptions={[10, 20, 30, 100]}
                pagination
                sx={{
                  width: "100%",
                  minWidth: 320,
                  fontFamily: "inherit",
                  fontSize: "1rem",
                  "& .MuiDataGrid-columnHeaders": {
                    background: activeTab === 0 ? "#f3f4f6" : "#f0f9ff",
                    fontWeight: 700,
                    fontSize: "1rem",
                  },
                  "& .MuiDataGrid-row": {
                    background: "#fff",
                    "&:hover": {
                      background: activeTab === 0 ? "#f1f5f9" : "#f0f9ff",
                    },
                  },
                  "& .MuiDataGrid-cell": {
                    borderBottom: "1px solid #e5e7eb",
                    maxWidth: "100vw",
                  },
                  "& .MuiDataGrid-virtualScroller": {
                    overflowX: "auto !important",
                  },
                  "& .MuiDataGrid-cellContent": {
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
                }}
              />
            </Paper>
          ) : (
            <div className="mt-4 flex justify-center">
              <div
                className="w-full max-w-sm sm:max-w-md lg:max-w-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 rounded-lg text-center"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <div className="mb-4">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    activeTab === 0 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {activeTab === 0 ? '📊 P&ID Processing' : '🤖 AI Model Study'}
                  </div>
                </div>
                
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                  No {activeTab === 0 ? 'P&ID files' : 'reference documents'} uploaded yet
                </p>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {activeTab === 0 
                    ? 'Upload P&ID drawings for error detection and processing. Files will be processed for analysis and annotations.'
                    : 'Upload reference documents, manuals, and training materials to help improve the AI model accuracy.'
                  }
                </p>
                
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
                  Drag and drop files here, or click the button below to browse
                </p>
                
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id={`file-upload-input-${activeTab}`}
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                />
                <label 
                  htmlFor={`file-upload-input-${activeTab}`} 
                  className={`inline-flex items-center px-6 py-3 rounded-lg cursor-pointer transition-colors font-medium ${
                    activeTab === 0 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {activeTab === 0 ? '📊 Browse P&ID Files' : '🤖 Browse Reference Documents'}
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileManagementPage;