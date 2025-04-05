const express = require('express');
const router = express.Router();
const { uploadToCloudinary } = require('../services/cloudinary');
const multer = require('multer');

// For local development, use memory storage
// This will also work in serverless environments
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed!'), false);
    }
  }
});

/**
 * Handle file upload
 * @route POST /api/upload
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Convert buffer to base64 for Cloudinary
    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    // For track team app, organize uploads in folders
    const folder = req.body.folder || 'track-team';
    const resourceType = req.file.mimetype.startsWith('image/') ? 'image' : 'document';
    
    const result = await uploadToCloudinary(fileStr, {
      folder: `${folder}/${resourceType}s`,
      public_id: `${Date.now()}`,
      // For athlete photos, consider using face detection
      ...(req.body.useAIDetection && { detection: 'adv_face' })
    });
    
    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      success: true,
      metadata: {
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height
      }
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

/**
 * Delete a file from Cloudinary
 * @route DELETE /api/upload/:publicId
 */
router.delete('/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    const { deleteFromCloudinary } = require('../services/cloudinary');
    
    const result = await deleteFromCloudinary(publicId);
    
    if (result.result === 'ok') {
      res.json({ success: true, message: 'File deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'File not found or already deleted' });
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    res.status(500).json({ error: error.message || 'Delete failed' });
  }
});

module.exports = router; 