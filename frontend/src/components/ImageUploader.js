import React, { useState } from 'react';
import { Box, Button, CircularProgress, Typography, IconButton } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { uploadFile, deleteFile } from '../services/uploadService';

/**
 * A reusable image uploader component
 * @param {Object} props - Component props
 * @param {Function} props.onImageUploaded - Called when an image is successfully uploaded
 * @param {Function} props.onImageDeleted - Called when an image is deleted
 * @param {string} props.initialImage - Initial image URL (optional)
 * @param {string} props.initialPublicId - Initial public ID for Cloudinary (optional)
 * @param {string} props.folder - Cloudinary folder to upload to (optional)
 * @param {boolean} props.useAIDetection - Whether to use AI detection for images (optional)
 * @param {string} props.label - Upload button label (optional)
 */
const ImageUploader = ({
  onImageUploaded,
  onImageDeleted,
  initialImage = '',
  initialPublicId = '',
  folder = 'track-team',
  useAIDetection = false,
  label = 'Upload Image',
}) => {
  const [image, setImage] = useState(initialImage);
  const [publicId, setPublicId] = useState(initialPublicId);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Clear previous errors
    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    try {
      setUploading(true);
      
      // Upload the file with progress tracking
      const result = await uploadFile(file, {
        folder,
        useAIDetection,
        onProgress: (percent) => {
          setProgress(percent);
        },
      });

      setImage(result.url);
      setPublicId(result.publicId);
      
      // Call the callback with the result
      if (onImageUploaded) {
        onImageUploaded(result);
      }
    } catch (err) {
      setError('Failed to upload image: ' + (err.message || 'Unknown error'));
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!publicId) return;

    try {
      setUploading(true);
      
      await deleteFile(publicId);
      
      setImage('');
      setPublicId('');
      
      // Call the callback
      if (onImageDeleted) {
        onImageDeleted(publicId);
      }
    } catch (err) {
      setError('Failed to delete image: ' + (err.message || 'Unknown error'));
      console.error('Delete error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
      {!image ? (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center'
          }}
        >
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="image-upload-input"
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <label htmlFor="image-upload-input">
            <Button
              variant="contained"
              color="primary"
              component="span"
              disabled={uploading}
              startIcon={<CloudUploadIcon />}
              sx={{ mb: 2 }}
            >
              {uploading ? 'Uploading...' : label}
            </Button>
          </label>
          
          {uploading && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <CircularProgress 
                variant="determinate" 
                value={progress} 
                size={24} 
                sx={{ mr: 1 }} 
              />
              <Typography variant="body2" color="text.secondary">
                {progress}%
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center'
          }}
        >
          <Box 
            sx={{ 
              position: 'relative',
              maxWidth: '100%',
              overflow: 'hidden',
              borderRadius: 1,
              mb: 1
            }}
          >
            <img 
              src={image} 
              alt="Uploaded"
              style={{ 
                maxWidth: '300px', 
                maxHeight: '300px',
                display: 'block',
                objectFit: 'cover',
              }} 
            />
            
            <IconButton
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.8)',
                }
              }}
              size="small"
              onClick={handleDelete}
              disabled={uploading}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ mt: 1 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="image-replace-input"
              type="file"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <label htmlFor="image-replace-input">
              <Button
                variant="outlined"
                color="primary"
                component="span"
                size="small"
                disabled={uploading}
              >
                Replace Image
              </Button>
            </label>
          </Box>
        </Box>
      )}
      
      {error && (
        <Typography 
          color="error" 
          variant="body2" 
          sx={{ mt: 1, textAlign: 'center' }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default ImageUploader; 