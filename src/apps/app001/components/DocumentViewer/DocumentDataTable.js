import React, { useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { DataGrid } from "@mui/x-data-grid";
import { Check, X, Edit3 } from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Document Data Table Component
 * Displays P&ID findings and issues extracted from documents
 * Features: Editable remarks, clickable approval buttons, export functionality
 */

// Function to parse HTML table data
const parseHtmlTableData = (htmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const rows = doc.querySelectorAll('tbody tr');
  
  return Array.from(rows).map((row, index) => {
    const cells = row.querySelectorAll('td');
    return {
      id: index + 1,
      pidNumber: cells[0]?.textContent?.trim() || '',
      issueFound: cells[1]?.textContent?.trim() || '',
      actionRequired: cells[2]?.textContent?.trim() || '',
      approval: 'Not', // Default approval status
      remark: '', // Default empty remark
      status: 'Pending' // Changed default status
    };
  });
};

// Updated HTML data from API response
const htmlString = `<!doctype html>
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

// Parse the HTML data
const parsedTableData = parseHtmlTableData(htmlString);

// Sample data matching your P&ID structure with approval status
const initialTableData = [
  { 
    id: 1, 
    pidNumber: "P16093-16-01-08-1684-1", 
    issueFound: "Thermowell for TIT-3610-14A shown with 2\" connection.", 
    actionRequired: "TIT tag no connection sizes are indicated as 2'' which are higher than the minimum specified size of 1.5'' as per 'AGES-PH-04-001, Rev-1, Table 14.1 instxxxxxxxx'. The selected size of 2'' is as per project Legend Drawings.", 
    approval: "Approved",
    remark: "", 
    status: "Approved" 
  },
  { 
    id: 2, 
    pidNumber: "P16093-16-01-08-1684-2", 
    issueFound: "Valve orientation incorrect in line 6\".", 
    actionRequired: "Verify valve orientation per P&ID standards and correct as needed.", 
    approval: "Ignored",
    remark: "Engineering review required for proper valve positioning and alignment with process flow requirements", 
    status: "Ignored" 
  },
  { 
    id: 3, 
    pidNumber: "P16093-16-01-08-1684-3", 
    issueFound: "Missing isolation valve upstream of equipment.", 
    actionRequired: "Add isolation valve as per process safety requirements.", 
    approval: "Ignored",
    remark: "Safety critical - requires immediate attention from design team and process safety review", 
    status: "Ignored" 
  },
  { 
    id: 4, 
    pidNumber: "P16093-16-01-08-1684-4", 
    issueFound: "Pipe routing crosses structural member.", 
    actionRequired: "Coordinate with structural team for clearance verification.", 
    approval: "Not",
    remark: "Under review by structural engineering team for clearance verification and potential routing modifications", 
    status: "Pending" 
  },
  { 
    id: 5, 
    pidNumber: "P16093-16-01-08-1684-5", 
    issueFound: "Instrument connection size mismatch.", 
    actionRequired: "Update instrument specification to match field requirements.", 
    approval: "Approved",
    remark: "", 
    status: "Approved" 
  },
];

const DocumentDataTable = forwardRef(({ 
  data = [], // Empty array by default to use parsed data
  title = "P&ID Analysis Results",
  subtitle = "Issues and actions identified from document analysis",
  useHtmlData = true, // New prop to control data source
  htmlData = null // Accept HTML data as prop
}, ref) => {
  // Use HTML data from props if provided, otherwise use default
  const htmlToUse = htmlData || htmlString;
  const parsedData = useMemo(() => parseHtmlTableData(htmlToUse), [htmlToUse]);
  
  // Fix: Use parsedData instead of initialTableData when useHtmlData is true
  const defaultData = useHtmlData ? parsedData : initialTableData;
  const [tableData, setTableData] = useState(data.length > 0 ? data : defaultData);
  const [editingRemark, setEditingRemark] = useState(null);
  const [remarkValue, setRemarkValue] = useState('');

  // Expose export and print methods to parent component
  useImperativeHandle(ref, () => ({
    exportData: (format) => {
      if (format === 'excel') {
        exportToExcel();
      } else if (format === 'csv') {
        exportToCSV();
      } else if (format === 'pdf') {
        exportToPDF();
      }
    },
    printTable: () => {
      handlePrint();
    }
  }));

  // Export to Excel function
  const exportToExcel = () => {
    try {
      const exportData = tableData.map(row => ({
        'P&ID Number': row.pidNumber,
        'Issue Found': row.issueFound,
        'Action Required': row.actionRequired,
        'Approval': row.approval,
        ...(row.approval !== 'Approved' && { 'Remark': row.remark }), // Only include remark if not approved
        'Status': row.status
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'P&ID Analysis');
      
      // Set column widths
      const colWidths = [
        { wch: 20 }, // P&ID Number
        { wch: 50 }, // Issue Found
        { wch: 50 }, // Action Required
        { wch: 15 }, // Approval
        { wch: 40 }, // Remark (increased width)
        { wch: 15 }  // Status
      ];
      ws['!cols'] = colWidths;

      const fileName = `PID_Analysis_Results_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Export to Excel failed:', error);
      alert('Failed to export to Excel. Please try again.');
    }
  };

  // Export to CSV function
  const exportToCSV = () => {
    try {
      const headers = ['P&ID Number', 'Issue Found', 'Action Required', 'Approval', 'Remark', 'Status'];
      const csvContent = [
        headers.join(','),
        ...tableData.map(row => [
          `"${row.pidNumber}"`,
          `"${row.issueFound.replace(/"/g, '""')}"`,
          `"${row.actionRequired.replace(/"/g, '""')}"`,
          `"${row.approval}"`,
          `"${row.remark.replace(/"/g, '""')}"`,
          `"${row.status}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `PID_Analysis_Results_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export to CSV failed:', error);
      alert('Failed to export to CSV. Please try again.');
    }
  };

  // Add PDF export function
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text('P&ID Analysis Results', 14, 22);
      
      // Add subtitle
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.text(`Total Issues: ${tableData.length}`, 14, 36);
      
      // Prepare table data
      const tableColumns = ['P&ID Number', 'Issue Found', 'Action Required', 'Approval', 'Remark', 'Status'];
      const tableRows = tableData.map(row => [
        row.pidNumber,
        row.issueFound,
        row.actionRequired,
        row.approval,
        row.remark,
        row.status
      ]);
      
      // Add table
      doc.autoTable({
        head: [tableColumns],
        body: tableRows,
        startY: 45,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
          1: { cellWidth: 60 }, // Issue Found
          2: { cellWidth: 60 }, // Action Required
        },
        margin: { top: 45, right: 14, bottom: 20, left: 14 },
      });
      
      const fileName = `PID_Analysis_Results_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Export to PDF failed:', error);
      alert('Failed to export to PDF. Please try again.');
    }
  };

  // Print function
  const handlePrint = () => {
    try {
      const printWindow = window.open('', '_blank');
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>P&ID Analysis Results</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .status-approved { background-color: #4caf50; color: white; padding: 4px 8px; border-radius: 12px; }
            .status-ignored { background-color: #f44336; color: white; padding: 4px 8px; border-radius: 12px; }
            .status-pending { background-color: #9e9e9e; color: white; padding: 4px 8px; border-radius: 12px; }
            .issue-cell, .action-cell { max-width: 300px; word-wrap: break-word; }
            @media print {
              body { margin: 0; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          <h1>P&ID Analysis Results</h1>
          <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Total Issues:</strong> ${tableData.length}</p>
          <table>
            <thead>
              <tr>
                <th>P&ID Number</th>
                <th>Issue Found</th>
                <th>Action Required</th>
                <th>Approval</th>
                <th>Remark</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableData.map(row => `
                <tr>
                  <td>${row.pidNumber}</td>
                  <td class="issue-cell">${row.issueFound}</td>
                  <td class="action-cell">${row.actionRequired}</td>
                  <td>${row.approval}</td>
                  <td>${row.remark}</td>
                  <td>
                    <span class="status-${row.status.toLowerCase()}">
                      ${row.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('Print failed:', error);
      alert('Failed to print. Please try again.');
    }
  };

  // Update table data when HTML data changes
  React.useEffect(() => {
    if (useHtmlData && htmlData) {
      const newParsedData = parseHtmlTableData(htmlData);
      setTableData(newParsedData);
    }
  }, [htmlData, useHtmlData]);

  // Handle approval status change with useCallback
  const handleApprovalChange = useCallback((id, newApproval) => {
    setTableData(prev => prev.map(row => {
      if (row.id === id) {
        // Update status based on approval and clear remark if approved
        let newStatus = 'Pending';
        let newRemark = row.remark;
        
        if (newApproval === 'Approved') {
          newStatus = 'Approved';
          newRemark = ''; // Clear remark for approved items
        } else if (newApproval === 'Ignored') {
          newStatus = 'Ignored';
        }
        
        return { ...row, approval: newApproval, status: newStatus, remark: newRemark };
      }
      return row;
    }));
  }, []);

  // Handle remark editing with useCallback
  const handleRemarkEdit = useCallback((id, currentRemark) => {
    setEditingRemark(id);
    setRemarkValue(currentRemark || '');
  }, []);

  const handleRemarkSave = useCallback((id) => {
    setTableData(prev => prev.map(row => 
      row.id === id ? { ...row, remark: remarkValue } : row
    ));
    setEditingRemark(null);
    setRemarkValue('');
  }, [remarkValue]);

  const handleRemarkCancel = useCallback(() => {
    setEditingRemark(null);
    setRemarkValue('');
  }, []);

  // Memoize table columns to prevent re-creation on every render
  const tableColumns = useMemo(() => [
    { 
      field: 'pidNumber', 
      headerName: 'P&ID Number', 
      width: 180,
      headerAlign: 'center',
      align: 'left'
    },
    { 
      field: 'issueFound', 
      headerName: 'Issue Found', 
      width: 400, // Increased width for longer content
      headerAlign: 'center',
      align: 'left',
      renderCell: (params) => (
        <div 
          style={{
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            lineHeight: '1.3',
            padding: '8px 0',
            maxHeight: '150px', // Increased height
            overflow: 'auto'
          }}
          title={params.value}
        >
          {params.value}
        </div>
      )
    },
    { 
      field: 'actionRequired', 
      headerName: 'Action Required', 
      width: 400, // Increased width for longer content
      headerAlign: 'center',
      align: 'left',
      renderCell: (params) => (
        <div 
          style={{
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            lineHeight: '1.3',
            padding: '8px 0',
            maxHeight: '150px', // Increased height
            overflow: 'auto'
          }}
          title={params.value}
        >
          {params.value}
        </div>
      )
    },
    { 
      field: 'approval', 
      headerName: 'Approval', 
      width: 200, // Increased width for new button labels
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <div className="flex gap-1">
          <button
            onClick={() => handleApprovalChange(params.row.id, 'Approved')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center ${
              params.value === 'Approved' 
                ? 'bg-green-500 text-white' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
            title="Approve"
          >
            <Check size={12} className="mr-1" />
            Approved
          </button>
          <button
            onClick={() => handleApprovalChange(params.row.id, 'Ignored')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center ${
              params.value === 'Ignored' 
                ? 'bg-red-500 text-white' 
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
            title="Ignore"
          >
            <X size={12} className="mr-1" />
            Ignored
          </button>
        </div>
      )
    },
    { 
      field: 'remark', 
      headerName: 'Remark', 
      width: 350, // Increased width for longer remarks
      headerAlign: 'center',
      align: 'left',
      renderCell: (params) => {
        // Hide remark column for approved items
        if (params.row.approval === 'Approved') {
          return (
            <div className="w-full text-center text-gray-400 italic text-xs">
              No remark needed
            </div>
          );
        }

        return (
          <div className="w-full">
            {editingRemark === params.row.id ? (
              <div className="flex items-center gap-1">
                <textarea
                  value={remarkValue}
                  onChange={(e) => setRemarkValue(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Enter remark (max 500 characters)..."
                  autoFocus
                  rows={3}
                  maxLength={500} // Increased character limit
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) handleRemarkSave(params.row.id);
                    if (e.key === 'Escape') handleRemarkCancel();
                  }}
                />
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleRemarkSave(params.row.id)}
                    className="px-1 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    title="Save (Ctrl+Enter)"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={handleRemarkCancel}
                    className="px-1 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    title="Cancel (Esc)"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className="flex items-start justify-between group cursor-pointer hover:bg-gray-50 p-1 rounded min-h-[60px]"
                onClick={() => handleRemarkEdit(params.row.id, params.value)}
                title="Click to edit remark"
              >
                <span className="flex-1 text-xs leading-relaxed" style={{ wordWrap: 'break-word' }}>
                  {params.value || 'Click to add remark...'}
                </span>
                <Edit3 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-gray-400 flex-shrink-0" />
              </div>
            )}
          </div>
        );
      }
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <span 
          style={{
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: 
              params.value === 'Approved' ? '#4caf50' :
              params.value === 'Ignored' ? '#f44336' :
              params.value === 'Pending' ? '#9e9e9e' : '#2196f3',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {params.value}
        </span>
      )
    },
  ], [editingRemark, remarkValue, handleApprovalChange, handleRemarkEdit, handleRemarkSave, handleRemarkCancel]);

  return (
    <div className="col-span-12 lg:col-span-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col max-h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {subtitle} ({tableData.length} issues found)
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <DataGrid
          rows={tableData}
          columns={tableColumns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25, 50]}
          disableSelectionOnClick
          className="border-0"
          getRowHeight={() => 'auto'}
          sx={{
            '& .MuiDataGrid-root': {
              border: 'none',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'flex-start', // Changed to flex-start for better alignment
              padding: '12px 8px', // Increased padding
              lineHeight: '1.4',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f8f9fa',
              borderBottom: '2px solid #dee2e6',
              fontSize: '14px',
              fontWeight: 'bold',
            },
            '& .MuiDataGrid-row': {
              minHeight: '80px !important', // Minimum row height
              '&:hover': {
                backgroundColor: '#f8f9fa',
              },
              '&:nth-of-type(even)': {
                backgroundColor: '#fafafa',
              },
            },
            '& .MuiDataGrid-cell--textLeft': {
              justifyContent: 'flex-start',
            },
            '& .MuiDataGrid-cell--textCenter': {
              justifyContent: 'center',
            },
            '& .MuiDataGrid-virtualScroller': {
              // Enable horizontal scrolling for wide content
              overflowX: 'auto',
            },
          }}
        />
      </div>
    </div>
  );
});

export default React.memo(DocumentDataTable);