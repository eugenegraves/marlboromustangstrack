import React, { useState } from 'react';
import { Container, Typography, Paper, Box, Divider } from '@mui/material';
import ImageUploader from '../components/ImageUploader';

/**
 * Demo page to showcase the ImageUploader component
 */
const UploadDemo = () => {
  const [uploadedImages, setUploadedImages] = useState([]);
  
  const handleImageUploaded = (result) => {
    setUploadedImages((prev) => [...prev, result]);
    console.log('Image uploaded:', result);
  };
  
  const handleImageDeleted = (publicId) => {
    setUploadedImages((prev) => prev.filter(img => img.publicId !== publicId));
    console.log('Image deleted:', publicId);
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Cloudinary Image Upload Demo
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Upload a New Image
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        <ImageUploader
          onImageUploaded={handleImageUploaded}
          onImageDeleted={handleImageDeleted}
          folder="track-team/demo"
          useAIDetection={true}
          label="Upload Team Photo"
        />
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Upload an image to see it displayed below. The image will be stored in the
          'track-team/demo' folder in Cloudinary.
        </Typography>
      </Paper>
      
      {uploadedImages.length > 0 && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Uploaded Images ({uploadedImages.length})
          </Typography>
          
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {uploadedImages.map((img, index) => (
              <Box key={index} sx={{ textAlign: 'center' }}>
                <img 
                  src={img.url} 
                  alt={`Uploaded ${index + 1}`} 
                  style={{ 
                    maxWidth: '200px',
                    maxHeight: '200px',
                    borderRadius: '4px'
                  }} 
                />
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {img.publicId.split('/').pop()}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default UploadDemo; 