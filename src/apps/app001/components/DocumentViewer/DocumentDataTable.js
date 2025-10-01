import React, { useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { DataGrid } from "@mui/x-data-grid";
import { Check, X, Edit3 } from "lucide-react";
import { mockHtmlApiResponse, mockTableData, DATA_SOURCE_CONFIG } from './mockData';
import { handleExport, handlePrint } from './exportUtils';

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
      status: 'Pending' // Default status
    };
  });
};

const DocumentDataTable = forwardRef(({ 
  data = [],
  title = "P&ID Analysis Results",
  subtitle = "Issues and actions identified from document analysis",
  useHtmlData = DATA_SOURCE_CONFIG.USE_HTML_DATA,
  htmlData = null,
  useMockData = true // Default to true instead of config
}, ref) => {
  
  // Determine data source based on configuration
  const getDataSource = useMemo(() => {
    // If real data is provided via props, use it
    if (data.length > 0) {
      return data;
    }
    
    // Use mock data based on configuration
    if (useHtmlData) {
      const htmlToUse = htmlData || mockHtmlApiResponse;
      return parseHtmlTableData(htmlToUse);
    } else {
      return mockTableData;
    }
  }, [data, useHtmlData, htmlData]); // Remove useMockData dependency

  const [tableData, setTableData] = useState(getDataSource);
  const [editingRemark, setEditingRemark] = useState(null);
  const [remarkValue, setRemarkValue] = useState('');

  // Update table data when dependencies change
  React.useEffect(() => {
    setTableData(getDataSource);
  }, [getDataSource]);

  // Expose export and print methods to parent component
  useImperativeHandle(ref, () => ({
    exportData: (format) => {
      handleExport(format, tableData, title);
    },
    printTable: () => {
      handlePrint(tableData, title);
    }
  }));

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
      width: 400,
      headerAlign: 'center',
      align: 'left',
      renderCell: (params) => (
        <div 
          style={{
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            lineHeight: '1.3',
            padding: '8px 0',
            maxHeight: '150px',
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
      width: 400,
      headerAlign: 'center',
      align: 'left',
      renderCell: (params) => (
        <div 
          style={{
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            lineHeight: '1.3',
            padding: '8px 0',
            maxHeight: '150px',
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
      width: 180,
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
            title="Approve this item"
          >
            <Check size={12} className="mr-1" />
            Approve
          </button>
          <button
            onClick={() => handleApprovalChange(params.row.id, 'Ignored')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center ${
              params.value === 'Ignored' 
                ? 'bg-red-500 text-white' 
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
            title="Ignore this item"
          >
            <X size={12} className="mr-1" />
            Ignore
          </button>
        </div>
      )
    },
    { 
      field: 'remark', 
      headerName: 'Remark', 
      width: 350,
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
                  maxLength={500}
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
              alignItems: 'flex-start',
              padding: '12px 8px',
              lineHeight: '1.4',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f8f9fa',
              borderBottom: '2px solid #dee2e6',
              fontSize: '14px',
              fontWeight: 'bold',
            },
            '& .MuiDataGrid-row': {
              minHeight: '80px !important',
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
              overflowX: 'auto',
            },
          }}
        />
      </div>
    </div>
  );
});

export default React.memo(DocumentDataTable);