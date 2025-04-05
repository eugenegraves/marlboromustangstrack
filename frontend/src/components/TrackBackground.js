import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Box } from '@mui/material';

const TrackBackground = () => {
  const mountRef = useRef(null);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    // Skip effect if mountRef is not available
    if (!mountRef.current) return;
    
    let renderer;
    let animationId;
    let scene;
    let trackGeometry;
    let trackMaterial;
    
    try {
      // Initialize scene, camera, and renderer
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f5f5);
      
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 8;
      camera.position.y = 5;
      camera.position.x = 0;
      camera.lookAt(0, 0, 0);
      
      // Create renderer with error handling
      renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        canvas: document.createElement('canvas')
      });
      
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      
      // Add to DOM
      mountRef.current.appendChild(renderer.domElement);
      
      // Create track oval
      trackGeometry = new THREE.TorusGeometry(4, 0.5, 16, 100);
      trackMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xe0e0e0,
        side: THREE.DoubleSide
      });
      const track = new THREE.Mesh(trackGeometry, trackMaterial);
      track.rotation.x = Math.PI / 2;
      scene.add(track);
      
      // Create track lanes
      for (let i = 1; i <= 6; i++) {
        const laneRadius = 3.5 + (i * 0.15);
        const laneGeometry = new THREE.TorusGeometry(laneRadius, 0.02, 16, 100);
        const laneMaterial = new THREE.MeshBasicMaterial({ 
          color: i % 2 === 0 ? 0xffc107 : 0x1a237e
        });
        const lane = new THREE.Mesh(laneGeometry, laneMaterial);
        lane.rotation.x = Math.PI / 2;
        scene.add(lane);
      }
      
      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(0, 10, 5);
      scene.add(directionalLight);
      
      // Handle window resize
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Animation loop
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        
        // Rotate track slightly for subtle animation
        track.rotation.z += 0.001;
        
        // Render the scene
        renderer.render(scene, camera);
      };
      
      animate();
      
      // Cleanup on unmount
      return () => {
        window.removeEventListener('resize', handleResize);
        
        // Cancel animation frame
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        
        // Safely remove DOM elements and dispose resources
        if (mountRef.current && renderer?.domElement && mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement);
        }
        
        // Dispose Three.js resources
        if (renderer) renderer.dispose();
        if (trackGeometry) trackGeometry.dispose();
        if (trackMaterial) trackMaterial.dispose();
        
        // Dispose track lane geometries and materials
        if (scene) {
          scene.children.forEach(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(material => material.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
        }
      };
    } catch (err) {
      console.error('Error initializing Three.js:', err);
      setError(true);
      
      // Cleanup on error
      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        
        if (renderer) {
          if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
            mountRef.current.removeChild(renderer.domElement);
          }
          renderer.dispose();
        }
        
        if (trackGeometry) trackGeometry.dispose();
        if (trackMaterial) trackMaterial.dispose();
      };
    }
  }, []);
  
  return (
    <Box
      ref={error ? null : mountRef} // Only use ref if not in error state
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        opacity: 0.3,
        ...(error && {
          // Fallback CSS background when Three.js fails
          background: `
            radial-gradient(circle at center, transparent 30%, #f5f5f5 70%),
            repeating-conic-gradient(
              from 0deg, 
              #1a237e 0deg 10deg, 
              #ffc107 10deg 20deg
            )
          `,
          opacity: 0.05,
        })
      }}
    />
  );
};

export default TrackBackground;

// Note: This is a simple Three.js example for the dashboard background.
// For a more complete implementation, you would want to add:
// 1. A 3D model of a mustang horse running around the track
// 2. Interactive elements that respond to user actions
// 3. Performance optimizations for mobile devices
// 4. Loading states and error handling 