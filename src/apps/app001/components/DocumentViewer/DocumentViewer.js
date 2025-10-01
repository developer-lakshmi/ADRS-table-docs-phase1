import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Topbar from "../../../../components/common/Topbar";
import { useSelector, useDispatch } from "react-redux";
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  FileText, 
  FileSpreadsheet,
  Printer,
  ChevronDown
} from "lucide-react";
import { fetchUploadedFiles } from "../../../../redux/slices/shared/fileUploadSlice";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import DocumentDataTable from "./DocumentDataTable";
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

/**
 * Simple PDF Viewer Component using react-pdf-viewer
 */
const PdfViewer = ({ fileUrl, fileName }) => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  if (!fileUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <FileText size={48} className="mb-4" />
        <div className="text-center">
          <div className="font-medium">No PDF file available</div>
        </div>
      </div>
    );
  }

  return (
    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
      <div className="h-full w-full">
        <Viewer
          fileUrl={fileUrl}
          plugins={[defaultLayoutPluginInstance]}
        />
      </div>
    </Worker>
  );
};

/**
 * Export Dropdown Component
 */
const ExportDropdown = ({ onExport }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleExport = (format) => {
    onExport(format);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Download size={14} className="mr-1" />
        <span className="hidden sm:inline">Export</span>
        <ChevronDown size={14} className="ml-1" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="py-1">
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => handleExport('excel')}
            >
              <FileSpreadsheet size={16} className="mr-3 text-green-600" />
              Export as Excel
            </button>
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => handleExport('pdf')}
            >
              <FileText size={16} className="mr-3 text-red-600" />
              Export as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main Document Viewer Page Component
 * Layout: PDF viewer (4/12) and Data table (8/12)
 */
const DocViewPage = () => {
  const navigate = useNavigate();
  const { id: appId, projectId, docId } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const fileId = location.state?.fileId || docId;
  const files = useSelector((state) => state.fileManagement.files);
  const filesLoading = useSelector((state) => state.fileManagement.loading);
  const documentDataTableRef = useRef(null);

  const file = files.find(f => f.id === fileId || f.id.startsWith(docId));
  const fileExtension = file?.name.split('.').pop().toLowerCase();
  const fileUrl = file?.url || "";
  const isPdf = fileExtension === 'pdf';

  const handleBackToTable = () => {
    if (projectId) {
      navigate(`/app/${appId}/dashboard/project/${projectId}`);
    } else {
      navigate(`/app/${appId}/dashboard`);
    }
  };

  const handleDownload = async () => {
    if (!file) return;
    try {
      const response = await fetch(fileUrl, { mode: "cors" });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed:", e);
      alert("Failed to download file.");
    }
  };

  const handleExportTableData = (format) => {
    if (documentDataTableRef.current) {
      documentDataTableRef.current.exportData(format);
    }
  };

  const handlePrintTable = () => {
    if (documentDataTableRef.current) {
      documentDataTableRef.current.printTable();
    }
  };

  useEffect(() => {
    if ((!files || files.length === 0) && projectId) {
      dispatch(fetchUploadedFiles(projectId));
    }
  }, [dispatch, files, projectId]);

  return (
    <div className="relative h-screen">
      {/* Fixed Topbar */}
      <div className="fixed top-14 left-0 right-0 z-40 bg-[#f8f9fa] dark:bg-darkTheme border-b border-[#dee2e6] dark:border-gray-700">
        <Topbar
          leftContent={
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button className="flex items-center mr-1 sm:mr-2" onClick={handleBackToTable}>
                <ArrowLeft size={20} className="sm:mr-2" />
                <h2 className="text-lg sm:text-xl hidden sm:block">EDRS findings</h2>
                <h2 className="text-sm block sm:hidden">Doc Viewer</h2>
              </button>
              {/* {file && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 ml-4">
                  <FileText size={16} className="mr-1" />
                  <span className="hidden sm:inline">{file.name}</span>
                  <span className="sm:hidden">{file.name.substring(0, 20)}...</span>
                </div>
              )} */}
            </div>
          }
          rightContent={
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Print Table */}
              <Tooltip title="Print Analysis Table">
                <button
                  className="flex items-center px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                  onClick={handlePrintTable}
                >
                  <Printer size={14} className="mr-1" />
                  <span className="hidden sm:inline">Print</span>
                </button>
              </Tooltip>

              {/* Export Dropdown */}
              <Tooltip title="Export Analysis Results">
                <div>
                  <ExportDropdown onExport={handleExportTableData} />
                </div>
              </Tooltip>
            </div>
          }
        />
      </div>

      {/* Content Below Topbar */}
      <div className="pt-14 h-full">
        <div className="h-full p-4 flex gap-4">
          {/* Document Viewer - Fixed height to match table */}
          <div className="w-full lg:w-4/12 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                <Eye size={20} className="mr-2" />
                Document Preview
              </h3>
            </div>
            <div className="flex-1 overflow-hidden">
              {filesLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <CircularProgress color="primary" size={40} />
                  <div className="mt-4 text-gray-600 dark:text-gray-400">Loading document...</div>
                </div>
              ) : file && file.name && isPdf ? (
                <PdfViewer 
                  fileUrl={fileUrl}
                  fileName={file.name}
                />
              ) : file && !isPdf ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <FileText size={48} className="mb-4" />
                  <div className="text-center">
                    <div className="font-medium">Only PDF files supported</div>
                    <div className="text-sm mt-1">File: {file.name}</div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <FileText size={48} className="mb-4" />
                  <div>No document found</div>
                </div>
              )}
            </div>
          </div>

          {/* Data Table - Matching height with PDF viewer */}
          <div className="flex-1 min-w-0">
            <DocumentDataTable 
              ref={documentDataTableRef}
              title="P&ID Analysis Results"
              subtitle="Complete analysis from uploaded document"
              useHtmlData={true}
              useMockData={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocViewPage;