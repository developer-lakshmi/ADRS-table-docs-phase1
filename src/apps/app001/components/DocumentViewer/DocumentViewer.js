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
  RefreshCw,
  Printer,
  FileSpreadsheet,
  FileDown
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

  // Close fullscreen on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    
    if (isFullscreen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen]);

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
          const viewport = page.getViewport({ scale: 1.5 }); // Increased default scale
          
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
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPageNumber(p => Math.max(p - 1, 1))}
            disabled={pageNumber <= 1}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            Prev
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">
            {pageNumber} / {numPages}
          </span>
          <button
            onClick={() => setPageNumber(p => Math.min(p + 1, numPages))}
            disabled={pageNumber >= numPages}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            Next
          </button>
        </div>
        <div className="flex items-center space-x-1">
          <Tooltip title="Zoom Out">
            <button onClick={handleZoomOut} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
              <ZoomOut size={16} />
            </button>
          </Tooltip>
          <span className="text-sm font-medium min-w-[50px] text-center text-gray-700 dark:text-gray-300">
            {Math.round(zoom * 100)}%
          </span>
          <Tooltip title="Zoom In">
            <button onClick={handleZoomIn} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
              <ZoomIn size={16} />
            </button>
          </Tooltip>
          <Tooltip title="Reset Zoom">
            <button onClick={handleReset} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
              <RefreshCw size={16} />
            </button>
          </Tooltip>
          <Tooltip title="Fullscreen">
            <button onClick={handleFullscreen} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
              <Maximize2 size={16} />
            </button>
          </Tooltip>
        </div>
      </div>
      
      {/* PDF Canvas Container */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 p-4">
        <div className="flex items-center justify-center min-h-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center">
              <CircularProgress size={40} />
              <div className="mt-4 text-gray-600 dark:text-gray-400">Loading PDF...</div>
            </div>
          ) : (
            <canvas 
              ref={canvasRef}
              className="shadow-lg border border-gray-300 dark:border-gray-600 bg-white max-w-full max-h-full"
              style={{ 
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                transition: 'transform 0.2s ease-in-out'
              }}
            />
          )}
        </div>
      </div>
    </div>
  );

  const renderImageViewer = () => (
    <div className="flex flex-col h-full">
      {/* Image Controls */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex-shrink-0">
        <div className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[60%]">
          {fileName}
        </div>
        <div className="flex items-center space-x-1">
          <Tooltip title="Zoom Out">
            <button onClick={handleZoomOut} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
              <ZoomOut size={16} />
            </button>
          </Tooltip>
          <span className="text-sm font-medium min-w-[50px] text-center text-gray-700 dark:text-gray-300">
            {Math.round(zoom * 100)}%
          </span>
          <Tooltip title="Zoom In">
            <button onClick={handleZoomIn} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
              <ZoomIn size={16} />
            </button>
          </Tooltip>
          <Tooltip title="Reset Zoom">
            <button onClick={handleReset} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
              <RefreshCw size={16} />
            </button>
          </Tooltip>
          <Tooltip title="Fullscreen">
            <button onClick={handleFullscreen} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
              <Maximize2 size={16} />
            </button>
          </Tooltip>
        </div>
      </div>
      
      {/* Image Container */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 p-4">
        <div className="flex items-center justify-center min-h-full">
          <img
            src={fileUrl}
            alt={fileName}
            className="shadow-lg border border-gray-300 dark:border-gray-600 max-w-full max-h-full object-contain"
            style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: 'center',
              transition: 'transform 0.2s ease-in-out'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = `
                <div class="flex flex-col items-center justify-center p-8 text-gray-500">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21,15 16,10 5,21"/>
                  </svg>
                  <div class="mt-2 text-sm">Failed to load image</div>
                </div>
              `;
            }}
          />
        </div>
      </div>
    </div>
  );

  // Fullscreen modal - Fixed positioning and z-index
  const FullscreenModal = () => (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Fullscreen header */}
      <div className="flex items-center justify-between p-4 bg-black text-white border-b border-gray-700 flex-shrink-0">
        <div className="text-lg font-medium truncate max-w-[70%]">{fileName}</div>
        <button
          onClick={handleFullscreen}
          className="p-2 hover:bg-gray-800 rounded transition-colors"
        >
          <Minimize2 size={20} className="text-white" />
        </button>
      </div>
      
      {/* Fullscreen content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-black">
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
      <div className="flex items-center justify-center p-4 bg-black border-t border-gray-700 space-x-4 flex-shrink-0">
        <button 
          onClick={handleZoomOut} 
          className="p-3 text-white hover:bg-gray-800 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={20} />
        </button>
        <span className="text-white font-medium min-w-[80px] text-center text-lg">
          {Math.round(zoom * 100)}%
        </span>
        <button 
          onClick={handleZoomIn} 
          className="p-3 text-white hover:bg-gray-800 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={20} />
        </button>
        <button 
          onClick={handleReset} 
          className="p-3 text-white hover:bg-gray-800 rounded transition-colors"
          title="Reset Zoom"
        >
          <RefreshCw size={20} />
        </button>
        {isPdf && (
          <>
            <div className="w-px h-8 bg-gray-600 mx-4"></div>
            <button
              onClick={() => setPageNumber(p => Math.max(p - 1, 1))}
              disabled={pageNumber <= 1}
              className="px-4 py-2 text-white bg-blue-600 rounded disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors hover:bg-blue-700"
            >
              Prev
            </button>
            <span className="text-white font-medium text-lg">
              {pageNumber} / {numPages}
            </span>
            <button
              onClick={() => setPageNumber(p => Math.min(p + 1, numPages))}
              disabled={pageNumber >= numPages}
              className="px-4 py-2 text-white bg-blue-600 rounded disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors hover:bg-blue-700"
            >
              Next
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div ref={containerRef} className="h-full">
        {isPdf ? renderPdfViewer() : isImage ? renderImageViewer() : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <FileText size={48} className="mb-4" />
            <div className="text-center">
              <div className="font-medium">Unsupported file type</div>
              <div className="text-sm mt-1">File: {fileName}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Render fullscreen modal using React Portal */}
      {isFullscreen && (
        <div>
          <FullscreenModal />
        </div>
      )}
    </>
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
  const documentDataTableRef = useRef(null); // Add ref for table component

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

  // New function to handle table data export
  const handleExportTableData = (format) => {
    if (documentDataTableRef.current) {
      documentDataTableRef.current.exportData(format);
    }
  };

  // New function to handle table print
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

  // Define the COMPLETE API response data with all 24 rows
  const apiResponseData = `<!doctype html>
<html>
<head>
<title>Analysis Result</title>
</head>
<body>
    <table border="1" cellpadding="4" cellspacing="0">
  <thead>
    <tr>
      <th>p&id number</th>
      <th>issue found</th>
      <th>action required</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 1) Drawing is issued for construction (Rev. 1, 01-Oct-2024) but still carries HOLD notes: "Air cooler details will be updated once vendor details are received" and "Control valve size to be confirmed by vendor". IFC with open HOLDs is inconsistent with EDDR control.</td>
      <td>Close the HOLDs prior to IFC or reissue as IFI; attach the vendor air cooler datasheet and finalized CV sizing sheet referenced in EDDR.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 1) Unable to confirm drawing number/revision/project/client against EDDR because EDDR reference number is not quoted on the title block.</td>
      <td>Add the controlling EDDR/Document register reference to the title block and verify number and revision alignment.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 2) Cross-reference to MP Flare Header: P&ID "Drawing Reference" lists MP Flare Header P16093.16.39.08.1605, whereas the line list and vent header tie-ins for this sheet reference 30"-VG-0091 on P&ID 16-39-08-1603-1.</td>
      <td>Verify the correct downstream P&ID number for the MP Flare/Vent Gas header (1603 vs 1605) and correct on this sheet and in the line list so both match.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 2) Closed drain interface: "Drawing Reference" cites Closed Drain Collection P16093.16.01.08.1731, but cooler drains here tie into lines such as 4"-D-5710/4"-D-6137/6"-D-5979 which the line list places on other P&IDs (1681/1682/1691). Cross-sheet numbering is inconsistent.</td>
      <td>Confirm which Closed Drain P&ID governs the header connected to D-5710/D-6137/D-5979, and align the "Drawing Reference" and off-sheet callouts accordingly.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 3) Tagging standard reference: tags generally follow AGES format (e.g., E-3610-01), but actuator tags on isolation valves are shown as XVSA/XVSD without service function suffixes (e.g., XV-FO/XV-FC) as required by AGES-GL-08-005 Rev B4 to reflect failsafe position.</td>
      <td>Update valve tags per AGES-GL-08-005 Rev B4 to include function/failsafe suffixes (FO/FC) on all actuated valves.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 4) Equipment list used for cross-check is Telecom Equipment List (P16093-30-99-11-1635); it does not contain process equipment E-3610-01, instruments or valves from this sheet.</td>
      <td>Provide the Process Equipment List/Instrument Index for U-3610 and recheck all equipment tag attributes against it.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 5) Nozzle mapping incomplete on drawing vs line list: only cooler nozzles N1E/N1F/N2E/N2F are traced to line numbers in the line list; header box nozzles N1(A–D)/N2(A–D)/N3(A–B)/N4(A–B) shown on the P&ID are not mapped to line numbers/specs.</td>
      <td>Issue a nozzle schedule for E‑3610‑01 tying every nozzle ID to a line number, size, rating and spec, and update the P&ID off-sheet callouts to match the line list.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 6) Control valve manifold sizing not finalized: Note "Control valve size to be confirmed by vendor" remains open for the air cooler bypass TCV (TCV‑3610‑06A/06B). Isolation/bypass valves around the TCV are shown but not sized against AGES-GL-08-005 Rev B4.</td>
      <td>Freeze TCV, isolation and bypass valve sizes to comply with AGES‑GL‑08‑005 Rev B4 (normally isolation valves = line size; bypass sized for control range), and revise the line list and P&ID accordingly.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 7) Failsafe positions are not indicated for actuated valves: TCV‑3610‑06A/06B and the actuated block valves (XVSA/XVSD around the bypass/anti‑surge circuitry) have no FO/FC/FL designation.</td>
      <td>Add fail positions (FO/FC/FL) on symbol/balloons and in the valve list consistent with the shutdown cause & effect and instrument index.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 8) Spectacle blind positions not stated. Spectacle blind symbol (e.g., near SP‑4008) lacks the "INSTALLED – SPACER/SPA DE" position or normal position note.</td>
      <td>Show position (SPACER IN/BLIND IN) and normal operating position on each spectacle blind per piping spec and AGES legend.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 9) Thermowell connection sizes not specified for TI/TIT points on this sheet. AGES‑PH‑04‑001 Rev‑1 Table 14.1 requires minimum 1‑1/2" RF Flg process connections for thermowells.</td>
      <td>Annotate thermowell process connection sizes (min 1‑1/2" RF Flg to piping) on the P&ID/instrument index and ensure nozzle/tapping adequacy.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 9) Thermowell installation location: Note 18 requires thermowells ≥30D downstream of mixing points; drawing shows thermowell tags but not distances or mixing points; compliance cannot be verified.</td>
      <td>Confirm on layout/isometrics the 30D requirement and add a construction note or typical detail ensuring compliance for TI/TIT at cooler inlet/outlet.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 10) Line serial consistency vs service: 12"-PG-5064 is shown as PP (plant piping) spec on the line list, while upstream/downstream main run is 16"-PG‑5061/5065 (metallic). The reduction and spec break around the bypass/TCV are not explicitly called out on the P&ID.</td>
      <td>Show reducers/spec breaks and confirm service continuity; ensure all reduced branches (e.g., 12" bypass vs 16" main) carry unique line numbers consistent with the line list.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 11) TI-3610-08 referenced in Note 16 (low temperature alarm) is not visible on this sheet (only TI/TIT tags 06A, 06B, 07, 09 are shown). This creates a tag mismatch across documents.</td>
      <td>Add TI‑3610‑08 to the drawing at the cooler outlet (or correct the note to the actual instrument tag providing the alarm) and align with Alarm/Trip Summary.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 11) Some drain branches on the P&ID show "NC" valve status but the corresponding line list items (e.g., 2"-D‑5714, 2"-D‑5709) do not state normally closed service; operating position mismatches may occur.</td>
      <td>Reconcile normal valve positions between the P&ID and the line list/operating philosophy; add NV (normally closed/open) to the valve list.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 12) No explicit flow direction arrow is shown on any check/non‑return valve in the cooler drain/vent tie‑ins (if NRVs are installed); direction cannot be verified from symbols.</td>
      <td>For each NRV on D/V lines (if applicable), show the arrow on the symbol and confirm direction from equipment to header to prevent backflow.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 13) Several general notes are vague or incomplete for construction use: Note 20 "Reverse acting valves" is stated without identifying which valve tags; Note 15/17 duplicated; multiple notes marked "DELETED" still present.</td>
      <td>Clarify which valves are reverse‑acting (list tags), remove deleted/duplicate notes, and align the note numbering with the legend standard.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 13) Note 10 "Air cooler having manual louvers independent per bundle" – louvers are not represented or tagged on the P&ID; maintainability/position not captured.</td>
      <td>Add louver symbols/tags (manual) per bundle or state "by vendor – not shown on P&ID" and reference vendor drawing number in the notes.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 14) Temperature alarm/trip settings on this sheet (H 67°C, HH 70°C; L 20°C at outlet; "HH 0.29 barg" on some loops) are not cross‑referenced to the Alarm & Trip Summary document number; values cannot be validated.</td>
      <td>Reference the Alarm & Trip Summary document number/revision on the P&ID and reconcile all set points (H/HH/L) to that document.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Checks 2 & 11) Off‑sheet arrows "TO 2ND STAGE SUCTION DRUM V‑3610‑02" and "FROM 1ST STAGE COMP K‑3610‑01" are present; ensure the exact receiving line numbers (e.g., 16"-PG‑5065 to V‑3610‑02) are printed at the arrows. Present drawing shows destination equipment but in places omits the receiving line number.</td>
      <td>Add the corresponding line numbers/specs at every off‑sheet arrow so they match the 1680/1682 P&IDs and the line list.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 7) Anti‑surge/ESD valves (XV tags shown adjacent to the anti‑surge line) lack indication of instrument air fail action and energy source (EA/ESD solenoid ref.).</td>
      <td>Show actuator type and energy (air/spring/electric), solenoid reference, and failsafe action for each XV associated with anti‑surge protection.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 5) Air cooler internal features (bundles, header boxes) are by vendor; no internal drain/vent nozzles are shown here for maintenance. For two‑phase service (Note 12), dedicated high-point vent and low-point drain nozzles should be confirmed.</td>
      <td>Confirm with vendor datasheet that cooler has adequate vent/drain nozzles; add them on the P&ID with line numbers to vent/closed drain headers.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Check 6) Bypass manifold around E‑3610‑01 shows reducers (e.g., 12"×8") but the isolation valves on either side of the TCV are not clearly sized; AGES requires equal to line size unless justified.</td>
      <td>Annotate valve sizes for the two block valves and the bypass around TCV‑3610‑06 and confirm compliance to AGES‑GL‑08‑005 Rev B4.</td>
    </tr>
    <tr>
      <td>16-01-08-1681-1</td>
      <td>(Checks 10 & 11) Vent lines 2"-V‑4571/2"-V‑4551/2"-V‑4553 are shown converging; ensure the combined header segment has its own unique line number. Current sheet does not show a new line number at the tie‑in.</td>
      <td>Apply a new serial for the combined section to flare per line numbering practice and update in the line list.</td>
    </tr>
  </tbody>
</table>
    <br>
<a href="/">Back</a>
</body>
</html>`;

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
              {/* Document Download */}
              <Tooltip title="Download Document">
                <button
                  className="flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  onClick={handleDownload}
                  disabled={!file}
                >
                  <Download size={14} className="mr-1" />
                  <span className="hidden sm:inline">Document</span>
                </button>
              </Tooltip>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

              {/* Print Table */}
              <Tooltip title="Print Table">
                <button
                  className="flex items-center px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                  onClick={handlePrintTable}
                >
                  <Printer size={14} className="mr-1" />
                  <span className="hidden sm:inline">Print</span>
                </button>
              </Tooltip>

              {/* Export as Excel */}
              <Tooltip title="Export as Excel">
                <button
                  className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                  onClick={() => handleExportTableData('excel')}
                >
                  <FileSpreadsheet size={14} className="mr-1" />
                  <span className="hidden sm:inline">Excel</span>
                </button>
              </Tooltip>

              {/* Export as PDF */}
              <Tooltip title="Export as PDF">
                <button
                  className="flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                  onClick={() => handleExportTableData('pdf')}
                >
                  <FileText size={14} className="mr-1" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
              </Tooltip>
            </div>
          }
        />
      </div>

      {/* Content Below Topbar */}
      <div className="pt-14 h-full">
        <div className="grid grid-cols-12 gap-4 h-full p-4">
          {/* Document Viewer - 4 columns */}
          <div className="col-span-12 lg:col-span-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col">
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
              ) : file && file.name ? (
                <UnifiedDocumentViewer 
                  fileUrl={fileUrl}
                  fileName={file.name}
                  fileType={file.type}
                  fileExtension={fileExtension}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <FileText size={48} className="mb-4" />
                  <div>No document found</div>
                </div>
              )}
            </div>
          </div>

          {/* Data Table - 8 columns */}
          <DocumentDataTable 
            ref={documentDataTableRef} // Add ref to access export methods
            htmlData={apiResponseData}
            title="P&ID Analysis Results"
            subtitle="Complete analysis from uploaded document"
            useHtmlData={true}
          />
        </div>
      </div>
    </div>
  );
};

export default DocViewPage;