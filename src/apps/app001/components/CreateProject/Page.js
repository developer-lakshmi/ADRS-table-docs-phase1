import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { fetchProjects, removeProject } from "../../../../redux/slices/create-projects/projectsSlice";
import { addFiles, fetchUploadedFiles, overwriteFilesInDB, saveNewFilesToDB } from "../../../../redux/slices/shared/fileUploadSlice";
import { showNotification } from "../../../../redux/slices/notification/notificationSlice";
import Topbar from "../../../../components/common/Topbar";
import { Plus, Upload, ArrowLeft, CpuIcon, ViewIcon, Pencil, Trash2 } from "lucide-react";
import { Button } from "@mui/material";
import FileManagementPage from "./forms/FileManagementPage";

import { clearSelectedFiles } from "../../../../redux/slices/file-upload/fileSelectionSlice";
import ProjectDashboard from "./ProjectDashboard";
import LoadingOverlay from "../../../../components/Loader/LoadingOverlay";
import { setFileStatuses } from "../../../../redux/slices/file-upload/fileStatusSlice";
import Tooltip from "@mui/material/Tooltip";
import { BaseModal } from "../../../../components/ui";

const CreateProjectPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const projects = useSelector((state) => state.projects.items);
  const loading = useSelector((state) => state.projects.loading);
  const appId = useSelector((state) => state.app.appId);
  const applications = useSelector((state) => state.app.applications);
  const applicationName = applications.find((app) => app.appId === appId)?.name || "No Application Found";
  const uploadedFiles = useSelector((state) => state.fileManagement.files || []);
  const [activeProjectId, setActiveProjectId] = useState(projectId || null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // Add this line
  const isSubSidebarOpen = useSelector((state) => state.sidebar.isSubSidebarOpen);
  const isSidebarOpen = useSelector((state) => state.sidebar.isSidebarOpen);
  const selectedFiles = useSelector((state) => state.fileSelection.selectedFiles || []);
  const fileStatuses = useSelector((state) => state.fileStatus);
  const iconButtonClass = "p-2 rounded text-white transition-colors";

  // Add state to track active tab:
  const [activeTab, setActiveTab] = useState(0); // 0 for P&ID, 1 for Reference

  const sidebarWidth = isSidebarOpen ? 150 : 32;
  const subSidebarWidth = isSubSidebarOpen ? 150 : 0;
  const isMobileSidebarOpen = useSelector((state) => state.sidebar.isMobileSidebarOpen);

  let topbarTop = "3.5rem";
  let contentPaddingTop = "56px";

  if (isMobileSidebarOpen && isSubSidebarOpen) {
    topbarTop = "13.5rem";
    contentPaddingTop = "216px";
  } else if (isMobileSidebarOpen) {
    topbarTop = "7.5rem";
    contentPaddingTop = "104px";
  }

  useEffect(() => {
    const fetchData = async () => {
      await dispatch(fetchProjects());
      setInitialLoading(false); // Set to false after first fetch
      if (activeProjectId) {
        dispatch(fetchUploadedFiles(activeProjectId));
      }
    };
    
    fetchData();
  }, [dispatch, activeProjectId]);

  useEffect(() => {
    setActiveProjectId(projectId || null);
  }, [projectId]);

  const handleCreateProject = () => {
    const uniqueId = Math.random().toString(36).substr(2, 9);
    navigate(`/app/${appId}/dashboard/newprojectid/${uniqueId}`);
  };

  const handleDelete = (id) => {
    dispatch(removeProject(id));
  };

  const handleStart = (id) => {
    dispatch(clearSelectedFiles());
    navigate(`/app/${appId}/dashboard/project/${id}`);
  };

  const handleBackToDashboard = () => {
    navigate(`/app/${appId}/dashboard`);
    setActiveProjectId(null);
  };

  // Updated handleFileUpload to use direct server upload with category
  const handleFileUpload = (uploadedFiles) => {
    if (!uploadedFiles || uploadedFiles.length === 0) {
      dispatch(showNotification({ message: "No files selected for upload.", type: "info" }));
      return;
    }

    // Determine category based on active tab
    const category = activeTab === 0 ? 'pid' : 'reference';
    
    console.log(`=== Modal Upload Debug ===`);
    console.log(`Active Tab: ${activeTab}`);
    console.log(`Category determined: ${category}`);
    console.log(`Files:`, uploadedFiles.map(f => f.name));

    // Create FormData and send directly to server
    const formData = new FormData();
    uploadedFiles.forEach(file => {
      formData.append('files', file);
    });
    formData.append('projectId', activeProjectId);
    formData.append('category', category);

    // Send directly to server
    fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(result => {
      console.log('Modal upload success:', result);
      
      // Close modal first
      setIsUploadModalOpen(false);
      
      // Show success notification
      dispatch(showNotification({
        message: `${uploadedFiles.length} ${category === 'pid' ? 'P&ID' : 'reference'} file(s) uploaded successfully.`,
        type: "success"
      }));
      
      // Refresh file list
      dispatch(fetchUploadedFiles(activeProjectId));
    })
    .catch(error => {
      console.error('Modal upload error:', error);
      
      // Close modal even on error
      setIsUploadModalOpen(false);
      
      // Show error notification
      dispatch(showNotification({
        message: "Failed to upload files to the server.",
        type: "error"
      }));
    });
  };

  const handleUploadFiles = () => {
    setIsUploadModalOpen(true);
  };

  const handleEdit = () => {
    if (selectedFiles.length === 1) {
      dispatch(showNotification({message:"Edit functionality not implemented yet.", type:"info"}));
    }
  };

  const handleDeleteFiles = () => {
    if (selectedFiles.length > 0) {
      const fileIds = selectedFiles.map(file => file.id);
      dispatch(overwriteFilesInDB(fileIds))
        .then(() => {
          dispatch(showNotification({message:`${selectedFiles.length} file(s) deleted successfully.`, type:"success"}));
          dispatch(clearSelectedFiles());
          dispatch(fetchUploadedFiles(activeProjectId));
        })
        .catch((error) => {
          dispatch(showNotification({message:"Failed to delete files.", type:"error"}));
          console.error("Error deleting files:", error);
        });
    }
  }; 

  const handleProcess = () => {
    if (selectedFiles.length > 0) {
      setProcessing(true);
      setTimeout(() => {
        const newStatuses = {};
        let successCount = 0;
        let failureCount = 0;
        selectedFiles.forEach(file => {
          const status = Math.random() > 0.5 ? "success" : "failure";
          newStatuses[file.id] = status;
          if (status === "success") successCount++;
          else failureCount++;
        });
        dispatch(setFileStatuses(newStatuses));
        setProcessing(false);

        let message = "";
        let type = "";

        if (selectedFiles.length === 1) {
          if (failureCount === 1) {
            message = "Processing failed.";
            type = "error";
          } else {
            message = "Processing complete for 1 file.";
            type = "success";
          }
        } else {
          if (failureCount > 0) {
            message = `Processing completed: ${successCount} succeeded, ${failureCount} failed.`;
            type = "info";
          } else {
            message = `Processing complete for ${successCount} file(s).`;
            type = "success";
          }
        }

        dispatch(showNotification({ message, type }));
        dispatch(clearSelectedFiles());
      }, 1500);
    }
  };

  const handleView = () => {
    if (
      selectedFiles.length === 1 &&
      fileStatuses[selectedFiles[0].id] === "success"
    ) {
      const file = uploadedFiles.find(f => f.id === selectedFiles[0].id);
      let cleanDocId = "";
      if (file && file.id) {
        const match = file.id.match(/^\d+/);
        cleanDocId = match ? match[0] : file.id;
      }
      navigate(`/app/${appId}/dashboard/project/${projectId}/view/${cleanDocId}`, {
        state: { projectId: activeProjectId, fileId: file.id }
      });
    } else {
      dispatch(
        showNotification({
          message:
            selectedFiles.length !== 1
              ? "Please select exactly one file to view."
              : "Only successfully processed files can be viewed.",
          type: "info",
        })
      );
    }
  };

  // Get the tab name for display in upload button
  const getTabDisplayName = () => {
    return activeTab === 0 ? 'P&ID' : 'Reference';
  };

  return (
    <div className="relative">
      {/* Fixed Topbar */}
      <div
        className="fixed max-sm:!left-0 md:left-8 right-0 z-40 bg-[#f8f9fa] dark:bg-darkTheme border-b border-[#dee2e6] dark:border-gray-700"
        style={{
          top: topbarTop,
          left: `${sidebarWidth + (isSubSidebarOpen ? 160 : 0)}px`,
          right: 0,
        }}
      >
        {activeProjectId === null ? (
          <Topbar
            leftContent={<h2 className="text-xl">{applicationName}</h2>}
            rightContent={
              <div className="flex items-center space-x-2" >
                <Button
                  onClick={handleCreateProject}
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<Plus fontSize="small" />}
                  sx={{ textTransform: "none" }}
                >
                  Create Project
                </Button>
              </div>
            }
          />
        ) : (
          <Topbar
            leftContent={
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button className="flex items-center mr-1 sm:mr-2" onClick={handleBackToDashboard}>
                  <ArrowLeft size={20} className="sm:mr-2" />
                  <h2 className="text-lg sm:text-xl hidden sm:block"> Uploaded Files</h2>
                  <h2 className="text-sm block sm:hidden"> Files</h2>
                </button>
              </div>
            }
            rightContent={
              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* Action buttons - responsive layout */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Tooltip title="Delete" arrow>
                    <span>
                      <button 
                        className={`${iconButtonClass} bg-red-500 hover:bg-red-600 ${selectedFiles.length === 0 ? "opacity-50 cursor-not-allowed" : ""} p-1.5 sm:p-2`}
                        onClick={handleDeleteFiles}
                        disabled={selectedFiles.length === 0}>
                        <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                      </button>
                    </span>
                  </Tooltip>

                  <Tooltip title="Process" arrow>
                    <span>
                      <button
                        className={`${iconButtonClass} bg-yellow-500 hover:bg-yellow-600 ${selectedFiles.length === 0 ? "opacity-50 cursor-not-allowed" : ""} p-1.5 sm:p-2`}
                        onClick={handleProcess}
                        disabled={selectedFiles.length === 0}>
                        <CpuIcon size={12} className="sm:w-3.5 sm:h-3.5" />
                      </button>
                    </span>
                  </Tooltip>

                  <Tooltip title="View" arrow>
                    <span>
                      <button
                        className={`${iconButtonClass} bg-green-500 hover:bg-green-600 ${selectedFiles.length !== 1 ? "opacity-50 cursor-not-allowed" : ""} p-1.5 sm:p-2`}
                        onClick={handleView}
                        disabled={selectedFiles.length !== 1}>
                        <ViewIcon size={12} className="sm:w-3.5 sm:h-3.5" />
                      </button>
                    </span>
                  </Tooltip>
                </div>

                {/* Updated Upload button with tab awareness */}
                <div className="flex items-center space-x-2">
                  {/* Tab indicator */}
                  {/* <div className="hidden sm:block text-xs">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activeTab === 0 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {activeTab === 0 ? '📊 P&ID' : '🤖 Reference'}
                    </span>
                  </div> */}

                  {/* Upload button */}
                  <Tooltip title={`Upload to ${getTabDisplayName()} tab`} arrow>
                    <Button
                      onClick={handleUploadFiles}
                      variant="contained"
                      color={activeTab === 0 ? "primary" : "success"}
                      size="small"
                      startIcon={<Upload size={16} className="hidden sm:inline" />}
                      sx={{ 
                        textTransform: "none",
                        minWidth: { xs: "auto", sm: "auto" },
                        px: { xs: 1, sm: 2 },
                        fontSize: { xs: "0.75rem", sm: "0.875rem" }
                      }}
                    >
                      <span className="hidden sm:inline">Upload {getTabDisplayName()}</span>
                      <span className="sm:hidden">
                        <Upload size={16} className="my-[0.75px]" />
                      </span>
                    </Button>
                  </Tooltip>
                </div>
              </div>
            }
          />
        )}
      </div>

      {/* Content Below Topbar */}
      <div
        className="transition-all duration-300 ease-in-out"
        style={{
          paddingTop: contentPaddingTop,
        }}
      >
        {activeProjectId === null ? (
          <ProjectDashboard
            projects={projects}
            loading={loading || initialLoading} // Use combined loading state
            handleStart={handleStart}
            handleDelete={handleDelete}
            appId={appId}
          />
        ) : (
          <div className="p-0 transition-all duration-300 ease-in-out">
            <FileManagementPage
              projectId={activeProjectId}
              onClose={() => setActiveProjectId(null)}
              fileStatuses={fileStatuses}
              setFileStatuses={setFileStatuses}
              onActiveTabChange={setActiveTab} // Pass the callback
            />
          </div>
        )}
      </div>
      
      {/* Updated Upload Modal with tab context */}
      {isUploadModalOpen && (
        <BaseModal
          message={`Upload ${getTabDisplayName()} Files`}
          onCancel={() => setIsUploadModalOpen(false)}
          onOk={(uploadedFiles) => handleFileUpload(uploadedFiles)}
          showFileUpload={true}
          uploadContext={{
            tabName: getTabDisplayName(),
            category: activeTab === 0 ? 'pid' : 'reference',
            tabIndex: activeTab
          }}
        />
      )}
      
      <LoadingOverlay show={processing} message="Processing files..." />
    </div>
  );
};

export default CreateProjectPage;