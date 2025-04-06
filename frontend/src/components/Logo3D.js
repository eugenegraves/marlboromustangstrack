import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { Box } from '@mui/material';
import teamLogo from '../assets/team-logo.webp';

// Custom shaders for enhanced visual effects and color adjustment
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D logoTexture;
  uniform float contrast;
  uniform float brightness;
  uniform float saturation;
  uniform float time;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  
  void main() {
    // Sample the texture
    vec4 texColor = texture2D(logoTexture, vUv);
    
    // Skip processing fully transparent pixels
    if (texColor.a < 0.01) {
      discard;
    }
    
    // Apply subtle color adjustments
    vec3 color = texColor.rgb;
    
    // Increase contrast
    color = (color - 0.5) * contrast + 0.5;
    
    // Adjust brightness
    color = color * brightness;
    
    // Convert to grayscale for saturation adjustment
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    
    // Apply saturation - mix between grayscale and original color
    color = mix(vec3(luminance), color, saturation);
    
    // Add subtle edge enhancement based on normal
    float edgeFactor = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    edgeFactor = pow(edgeFactor, 3.0);
    
    // Add slight depth effect near edges (subtle darkening)
    color = mix(color, color * 0.9, edgeFactor * 0.3);
    
    // Subtle pulsing vignette effect
    float distFromCenter = length(vUv - 0.5) * 2.0;
    float vignette = 1.0 - distFromCenter * 0.15 * (1.0 + 0.1 * sin(time));
    color *= vignette;
    
    gl_FragColor = vec4(color, texColor.a);
  }
`;

const Logo3D = ({ width = 300, height = 200 }) => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const groupRef = useRef(null);
  const frameIdRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);
  const shaderMaterialRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Initialize scene
  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !canvasRef.current) return;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    
    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    
    // Create group for our logo
    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;
    
    // Create a texture loader
    const textureLoader = new THREE.TextureLoader();
    
    // Load the team logo texture
    textureLoader.load(
      teamLogo,
      (texture) => {
        // Set texture parameters for better quality
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        
        // Calculate aspect ratio to maintain the image proportions
        const imgAspect = texture.image.width / texture.image.height;
        const planeWidth = 3;
        const planeHeight = planeWidth / imgAspect;
        
        // Create the plane geometry with the correct aspect ratio
        const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        
        // Create material with custom shader for enhanced color control
        const shaderMaterial = new THREE.ShaderMaterial({
          uniforms: {
            logoTexture: { value: texture },
            contrast: { value: 1.15 },     // Slight contrast increase
            brightness: { value: 0.95 },   // Slight darkness
            saturation: { value: 1.1 },    // Slight saturation boost
            time: { value: 0.0 }           // For subtle animations
          },
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
          transparent: true,
          side: THREE.DoubleSide
        });
        shaderMaterialRef.current = shaderMaterial;
        
        // Create the logo mesh
        const logoMesh = new THREE.Mesh(geometry, shaderMaterial);
        group.add(logoMesh);
        
        // Create a slight glow effect around the logo
        const glowGeometry = new THREE.PlaneGeometry(planeWidth * 1.05, planeHeight * 1.05);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0xcc9900,  // Slightly darker gold color for the glow
          transparent: true,
          opacity: 0.15,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        });
        
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.position.z = -0.1;
        group.add(glowMesh);
        
        // Add ambient light to ensure the logo is visible
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight);
        
        // Add directional light for some depth
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);
        
        // Set initial loading state
        setIsLoaded(true);
        
        // Add subtle rotation animation
        gsap.to(group.rotation, {
          y: 0.1,
          x: 0.05,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
        
        // Add pulsing animation to the glow
        gsap.to(glowMaterial, {
          opacity: 0.25,
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
        
        // Add initial entry animation
        gsap.fromTo(
          group.scale,
          { x: 0, y: 0, z: 0 },
          { 
            x: 1, 
            y: 1, 
            z: 1, 
            duration: 1.2, 
            ease: "elastic.out(1, 0.5)",
            delay: 0.2
          }
        );
        
        gsap.fromTo(
          group.rotation,
          { y: -0.5 },
          {
            y: 0,
            duration: 1.5,
            ease: "power2.out"
          }
        );
      },
      // Progress callback
      undefined,
      // Error callback
      (err) => {
        console.error('Error loading logo texture:', err);
        setError(true);
      }
    );
    
    // Handle mouse move for interactive rotation
    const handleMouseMove = (event) => {
      // Calculate normalized coordinates (between -1 and 1)
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      mouseRef.current.x = ((event.clientX - centerX) / (rect.width / 2)) * 0.2;
      mouseRef.current.y = ((event.clientY - centerY) / (rect.height / 2)) * 0.2;
    };
    
    // Mouse enter/leave effects
    const handleMouseEnter = () => {
      gsap.to(group.scale, {
        x: 1.05,
        y: 1.05,
        z: 1.05,
        duration: 0.5,
        ease: "back.out(1.7)"
      });
      
      // Increase contrast on hover
      if (shaderMaterialRef.current) {
        gsap.to(shaderMaterialRef.current.uniforms.contrast, {
          value: 1.2,
          duration: 0.5,
          ease: "power2.out"
        });
        
        gsap.to(shaderMaterialRef.current.uniforms.saturation, {
          value: 1.2,
          duration: 0.5,
          ease: "power2.out"
        });
      }
    };
    
    const handleMouseLeave = () => {
      gsap.to(group.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.5,
        ease: "back.out(1.7)"
      });
      
      // Reset contrast on leave
      if (shaderMaterialRef.current) {
        gsap.to(shaderMaterialRef.current.uniforms.contrast, {
          value: 1.15,
          duration: 0.5,
          ease: "power2.out"
        });
        
        gsap.to(shaderMaterialRef.current.uniforms.saturation, {
          value: 1.1,
          duration: 0.5,
          ease: "power2.out"
        });
      }
      
      // Return to default rotation
      gsap.to(group.rotation, {
        x: 0.05,
        y: 0.1,
        duration: 1,
        ease: "elastic.out(1, 0.5)"
      });
    };
    
    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    canvasRef.current.addEventListener('mouseenter', handleMouseEnter);
    canvasRef.current.addEventListener('mouseleave', handleMouseLeave);
    
    // Render loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      // Update time uniform for shader animations
      timeRef.current += 0.01;
      if (shaderMaterialRef.current) {
        shaderMaterialRef.current.uniforms.time.value = timeRef.current;
      }
      
      // Smooth follow mouse position
      if (mouseRef.current && groupRef.current) {
        groupRef.current.rotation.y += (mouseRef.current.x - groupRef.current.rotation.y) * 0.05;
        groupRef.current.rotation.x += (mouseRef.current.y - groupRef.current.rotation.x) * 0.05;
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Cleanup function
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mouseenter', handleMouseEnter);
        canvasRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
      
      cancelAnimationFrame(frameIdRef.current);
      
      // Dispose of resources to prevent memory leaks
      if (renderer) renderer.dispose();
      
      if (scene) {
        scene.traverse((object) => {
          if (object.isMesh) {
            if (object.geometry) object.geometry.dispose();
            
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                if (object.material.map) object.material.map.dispose();
                object.material.dispose();
              }
            }
          }
        });
        scene.clear();
      }
    };
  }, [width, height]);
  
  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        width: width, 
        height: height,
        cursor: 'pointer'
      }}
    />
  );
};

export default Logo3D; 