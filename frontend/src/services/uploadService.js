/**
 * Service for handling file uploads to Cloudinary through the backend API
 */

// API URL - adjust for production
const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/upload' 
  : 'http://localhost:5011/api/upload';

/**
 * Upload a file to Cloudinary
 * @param {File} file - The file to upload
 * @param {Object} options - Additional options
 * @param {string} options.folder - Cloudinary folder to store the file in
 * @param {boolean} options.useAIDetection - Whether to use AI detection for images
 * @param {Function} options.onProgress - Progress callback (not supported with regular fetch)
 * @returns {Promise<Object>} - Upload result
 */
export const uploadFile = async (file, options = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add any additional options
    if (options.folder) {
      formData.append('folder', options.folder);
    }
    
    // Only include this if you want to use it and have the paid plan
    // if (options.useAIDetection) {
    //   formData.append('useAIDetection', 'true');
    // }
    
    // If progress tracking is needed, use XMLHttpRequest instead of fetch
    if (options.onProgress && typeof options.onProgress === 'function') {
      return uploadWithProgress(file, options);
    }
    
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

/**
 * Upload with progress tracking using XMLHttpRequest
 * @param {File} file - The file to upload
 * @param {Object} options - Options including onProgress callback
 * @returns {Promise<Object>} - Upload result
 */
const uploadWithProgress = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    
    formData.append('file', file);
    
    // Add any additional options
    if (options.folder) {
      formData.append('folder', options.folder);
    }
    
    xhr.open('POST', API_URL, true);
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options.onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        options.onProgress(percentComplete);
      }
    };
    
    xhr.onload = function() {
      if (this.status >= 200 && this.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          reject(new Error('Invalid response from server'));
        }
      } else {
        reject(new Error('Upload failed'));
      }
    };
    
    xhr.onerror = () => {
      reject(new Error('Upload failed'));
    };
    
    xhr.send(formData);
  });
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - The public ID of the file to delete
 * @returns {Promise<Object>} - Delete result
 */
export const deleteFile = async (publicId) => {
  try {
    const response = await fetch(`${API_URL}/${publicId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Delete failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
}; 