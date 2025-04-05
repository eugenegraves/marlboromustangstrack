require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

/**
 * Upload a file to Cloudinary
 * @param {string} file - File path or base64 encoded string
 * @param {Object} options - Additional upload options
 * @returns {Promise} - Cloudinary upload result
 */
const uploadToCloudinary = async (file, options = {}) => {
  try {
    // For serverless, we'll use base64 encoding
    // or a file path for local development
    const result = await cloudinary.uploader.upload(file, {
      resource_type: 'auto',
      ...options
    });
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - The public ID of the resource to delete
 * @returns {Promise} - Cloudinary delete result
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

module.exports = { 
  uploadToCloudinary,
  deleteFromCloudinary,
  cloudinary 
}; 