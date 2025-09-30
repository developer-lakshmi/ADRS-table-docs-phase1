import React, { useRef, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { addFiles } from "../../redux/slices/shared/fileUploadSlice";

const BaseModal = ({ message, onCancel, showFileUpload = false, onOk, uploadContext = null }) => {
  const dispatch = useDispatch();
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(0); // 0 = Cancel, 1 = Confirm
  const [files, setFiles] = useState([]); // Track uploaded files

  const buttons = [cancelRef, confirmRef];
  const splitMessage = message.split(/[!]/);

  // Reset files when modal opens/closes
  useEffect(() => {
    setFiles([]);
  }, [showFileUpload]);

  // Focus first button when modal opens
  useEffect(() => {
    if (buttons[focusedIndex] && buttons[focusedIndex].current) {
      buttons[focusedIndex].current.focus();
    }
  }, [focusedIndex]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev === 0 ? 1 : 0));
    }
    if (e.key === "Enter") {
      if (focusedIndex === 0) handleCancel();
      if (focusedIndex === 1) handleUpload();
    }
  };

  const handleFileChange = (e) => {
    setFiles([...files, ...e.target.files]);
    e.target.value = ''; // Clear input value to allow re-selecting same files
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setFiles([...files, ...e.dataTransfer.files]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleCancel = () => {
    setFiles([]); // Clear files when canceling
    onCancel();
  };

  const handleUpload = () => {
    if (files.length > 0) {
      console.log("Files to upload:", files); // Debug log
      console.log("Upload context:", uploadContext); // Debug log
      onOk(files);
      setFiles([]);
    } else {
      alert("No files selected for upload.");
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-100 w-full max-w-md p-6 rounded-2xl shadow-xl mx-4 sm:mx-0">
        {/* Header with context indicator */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{splitMessage[0]}!</h2>
          {/* {uploadContext && (
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              uploadContext.category === 'pid' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {uploadContext.category === 'pid' ? '📊 P&ID' : '🤖 Reference'}
            </div>
          )} */}
        </div>

        {splitMessage.length > 1 && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            {splitMessage[1]}
          </p>
        )}

        {/* Upload context info */}
        {uploadContext && (
          <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
            {uploadContext.category === 'pid' 
              ? 'Files will be uploaded to P&ID tab for processing'
              : 'Files will be uploaded to Reference Documents tab for AI training'
            }
          </div>
        )}

        {showFileUpload ? (
          <>
            <div className="mt-4">
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-700 p-4 rounded-lg text-center hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Drag and drop files here, or click to select files
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="fileInput"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                />
                <label
                  htmlFor="fileInput"
                  className="cursor-pointer text-blue-500 hover:text-blue-600 underline"
                >
                  Browse Files
                </label>
              </div>

              {/* Selected files list */}
              {files.length > 0 && (
                <div className="mt-3 max-h-32 overflow-y-auto">
                  <p className="text-sm font-medium mb-2">Selected Files ({files.length}):</p>
                  <div className="space-y-1">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                        <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                          {file.name}
                        </span>
                        <button
                          onClick={() => removeFile(index)}
                          className="ml-2 text-red-500 hover:text-red-700 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File count info */}
              <div className="mt-3 text-sm">
                {files.length > 0 ? (
                  <p className="text-gray-600 dark:text-gray-300">
                    {files.length} file(s) ready to upload.
                  </p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    No files selected yet.
                  </p>
                )}
              </div>
            </div>

            {/* Buttons for file upload */}
            <div className="flex justify-end mt-6 space-x-3">
              <button
                ref={cancelRef}
                onClick={handleCancel}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
              <button
                ref={confirmRef}
                onClick={handleUpload}
                disabled={files.length === 0}
                className={`px-4 py-2 text-sm rounded-lg transition focus:outline-none focus:ring-2 ${
                  files.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-500'
                }`}
              >
                Upload {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'Files'}
              </button>
            </div>
          </>
        ) : (
          /* Regular modal buttons */
          <div className="flex justify-end mt-6 space-x-3">
            <button
              ref={cancelRef}
              onClick={handleCancel}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              ref={confirmRef}
              onClick={onOk}
              className="px-4 py-2 text-sm rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Ok
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseModal;