import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Topbar from "../../../../components/common/Topbar";
import { useSelector, useDispatch } from "react-redux";
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  FileText, 
  Image as ImageIcon, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2,
  RefreshCw 
} from "lucide-react";
import { fetchUploadedFiles } from "../../../../redux/slices/shared/fileUploadSlice";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import DocumentDataTable from "./DocumentDataTable";

/**
 * Unified Document Viewer Component
 * Handles both PDF and Image files with fullscreen support
 */
const UnifiedDocumentViewer = ({ fileUrl, fileName, fileType, fileExtension }) => {
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const isPdf = fileExtension === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.3));
  const handleReset = () => setZoom(1);
  const handleFullscreen = () => setIsFullscreen(f => !f);

  // PDF.js integration
  useEffect(() => {
    if (isPdf && fileUrl) {
      const loadPdf = async () => {
        setLoading(true);
        try {
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
          
          const pdf = await pdfjsLib.getDocument(fileUrl).promise;
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
        } catch (error) {
          console.error('Error loading PDF:', error);
        } finally {
          setLoading(false);
        }
      };
      loadPdf();
    }
  }, [isPdf, fileUrl]);

  // Render PDF page
  useEffect(() => {
    if (pdfDoc && canvasRef.current) {
      const renderPage = async () => {
        try {
          const page = await pdfDoc.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1 });
          
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
        } catch (error) {
          console.error('Error rendering PDF page:', error);
        }
      };
      renderPage();
    }
  }, [pdfDoc, pageNumber]);

  const renderPdfViewer = () => (
    <div className="flex flex-col h-full">
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPageNumber(p => Math.max(p - 1, 1))}
            disabled={pageNumber <= 1}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span className="text-xs font-medium">
            {pageNumber} / {numPages}
          </span>
          <button
            onClick={() => setPageNumber(p => Math.min(p + 1, numPages))}
            disabled={pageNumber >= numPages}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="flex items-center space-x-1">
          <Tooltip title="Zoom Out">
            <button onClick={handleZoomOut} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
              <ZoomOut size={14} />
            </button>
          </Tooltip>
          <span className="text-xs font-medium min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
          <Tooltip title="Zoom In">
            <button onClick={handleZoomIn} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
              <ZoomIn size={14} />
            </button>
          </Tooltip>
          <Tooltip title="Reset Zoom">
            <button onClick={handleReset} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
              <RefreshCw size={14} />
            </button>
          </Tooltip>
          <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            <button onClick={handleFullscreen} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </Tooltip>
        </div>
      </div>
      
      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center">
            <CircularProgress size={30} />
            <div className="mt-2 text-sm text-gray-600">Loading PDF...</div>
          </div>
        ) : (
          <canvas 
            ref={canvasRef}
            className="max-w-full max-h-full shadow-lg border border-gray-300"
            style={{ 
              transform: `scale(${zoom})`,
              transformOrigin: 'center',
              transition: 'transform 0.2s ease-in-out'
            }}
          />
        )}
      </div>
    </div>
  );

  const renderImageViewer = () => (
    <div className="flex flex-col h-full">
      {/* Image Controls */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        <div className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[150px]">
          {fileName}
        </div>
        <div className="flex items-center space-x-1">
          <Tooltip title="Zoom Out">
            <button onClick={handleZoomOut} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
              <ZoomOut size={14} />
            </button>
          </Tooltip>
          <span className="text-xs font-medium min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
          <Tooltip title="Zoom In">
            <button onClick={handleZoomIn} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
              <ZoomIn size={14} />
            </button>
          </Tooltip>
          <Tooltip title="Reset Zoom">
            <button onClick={handleReset} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
              <RefreshCw size={14} />
            </button>
          </Tooltip>
          <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            <button onClick={handleFullscreen} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </Tooltip>
        </div>
      </div>
      
      {/* Image Display */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-2">
        <img
          src={fileUrl}
          alt={fileName}
          className="max-w-full max-h-full object-contain shadow-lg border border-gray-300"
          style={{ 
            transform: `scale(${zoom})`, 
            transformOrigin: 'center',
            transition: 'transform 0.2s ease-in-out'
          }}
          onError={(e) => {
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDNWMjFIMTNWMTlIMTlWNUg1VjE5SDExVjIxSDNWM0gyMVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTEzIDEzVjE5SDE5VjEzSDEzWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
          }}
        />
      </div>
    </div>
  );

  // Fullscreen modal
  const FullscreenModal = () => (
    <div className="fixed inset-0 z-[60] bg-black bg-opacity-95 flex items-center justify-center">
      <div className="w-full h-full flex flex-col">
        {/* Fullscreen header */}
        <div className="flex items-center justify-between p-4 bg-black bg-opacity-70 text-white">
          <div className="text-lg font-medium truncate max-w-[60%]">{fileName}</div>
          <button
            onClick={handleFullscreen}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            <Minimize2 size={20} />
          </button>
        </div>
        
        {/* Fullscreen content */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4">
          {isPdf ? (
            <canvas 
              ref={canvasRef}
              className="max-w-full max-h-full shadow-2xl"
              style={{ 
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                transition: 'transform 0.2s ease-in-out'
              }}
            />
          ) : (
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-full object-contain shadow-2xl"
              style={{ 
                transform: `scale(${zoom})`, 
                transformOrigin: 'center',
                transition: 'transform 0.2s ease-in-out'
              }}
            />
          )}
        </div>
        
        {/* Fullscreen controls */}
        <div className="flex items-center justify-center p-4 bg-black bg-opacity-70 space-x-4">
          <button 
            onClick={handleZoomOut} 
            className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-white font-medium min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button 
            onClick={handleZoomIn} 
            className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
          >
            <ZoomIn size={20} />
          </button>
          <button 
            onClick={handleReset} 
            className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
          >
            <RefreshCw size={20} />
          </button>
          {isPdf && (
            <>
              <div className="w-px h-6 bg-gray-600 mx-2"></div>
              <button
                onClick={() => setPageNumber(p => Math.max(p - 1, 1))}
                disabled={pageNumber <= 1}
                className="px-3 py-2 text-white bg-blue-600 rounded disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <span className="text-white font-medium">
                {pageNumber} / {numPages}
              </span>
              <button
                onClick={() => setPageNumber(p => Math.min(p + 1, numPages))}
                disabled={pageNumber >= numPages}
                className="px-3 py-2 text-white bg-blue-600 rounded disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="h-full">
      {isPdf ? renderPdfViewer() : isImage ? renderImageViewer() : (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <FileText size={48} className="mb-4" />
          <div className="text-center">
            <div className="font-medium">Unsupported file type</div>
            <div className="text-sm mt-1">File: {fileName}</div>
          </div>
        </div>
      )}
      
      {isFullscreen && <FullscreenModal />}
    </div>
  );
};

/**
 * Main Document Viewer Page Component
 * Layout: 12-column grid system
 * - 4 columns: Document preview 
 * - 8 columns: Data table
 */
const DocViewPage = () => {
  const navigate = useNavigate();
  const { id: appId, projectId, docId } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const fileId = location.state?.fileId || docId;
  const files = useSelector((state) => state.fileManagement.files);
  const filesLoading = useSelector((state) => state.fileManagement.loading);

  const file = files.find(f => f.id === fileId || f.id.startsWith(docId));
  const fileExtension = file?.name.split('.').pop().toLowerCase();
  const fileUrl = file?.url || "";

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

  useEffect(() => {
    if ((!files || files.length === 0) && projectId) {
      dispatch(fetchUploadedFiles(projectId));
    }
  }, [dispatch, files, projectId]);

  // Get file type icon
  const getFileTypeIcon = () => {
    if (!file?.name) return <FileText size={16} className="mr-1" />;
    
    const extension = file.name.split('.').pop().toLowerCase();
    const isPdf = extension === 'pdf';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension);
    
    if (isPdf) return <FileText size={16} className="mr-1" />;
    if (isImage) return <ImageIcon size={16} className="mr-1" />;
    return <FileText size={16} className="mr-1" />;
  };

  return (
    <div className="relative h-screen">
      {/* Fixed Topbar */}
      <div className="fixed top-14 left-0 right-0 z-40 bg-[#f8f9fa] dark:bg-darkTheme border-b border-[#dee2e6] dark:border-gray-700">
        <Topbar
          leftContent={
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button className="flex items-center mr-1 sm:mr-2" onClick={handleBackToTable}>
                <ArrowLeft size={20} className="sm:mr-2" />
                <h2 className="text-lg sm:text-xl hidden sm:block">Document Viewer</h2>
                <h2 className="text-sm block sm:hidden">Doc Viewer</h2>
              </button>
              {file && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 ml-4">
                  {getFileTypeIcon()}
                  <span className="hidden sm:inline">{file.name}</span>
                  <span className="sm:hidden">{file.name.substring(0, 20)}...</span>
                </div>
              )}
            </div>
          }
          rightContent={
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                className="flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handleDownload}
                disabled={!file}
              >
                <Download size={14} className="mr-1" />
                <span className="hidden sm:inline">Download</span>
              </button>
            </div>
          }
        />
      </div>

      {/* Content Below Topbar */}
      <div className="pt-14 h-full">
        {/* 12 Column Grid Layout: 4 columns for doc viewer, 8 for table */}
        <div className="grid grid-cols-12 gap-4 h-full p-4">
          {/* Document Viewer - 4 columns */}
          <div className="col-span-12 lg:col-span-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                <Eye size={20} className="mr-2" />
                Document Preview
              </h3>
            </div>
            <div className="h-full overflow-hidden" style={{ height: 'calc(100% - 60px)' }}>
              {filesLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <CircularProgress color="primary" size={40} />
                  <div className="mt-4 text-gray-600">Loading document...</div>
                </div>
              ) : file && file.name ? (
                <UnifiedDocumentViewer 
                  fileUrl={fileUrl}
                  fileName={file.name}
                  fileType={file.type}
                  fileExtension={fileExtension}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <FileText size={48} className="mb-4" />
                  <div>No document found</div>
                </div>
              )}
            </div>
          </div>

          {/* Data Table - 8 columns */}
          <div className="col-span-12 lg:col-span-8">
            <DocumentDataTable />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocViewPage;