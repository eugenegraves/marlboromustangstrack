import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Box } from '@mui/material';
import teamLogo from '../assets/team-logo.webp';

// Custom fragment shader for enhanced vibrance
const fragmentShader = `
  uniform sampler2D map;
  uniform float time;
  varying vec2 vUv;
  
  void main() {
    vec4 texColor = texture2D(map, vUv);
    
    // Enhance vibrance
    float saturation = 1.4; // Increased saturation
    float brightness = 1.1; // Slightly increased brightness
    float contrast = 1.2; // More contrast
    
    // Calculate luminance (brightness)
    float luminance = 0.299 * texColor.r + 0.587 * texColor.g + 0.114 * texColor.b;
    
    // Apply saturation (mix between color and luminance)
    vec3 saturatedColor = mix(vec3(luminance), texColor.rgb, saturation);
    
    // Apply contrast
    vec3 contrastedColor = (saturatedColor - 0.5) * contrast + 0.5;
    
    // Apply brightness
    vec3 brightColor = contrastedColor * brightness;
    
    // Apply subtle pulsing glow effect
    float pulse = 0.05 * sin(time * 2.0) + 1.0;
    brightColor *= pulse;
    
    // Preserve original alpha
    gl_FragColor = vec4(brightColor, texColor.a);
  }
`;

// Custom vertex shader
const vertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const Logo3D = ({ width = 180, height = 180 }) => {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const animationIdRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Initialize Three.js scene
  useEffect(() => {
    // Clear any existing content in the mount element first
    if (mountRef.current) {
      while (mountRef.current.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }
    }

    // Cancel any existing animation frame
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }

    // Dispose previous renderer if it exists
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    if (!mountRef.current) return;

    let scene;
    let camera;
    let texture;
    let logoMaterial;
    let customShaderMaterial;
    let logoGeometry;
    let logoMesh;
    let clock;

    try {
      // Create scene
      scene = new THREE.Scene();
      sceneRef.current = scene;
      clock = new THREE.Clock();
      
      // Create camera
      camera = new THREE.PerspectiveCamera(
        50, // field of view
        width / height, // aspect ratio
        0.1, // near clipping plane
        1000 // far clipping plane
      );
      camera.position.z = 1.5;

      // Create renderer with higher precision for vibrant colors
      const renderer = new THREE.WebGLRenderer({ 
        alpha: true, // transparent background
        antialias: true,
        precision: 'highp', // High precision for better color rendering
        preserveDrawingBuffer: true // Needed for certain post-processing effects
      });
      rendererRef.current = renderer;
      
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0); // transparent background
      
      // Enable tone mapping for more vibrant colors
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2; // Slightly brighter exposure
      renderer.outputColorSpace = THREE.SRGBColorSpace; // Updated from outputEncoding
      
      // Add canvas to the DOM
      mountRef.current.appendChild(renderer.domElement);

      // Load the logo texture with enhanced settings
      const textureLoader = new THREE.TextureLoader();
      texture = textureLoader.load(
        teamLogo,
        (loadedTexture) => {
          // Enhance texture properties
          loadedTexture.colorSpace = THREE.SRGBColorSpace; // Updated from encoding
          loadedTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
          loadedTexture.needsUpdate = true;
          
          // Create custom shader material once texture is loaded
          customShaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
              map: { value: loadedTexture },
              time: { value: 0.0 }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
          });
          
          // Update mesh with custom shader material
          if (logoMesh) {
            logoMesh.material = customShaderMaterial;
          }
          
          setIsLoaded(true);
        },
        undefined, // onProgress callback not supported
        (err) => {
          console.error('Error loading texture:', err);
          setError(true);
        }
      );
      
      // Create a plane geometry for the logo
      logoGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);
      
      // Set aspect ratio based on the original logo
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        
        // Update geometry to match aspect ratio
        if (logoMesh) {
          logoMesh.scale.set(aspectRatio, 1, 1);
        }
      };
      img.src = teamLogo;
      
      // Initially use a placeholder material while texture loads
      logoMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.0 // Start invisible until shader loads
      });
      
      // Create mesh and add to scene
      logoMesh = new THREE.Mesh(logoGeometry, logoMaterial);
      
      // Add lights to enhance the scene
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      const pointLight = new THREE.PointLight(0xffffff, 0.8);
      pointLight.position.set(0, 0, -1);
      scene.add(pointLight);
      
      scene.add(logoMesh);
      
      // Animation function
      const animate = () => {
        animationIdRef.current = requestAnimationFrame(animate);
        
        const elapsedTime = clock.getElapsedTime();
        
        // Gentle floating animation
        logoMesh.rotation.y = Math.sin(elapsedTime * 0.5) * 0.2;
        logoMesh.position.y = Math.sin(elapsedTime * 0.75) * 0.05;
        
        // Update shader time uniform
        if (customShaderMaterial && customShaderMaterial.uniforms) {
          customShaderMaterial.uniforms.time.value = elapsedTime;
        }
        
        renderer.render(scene, camera);
      };
      
      // Start animation
      animate();
      
      // Handle window resize
      const handleResize = () => {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
          animationIdRef.current = null;
        }
        
        // Remove canvas from DOM
        if (mountRef.current && renderer.domElement) {
          if (mountRef.current.contains(renderer.domElement)) {
            mountRef.current.removeChild(renderer.domElement);
          }
        }
        
        // Dispose resources
        if (logoGeometry) logoGeometry.dispose();
        if (logoMaterial) logoMaterial.dispose();
        if (customShaderMaterial) customShaderMaterial.dispose();
        if (texture) texture.dispose();
        
        // Dispose renderer
        if (renderer) {
          renderer.dispose();
          rendererRef.current = null;
        }
        
        // Clear scene
        if (scene) {
          scene.clear();
          sceneRef.current = null;
        }
      };
    } catch (err) {
      console.error('Error initializing 3D logo:', err);
      setError(true);
      
      // Cleanup on error
      return () => {
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
          animationIdRef.current = null;
        }
        
        if (rendererRef.current && mountRef.current) {
          const canvas = rendererRef.current.domElement;
          if (mountRef.current.contains(canvas)) {
            mountRef.current.removeChild(canvas);
          }
          rendererRef.current.dispose();
          rendererRef.current = null;
        }
        
        if (sceneRef.current) {
          sceneRef.current.clear();
          sceneRef.current = null;
        }
      };
    }
  }, [width, height]);

  return (
    <Box
      ref={mountRef}
      sx={{
        width,
        height,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))', // Enhanced glow around the logo
        margin: '0 auto', // Ensure the box itself is centered
        ...(error && {
          // Fallback to regular image if Three.js fails, but with enhanced filters
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${teamLogo})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'contrast(1.2) saturate(1.5) brightness(1.1)', // Enhanced fallback image
          }
        }),
        ...((!isLoaded && !error) && {
          // Show loading placeholder
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '40px',
            height: '40px',
            marginTop: '-20px',
            marginLeft: '-20px',
            borderRadius: '50%',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTopColor: '#ffc107',
            animation: 'spin 1s linear infinite',
            '@keyframes spin': {
              to: { transform: 'rotate(360deg)' }
            }
          }
        })
      }}
    />
  );
};

export default Logo3D; 