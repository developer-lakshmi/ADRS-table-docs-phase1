import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { Link } from "react-router-dom";
import { Button, Box, Tabs, Tab, IconButton } from "@mui/material";
import { CpuIcon, CheckCircle, AlertTriangle, XCircle, Hourglass } from "lucide-react";
import { setSelectedFiles } from "../../../../../redux/slices/file-upload/fileSelectionSlice";
import { showNotification } from "../../../../../redux/slices/notification/notificationSlice";
import { fetchUploadedFiles, saveNewFilesToDB } from "../../../../../redux/slices/shared/fileUploadSlice";
import { setFileStatuses } from "../../../../../redux/slices/file-upload/fileStatusSlice";
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

const SubjectDocuments = ({ projectId }) => {
  const dispatch = useDispatch();
  const files = useSelector((state) => state.fileManagement.files);
  const loading = useSelector((state) => state.fileManagement.loading);
  const fileStatuses = useSelector((state) => state.fileStatus);
  const appId = useSelector((state) => state.app.appId);
  const isSubSidebarOpen = useSelector((state) => state.sidebar.isSubSidebarOpen);
  const isMobileSidebarOpen = useSelector((state) => state.sidebar.isMobileSidebarOpen);

  const [processingFiles, setProcessingFiles] = useState(new Set());

  console.log("=== SubjectDocuments Debug ===");
  console.log("All files:", files);
  console.log("Files count:", files.length);

  // Filter files for P&ID (subject documents)
  const pidFiles = files.filter(file => {
    const isPid = file.category === 'pid' || !file.category;
    console.log(`File: ${file.name}, Category: ${file.category}, Is P&ID: ${isPid}`);
    return isPid;
  });

  console.log("P&ID Files:", pidFiles.length);

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

  const handleProcessSingleFile = (fileId, fileName) => {
    setProcessingFiles(prev => new Set([...prev, fileId]));
    
    setTimeout(() => {
      const status = Math.random() > 0.3 ? "success" : "failure";
      dispatch(setFileStatuses({ [fileId]: status }));
      setProcessingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });

      const message = status === "success" 
        ? `Processing complete for ${fileName}`
        : `Processing failed for ${fileName}`;
      const type = status === "success" ? "success" : "error";

      dispatch(showNotification({ message, type }));
    }, 2000);
  };

  // P&ID columns (with action and status columns)
  const pidColumns = [
    { 
      field: "serialNo", 
      headerName: "Serial No", 
      width: 120,
      flex: 0.3,
      minWidth: 100,
      maxWidth: 150,
      headerAlign: "center", 
      align: "center" 
    },
    {
      field: "name",
      headerName: "Drawing Title",
      flex: 1,
      minWidth: 280,
      maxWidth: 600,
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
      width: 120,
      flex: 0.3,
      minWidth: 100,
      maxWidth: 150,
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
      width: 120,
      flex: 0.3,
      minWidth: 100,
      maxWidth: 150,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "lastModified",
      headerName: "Last Modified",
      width: 150,
      flex: 0.4,
      minWidth: 130,
      maxWidth: 180,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "action",
      headerName: "Action",
      width: 120,
      flex: 0.3,
      minWidth: 100,
      maxWidth: 140,
      headerAlign: "center",
      align: "center",
      sortable: false,
      renderCell: (params) => {
        const isProcessing = processingFiles.has(params.row.id);
        const status = fileStatuses[params.row.id];
        const isSuccess = status === "success";
        const isApproved = status === "approved";
        const isNeedApprove = status === "need_approve";
        const hasFailed = status === "failure";
        const isNotProcessed = !status;
        
        let iconColor, backgroundColor, hoverColor, tooltipText, isClickable;
        
        if (isProcessing) {
          iconColor = "#f59e0b";
          backgroundColor = "#fef3c7";
          hoverColor = "#fef3c7";
          tooltipText = "Processing...";
          isClickable = false;
        } else if (isSuccess) {
          iconColor = "#22c55e";
          backgroundColor = "#dcfce7";
          hoverColor = "#dcfce7";
          tooltipText = "Successfully processed";
          isClickable = false;
        } else if (isApproved) {
          iconColor = "#0ea5e9";
          backgroundColor = "#dbeafe";
          hoverColor = "#dbeafe";
          tooltipText = "Approved";
          isClickable = false;
        } else if (isNeedApprove) {
          iconColor = "#f59e0b";
          backgroundColor = "#fef3c7";
          hoverColor = "#fef3c7";
          tooltipText = "Needs approval";
          isClickable = false;
        } else if (hasFailed) {
          iconColor = "#ef4444";
          backgroundColor = "#fecaca";
          hoverColor = "#fca5a5";
          tooltipText = "Processing failed - Click to retry";
          isClickable = true;
        } else {
          iconColor = "#f59e0b";
          backgroundColor = "#fef3c7";
          hoverColor = "#fed7aa";
          tooltipText = "Click to process file";
          isClickable = true;
        }
        
        return (
          <Tooltip title={tooltipText} arrow>
            <span>
              <IconButton
                onClick={() => {
                  if (isClickable && !isProcessing) {
                    handleProcessSingleFile(params.row.id, params.row.name);
                  }
                }}
                disabled={!isClickable || isProcessing}
                size="small"
                sx={{
                  backgroundColor: backgroundColor,
                  color: iconColor,
                  border: `1px solid ${iconColor}`,
                  "&:hover": {
                    backgroundColor: isClickable ? hoverColor : backgroundColor,
                    transform: isClickable && !isProcessing ? "scale(1.05)" : "none",
                    cursor: isClickable ? "pointer" : "default",
                  },
                  "&:disabled": {
                    backgroundColor: backgroundColor,
                    color: iconColor,
                    border: `1px solid ${iconColor}`,
                    opacity: isClickable ? 0.6 : 1,
                    cursor: "default",
                  },
                  width: 32,
                  height: 32,
                  transition: "all 0.2s ease-in-out",
                }}
              >
                {isProcessing ? (
                  <CircularProgress size={16} sx={{ color: iconColor }} />
                ) : (
                  <CpuIcon size={16} />
                )}
              </IconButton>
            </span>
          </Tooltip>
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      flex: 0.3,
      minWidth: 100,
      maxWidth: 140,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const status = fileStatuses[params.row.id];
        const isProcessing = processingFiles.has(params.row.id);
        
        if (isProcessing) {
          return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Tooltip title="Processing..." arrow>
                <div 
                  className="animate-spin"
                  style={{
                    animation: 'sand-timer 2s ease-in-out infinite alternate',
                    transformOrigin: 'center'
                  }}
                >
                  <Hourglass 
                    size={18} 
                    style={{ 
                      color: "#f59e0b",
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                    }}
                  />
                </div>
              </Tooltip>
            </div>
          );
        }
        
        let icon = null;
        let tooltipText = "Not processed";
        
        if (status === "success") {
          icon = <CheckCircle size={16} style={{ color: "#22c55e" }} />;
          tooltipText = "Successfully processed";
        } else if (status === "approved") {
          icon = <CheckCircle size={16} style={{ color: "#0ea5e9" }} />;
          tooltipText = "Approved";
        } else if (status === "need_approve") {
          icon = <AlertTriangle size={16} style={{ color: "#f59e0b" }} />;
          tooltipText = "Needs approval";
        } else if (status === "failure") {
          icon = <XCircle size={16} style={{ color: "#ef4444" }} />;
          tooltipText = "Processing failed";
        } else {
          icon = (
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#9ca3af",
                boxShadow: "0 1px 3px rgba(0,0,0,0.12)"
              }}
            />
          );
        }
        
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Tooltip title={tooltipText} arrow>
              <div style={{ cursor: "pointer" }}>
                {icon}
              </div>
            </Tooltip>
          </div>
        );
      }
    },
  ];

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const category = 'pid';
    
    console.log(`=== Subject Documents File Upload Debug ===`);
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
        message: `${newFiles.length} P&ID file(s) uploaded successfully.`, 
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
    const category = 'pid';
    
    console.log(`=== Subject Documents Drag & Drop Upload Debug ===`);
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
        message: `${newFiles.length} P&ID file(s) uploaded successfully.`, 
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
    const selectedRows = pidRows.filter((row) => selectedIds.includes(row.id));
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
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-blue-600 text-white shadow-md">
              📄 Subject Documents
            </div>
          </div> */}

          {/* File Table or Empty State */}
          {pidFiles.length > 0 ? (
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
                rows={pidRows}
                columns={pidColumns}
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
                    background: "#eff6ff",
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
                      background: "#dbeafe",
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
                  <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    📊 P&ID Processing
                  </div>
                </div>
                
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                  No P&ID files uploaded yet
                </p>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Upload P&ID drawings for error detection and processing. Files will be processed for analysis and annotations.
                </p>
                
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
                  Drag and drop files here, or click the button below to browse
                </p>
                
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="subject-file-upload-input"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                />
                <label 
                  htmlFor="subject-file-upload-input" 
                  className="inline-flex items-center px-6 py-3 rounded-lg cursor-pointer transition-colors font-medium shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
                >
                  📊 Browse P&ID Files
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubjectDocuments;