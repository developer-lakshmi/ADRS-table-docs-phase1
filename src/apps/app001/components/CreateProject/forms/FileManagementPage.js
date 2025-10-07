import React, { useState } from "react";
import { Box } from "@mui/material";
import SubjectDocuments from "./SubjectDocuments";
import ReferenceDocuments from "./ReferenceDocuments";

const FileManagementPage = ({ projectId, onActiveTabChange }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    console.log(`Switching to tab: ${newValue} (${newValue === 0 ? 'Subject Documents' : 'Reference Documents'})`);
    setActiveTab(newValue);
    
    // Notify parent component about tab change
    if (onActiveTabChange) {
      onActiveTabChange(newValue);
    }
  };

  return (
    <div className="w-full max-w-full mx-auto 2xl:max-w-[1400px]">
      {/* Tab Headers */}
      <Box sx={{ borderBottom: 'none', mb: 1.5,ml:2.5 }}>
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => handleTabChange(null, 0)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              activeTab === 0
                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            📄 P & ID Documents
          </button>
          
          <button
            onClick={() => handleTabChange(null, 1)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              activeTab === 1
                ? 'bg-green-600 text-white shadow-md hover:bg-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            🤖 Reference Documents
          </button>
        </div>
      </Box>

      {/* Render the appropriate component based on active tab */}
      {activeTab === 0 ? (
        <SubjectDocuments projectId={projectId} />
      ) : (
        <ReferenceDocuments projectId={projectId} />
      )}
    </div>
  );
};

export default FileManagementPage;