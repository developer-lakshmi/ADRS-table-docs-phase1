import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

// Import autoTable plugin - this adds autoTable method to jsPDF
require('jspdf-autotable');

/**
 * Export utilities for DocumentDataTable
 * Contains all export and print functionality
 */

/**
 * Export table data to Excel format
 * @param {Array} tableData - The table data to export
 * @returns {void}
 */
export const exportToExcel = (tableData) => {
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

/**
 * Export table data to CSV format
 * @param {Array} tableData - The table data to export
 * @returns {void}
 */
export const exportToCSV = (tableData) => {
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

    const blob = new Blob([csvContent], { type: 'text/csv;charset-utf-8;' });
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

/**
 * Export table data to PDF format with enhanced styling
 * @param {Array} tableData - The table data to export
 * @param {string} title - The document title
 * @returns {void}
 */
export const exportToPDF = (tableData, title = "P&ID Analysis Results") => {
  try {
    console.log('Starting PDF export...');
    
    // Create PDF in landscape mode for better table fit
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    console.log('PDF instance created');
    console.log('autoTable available?', typeof doc.autoTable);
    
    // Check if autoTable is available
    if (typeof doc.autoTable !== 'function') {
      console.error('autoTable is not a function. Available methods:', Object.getOwnPropertyNames(doc));
      throw new Error('jsPDF autoTable plugin is not properly loaded');
    }
    
    // Add title and metadata
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('P&ID Analysis Results', 15, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 15, 30);
    doc.text(`Total Issues: ${tableData.length}`, 15, 36);
    doc.text(`Document: ${title}`, 15, 42);
    
    // Prepare table data exactly as shown in the UI
    const tableColumns = [
      'P&ID Number', 
      'Issue Found', 
      'Action Required', 
      'Approval Status', 
      'Remark', 
      'Status'
    ];
    
    const tableRows = tableData.map(row => {
      // Format approval status to match UI display
      const approvalDisplay = row.approval === 'Approved' ? '✓ APPROVED' :
                             row.approval === 'Ignored' ? '✗ IGNORED' : 
                             'PENDING';
      
      // Format remark based on approval status (same logic as UI)
      const remarkDisplay = row.approval === 'Approved' ? 'No remark needed' : 
                           (row.remark || 'No remark');
      
      // Format status to match UI
      const statusDisplay = row.status.toUpperCase();
      
      return [
        row.pidNumber || '',
        row.issueFound || '',
        row.actionRequired || '',
        approvalDisplay,
        remarkDisplay,
        statusDisplay
      ];
    });
    
    console.log('Table data prepared, rows:', tableRows.length);
    
    // Use autoTable
    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      styles: { 
        fontSize: 8, 
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'top',
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [248, 249, 250],
        textColor: [55, 65, 81],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 35, halign: 'left' },
        1: { cellWidth: 65, halign: 'left' },
        2: { cellWidth: 65, halign: 'left' },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 50, halign: 'left' },
        5: { cellWidth: 25, halign: 'center' }
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      margin: { top: 50, right: 15, bottom: 20, left: 15 },
      didParseCell: function(data) {
        // Color code the approval column
        if (data.column.index === 3) {
          if (data.cell.text[0] === '✓ APPROVED') {
            data.cell.styles.fillColor = [74, 222, 128];
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.text[0] === '✗ IGNORED') {
            data.cell.styles.fillColor = [248, 113, 113];
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.fillColor = [156, 163, 175];
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = 'bold';
          }
        }
        
        // Color code the status column
        if (data.column.index === 5) {
          if (data.cell.text[0] === 'APPROVED') {
            data.cell.styles.fillColor = [76, 175, 80];
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.text[0] === 'IGNORED') {
            data.cell.styles.fillColor = [244, 67, 54];
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.text[0] === 'PENDING') {
            data.cell.styles.fillColor = [158, 158, 158];
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = 'bold';
          }
        }
        
        // Style remark column
        if (data.column.index === 4) {
          if (data.cell.text[0] === 'No remark needed') {
            data.cell.styles.textColor = [156, 163, 175];
            data.cell.styles.fontStyle = 'italic';
          }
        }
      },
      didDrawPage: function (data) {
        // Add page number
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
        
        // Add footer
        doc.text('Generated from P&ID Analysis System', 15, doc.internal.pageSize.height - 10);
      }
    });
    
    // Add summary statistics at the bottom
    const finalY = doc.lastAutoTable.finalY + 15;
    const approvedCount = tableData.filter(row => row.approval === 'Approved').length;
    const ignoredCount = tableData.filter(row => row.approval === 'Ignored').length;
    const pendingCount = tableData.filter(row => row.approval === 'Not' || !row.approval || row.approval === 'Pending').length;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text('Summary:', 15, finalY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`✓ Approved: ${approvedCount}`, 15, finalY + 8);
    doc.text(`✗ Ignored: ${ignoredCount}`, 70, finalY + 8);
    doc.text(`⏳ Pending: ${pendingCount}`, 120, finalY + 8);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `PID_Analysis_Results_${timestamp}.pdf`;
    
    console.log('Saving PDF...');
    
    // Save the PDF
    doc.save(fileName);
    
    console.log('PDF export completed successfully');
  } catch (error) {
    console.error('Export to PDF failed:', error);
    alert(`Failed to export to PDF: ${error.message}. Please check console for details.`);
  }
};

/**
 * Print table with enhanced styling that preserves exact colors and formatting
 * @param {Array} tableData - The table data to print
 * @param {string} title - The document title
 * @returns {void}
 */
export const handlePrint = (tableData, title = "P&ID Analysis Results") => {
  try {
    // Generate print content with exact button colors and styling
    const generatePrintContent = () => {
      const printRows = tableData.map(row => {
        const approveButtonStyle = row.approval === 'Approved' 
          ? 'background-color: #4ade80; color: white;' 
          : 'background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0;';
        
        const ignoreButtonStyle = row.approval === 'Ignored' 
          ? 'background-color: #f87171; color: white;' 
          : 'background-color: #fecaca; color: #dc2626; border: 1px solid #fca5a5;';

        const statusBadgeStyle = 
          row.status === 'Approved' ? 'background-color: #4ade80; color: white;' :
          row.status === 'Ignored' ? 'background-color: #f87171; color: white;' :
          row.status === 'Pending' ? 'background-color: #9ca3af; color: white;' : 
          'background-color: #3b82f6; color: white;';

        const remarkContent = row.approval === 'Approved' 
          ? '<em style="color: #9ca3af; font-style: italic;">No remark needed</em>'
          : (row.remark || '<em style="color: #9ca3af;">No remark</em>');

        return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 8px; border-right: 1px solid #f3f4f6; vertical-align: top; font-size: 12px;">
              ${row.pidNumber}
            </td>
            <td style="padding: 12px 8px; border-right: 1px solid #f3f4f6; vertical-align: top; font-size: 11px; max-width: 300px; word-wrap: break-word; line-height: 1.4;">
              ${row.issueFound}
            </td>
            <td style="padding: 12px 8px; border-right: 1px solid #f3f4f6; vertical-align: top; font-size: 11px; max-width: 300px; word-wrap: break-word; line-height: 1.4;">
              ${row.actionRequired}
            </td>
            <td style="padding: 12px 8px; border-right: 1px solid #f3f4f6; text-align: center; vertical-align: top;">
              <div style="display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;">
                <span style="padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 500; ${approveButtonStyle} display: inline-flex; align-items: center;">
                  ✓ Approve
                </span>
                <span style="padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 500; ${ignoreButtonStyle} display: inline-flex; align-items: center;">
                  ✗ Ignore
                </span>
              </div>
            </td>
            <td style="padding: 12px 8px; border-right: 1px solid #f3f4f6; vertical-align: top; font-size: 11px; max-width: 250px; word-wrap: break-word; line-height: 1.4;">
              ${remarkContent}
            </td>
            <td style="padding: 12px 8px; text-align: center; vertical-align: top;">
              <span style="padding: 6px 12px; border-radius: 20px; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; ${statusBadgeStyle}">
                ${row.status}
              </span>
            </td>
          </tr>
        `;
      }).join('');

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>P&ID Analysis Results</title>
          <meta charset="utf-8">
          <style>
            @page {
              margin: 0.5in;
              size: A4 landscape;
            }
            * {
              box-sizing: border-box;
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
              color: #1f2937;
              font-size: 12px;
              line-height: 1.4;
            }
            .print-header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 20px;
            }
            .print-header h1 { 
              color: #1f2937; 
              margin: 0 0 10px 0; 
              font-size: 24px; 
              font-weight: 700;
            }
            .print-header .meta {
              color: #6b7280;
              font-size: 12px;
              margin: 5px 0;
            }
            .print-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 0;
              background: white;
              border: 1px solid #d1d5db;
            }
            .print-table th { 
              background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
              border: 1px solid #d1d5db;
              padding: 12px 8px; 
              text-align: center; 
              font-weight: 700;
              font-size: 11px;
              color: #374151;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .print-table td {
              border: 1px solid #e5e7eb;
              padding: 8px;
              vertical-align: top;
            }
            .print-table tbody tr:nth-child(even) { 
              background-color: #f9fafb; 
            }
            .print-table tbody tr:hover { 
              background-color: #f3f4f6; 
            }
            @media print {
              body { 
                margin: 0; 
                padding: 10px;
                font-size: 10px;
              }
              .print-header h1 {
                font-size: 18px;
              }
              .print-table { 
                page-break-inside: auto; 
                font-size: 9px;
              }
              .print-table thead {
                display: table-header-group;
              }
              .print-table tbody tr { 
                page-break-inside: avoid; 
                page-break-after: auto; 
              }
              .print-table th {
                background: #f1f5f9 !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              span[style*="background-color"] {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
            }
            .no-print {
              display: none;
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>P&ID Analysis Results</h1>
            <div class="meta"><strong>Generated on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
            <div class="meta"><strong>Total Issues:</strong> ${tableData.length}</div>
            <div class="meta"><strong>Document:</strong> ${title}</div>
          </div>
          <table class="print-table">
            <thead>
              <tr>
                <th style="width: 12%;">P&ID Number</th>
                <th style="width: 28%;">Issue Found</th>
                <th style="width: 28%;">Action Required</th>
                <th style="width: 12%;">Approval</th>
                <th style="width: 15%;">Remark</th>
                <th style="width: 8%;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${printRows}
            </tbody>
          </table>
          <div style="margin-top: 30px; font-size: 10px; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            <p>This document contains ${tableData.length} items. Generated from P&ID Analysis System.</p>
          </div>
        </body>
        </html>
      `;
    };

    // Create and open print window
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups for this site to print.');
      return;
    }

    const printContent = generatePrintContent();
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        // Don't close automatically - let user decide
        // printWindow.close();
      }, 250);
    };

  } catch (error) {
    console.error('Print failed:', error);
    alert('Failed to print. Please try again.');
  }
};

/**
 * Main export handler that routes to appropriate export function
 * @param {string} format - Export format: 'excel', 'csv', or 'pdf'
 * @param {Array} tableData - The table data to export
 * @param {string} title - The document title
 * @returns {void}
 */
export const handleExport = (format, tableData, title) => {
  switch (format) {
    case 'excel':
      exportToExcel(tableData);
      break;
    case 'csv':
      exportToCSV(tableData);
      break;
    case 'pdf':
      exportToPDF(tableData, title);
      break;
    default:
      console.error('Unsupported export format:', format);
      alert('Unsupported export format. Please use excel, csv, or pdf.');
  }
};