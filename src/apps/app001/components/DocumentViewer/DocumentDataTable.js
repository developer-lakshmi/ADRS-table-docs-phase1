import React, { useState, useCallback, useMemo } from 'react';
import { DataGrid } from "@mui/x-data-grid";
import { Check, X, Edit3 } from "lucide-react";

/**
 * Document Data Table Component
 * Displays P&ID findings and issues extracted from documents
 * Features: Editable remarks, clickable approval buttons
 */

// Sample data matching your P&ID structure with approval status
const initialTableData = [
  { 
    id: 1, 
    pidNumber: "P16093-16-01-08-1684-1", 
    issueFound: "Thermowell for TIT-3610-14A shown with 2\" connection.", 
    actionRequired: "TIT tag no connection sizes are indicated as 2'' which are higher than the minimum specified size of 1.5'' as per 'AGES-PH-04-001, Rev-1, Table 14.1 instxxxxxxxx'. The selected size of 2'' is as per project Legend Drawings.", 
    approval: "Approved",
    remark: "jbscxjbjhbdjhwb", 
    status: "Green" 
  },
  { 
    id: 2, 
    pidNumber: "P16093-16-01-08-1684-2", 
    issueFound: "Valve orientation incorrect in line 6\".", 
    actionRequired: "Verify valve orientation per P&ID standards and correct as needed.", 
    approval: "Not Approved",
    remark: "Engineering review required", 
    status: "Red" 
  },
  { 
    id: 3, 
    pidNumber: "P16093-16-01-08-1684-3", 
    issueFound: "Missing isolation valve upstream of equipment.", 
    actionRequired: "Add isolation valve as per process safety requirements.", 
    approval: "Not Approved",
    remark: "Safety critical", 
    status: "Red" 
  },
  { 
    id: 4, 
    pidNumber: "P16093-16-01-08-1684-4", 
    issueFound: "Pipe routing crosses structural member.", 
    actionRequired: "Coordinate with structural team for clearance verification.", 
    approval: "Not",
    remark: "Under review", 
    status: "Grey" 
  },
  { 
    id: 5, 
    pidNumber: "P16093-16-01-08-1684-5", 
    issueFound: "Instrument connection size mismatch.", 
    actionRequired: "Update instrument specification to match field requirements.", 
    approval: "Approved",
    remark: "Vendor consultation needed", 
    status: "Green" 
  },
];

const DocumentDataTable = ({ 
  data = initialTableData, 
  title = "P&ID Findings",
  subtitle = "Issues and actions identified from document analysis"
}) => {
  const [tableData, setTableData] = useState(data);
  const [editingRemark, setEditingRemark] = useState(null);
  const [remarkValue, setRemarkValue] = useState('');

  // Handle approval status change with useCallback
  const handleApprovalChange = useCallback((id, newApproval) => {
    setTableData(prev => prev.map(row => {
      if (row.id === id) {
        // Update status based on approval
        let newStatus = 'Grey';
        if (newApproval === 'Approved') newStatus = 'Green';
        else if (newApproval === 'Not Approved') newStatus = 'Red';
        
        return { ...row, approval: newApproval, status: newStatus };
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
      width: 220,
      headerAlign: 'center',
      align: 'left',
      renderCell: (params) => (
        <div 
          style={{
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            lineHeight: '1.3',
            padding: '8px 0'
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
      width: 250,
      headerAlign: 'center',
      align: 'left',
      renderCell: (params) => (
        <div 
          style={{
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            lineHeight: '1.3',
            padding: '8px 0'
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
      width: 160,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <div className="flex gap-1">
          <button
            onClick={() => handleApprovalChange(params.row.id, 'Approved')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center ${
              params.value === 'Approved' 
                ? 'bg-green-500 text-white' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
            title="Approve"
          >
            <Check size={12} className="mr-1" />
            App
          </button>
          <button
            onClick={() => handleApprovalChange(params.row.id, 'Not Approved')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center ${
              params.value === 'Not Approved' 
                ? 'bg-red-500 text-white' 
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
            title="Reject"
          >
            <X size={12} className="mr-1" />
            Rej
          </button>
        </div>
      )
    },
    { 
      field: 'remark', 
      headerName: 'Remark', 
      width: 200,
      headerAlign: 'center',
      align: 'left',
      renderCell: (params) => (
        <div className="w-full">
          {editingRemark === params.row.id ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={remarkValue}
                onChange={(e) => setRemarkValue(e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="Enter remark..."
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleRemarkSave(params.row.id);
                  if (e.key === 'Escape') handleRemarkCancel();
                }}
              />
              <button
                onClick={() => handleRemarkSave(params.row.id)}
                className="px-1 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                title="Save"
              >
                <Check size={12} />
              </button>
              <button
                onClick={handleRemarkCancel}
                className="px-1 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                title="Cancel"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div 
              className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-1 rounded"
              onClick={() => handleRemarkEdit(params.row.id, params.value)}
              title="Click to edit remark"
            >
              <span className="flex-1 text-xs" style={{ wordWrap: 'break-word' }}>
                {params.value || 'Click to add remark...'}
              </span>
              <Edit3 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-gray-400" />
            </div>
          )}
        </div>
      )
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
              params.value === 'Green' ? '#4caf50' :
              params.value === 'Red' ? '#f44336' :
              params.value === 'Grey' ? '#9e9e9e' : '#2196f3',
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
          {subtitle}
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <DataGrid
          rows={tableData}
          columns={tableColumns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
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
              alignItems: 'center',
              padding: '8px',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f8f9fa',
              borderBottom: '2px solid #dee2e6',
              fontSize: '14px',
              fontWeight: 'bold',
            },
            '& .MuiDataGrid-row': {
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
          }}
        />
      </div>
    </div>
  );
};

export default React.memo(DocumentDataTable);