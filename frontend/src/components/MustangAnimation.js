import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

/**
 * MustangAnimation component - Creates a simple 3D animation of a mustang horse
 * running across the screen above the Upcoming Events section.
 */
const MustangAnimation = ({ containerHeight = 100 }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const mustangRef = useRef(null);
  const frameIdRef = useRef(null);
  
  useEffect(() => {
    // Initialize scene
    const initScene = () => {
      // Scene setup
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = new THREE.Color(0xffffff);
      scene.background.alpha = 0; // Transparent background
      
      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / (containerHeight || 100),
        0.1,
        1000
      );
      cameraRef.current = camera;
      camera.position.set(0, 1, 10);
      camera.lookAt(0, 0, 0);
      
      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true 
      });
      rendererRef.current = renderer;
      renderer.setSize(window.innerWidth, containerHeight || 100);
      renderer.setClearColor(0x000000, 0); // Transparent background
      renderer.shadowMap.enabled = true;
      
      // Add canvas to DOM
      if (mountRef.current) {
        mountRef.current.appendChild(renderer.domElement);
      }
      
      // Ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      
      // Directional light
      const directionalLight = new THREE.DirectionalLight(0xffc107, 0.8); // Yellow-ish light
      directionalLight.position.set(5, 5, 7);
      directionalLight.castShadow = true;
      scene.add(directionalLight);
      
      // Create mustang
      createMustang(scene);
      
      // Handle window resize
      window.addEventListener('resize', handleResize);
    };
    
    // Create simple mustang model
    const createMustang = (scene) => {
      // Create a group for the mustang
      const mustangGroup = new THREE.Group();
      
      // Body (elongated box)
      const bodyGeometry = new THREE.BoxGeometry(2, 0.8, 1);
      const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x1a237e }); // Navy blue
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;
      body.position.y = 1;
      mustangGroup.add(body);
      
      // Head (slightly smaller box)
      const headGeometry = new THREE.BoxGeometry(0.7, 0.5, 0.5);
      const headMaterial = new THREE.MeshPhongMaterial({ color: 0x1a237e }); // Navy blue
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(1.2, 1.3, 0);
      head.castShadow = true;
      mustangGroup.add(head);
      
      // Mane (yellow)
      const maneGeometry = new THREE.BoxGeometry(0.8, 0.2, 0.6);
      const maneMaterial = new THREE.MeshPhongMaterial({ color: 0xffc107 }); // Yellow
      const mane = new THREE.Mesh(maneGeometry, maneMaterial);
      mane.position.set(0.9, 1.5, 0);
      mane.castShadow = true;
      mustangGroup.add(mane);
      
      // Legs (4 thin boxes)
      const legGeometry = new THREE.BoxGeometry(0.2, 1, 0.2);
      const legMaterial = new THREE.MeshPhongMaterial({ color: 0x1a237e }); // Navy blue
      
      // Front left leg
      const frontLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
      frontLeftLeg.position.set(0.7, 0.5, 0.4);
      frontLeftLeg.castShadow = true;
      frontLeftLeg.userData = { type: 'leg', position: 'frontLeft' };
      mustangGroup.add(frontLeftLeg);
      
      // Front right leg
      const frontRightLeg = new THREE.Mesh(legGeometry, legMaterial);
      frontRightLeg.position.set(0.7, 0.5, -0.4);
      frontRightLeg.castShadow = true;
      frontRightLeg.userData = { type: 'leg', position: 'frontRight' };
      mustangGroup.add(frontRightLeg);
      
      // Back left leg
      const backLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
      backLeftLeg.position.set(-0.7, 0.5, 0.4);
      backLeftLeg.castShadow = true;
      backLeftLeg.userData = { type: 'leg', position: 'backLeft' };
      mustangGroup.add(backLeftLeg);
      
      // Back right leg
      const backRightLeg = new THREE.Mesh(legGeometry, legMaterial);
      backRightLeg.position.set(-0.7, 0.5, -0.4);
      backRightLeg.castShadow = true;
      backRightLeg.userData = { type: 'leg', position: 'backRight' };
      mustangGroup.add(backRightLeg);
      
      // Tail
      const tailGeometry = new THREE.CylinderGeometry(0.05, 0.15, 0.8, 8);
      const tailMaterial = new THREE.MeshPhongMaterial({ color: 0xffc107 }); // Yellow
      const tail = new THREE.Mesh(tailGeometry, tailMaterial);
      tail.position.set(-1.3, 1.1, 0);
      tail.rotation.z = Math.PI / 4; // 45 degrees
      tail.castShadow = true;
      mustangGroup.add(tail);
      
      // Position the whole mustang
      mustangGroup.position.set(-10, 0, 0); // Start off-screen to the left
      mustangGroup.scale.set(0.7, 0.7, 0.7); // Scale down a bit
      
      scene.add(mustangGroup);
      mustangRef.current = mustangGroup;
      
      // Set up animation for running across screen
      gsap.to(mustangGroup.position, {
        x: 15, // Move to off-screen right
        duration: 8,
        ease: "power1.inOut",
        repeat: -1, // Infinite repetition
        repeatDelay: 2,
        onRepeat: () => {
          // Reset position to start again
          mustangGroup.position.x = -15;
        }
      });
    };
    
    // Handle window resize
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current && mountRef.current) {
        const width = window.innerWidth;
        const height = containerHeight || 100;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        
        rendererRef.current.setSize(width, height);
      }
    };
    
    // Animation loop for running motion
    const animate = () => {
      if (mustangRef.current) {
        // Find legs and animate them
        mustangRef.current.children.forEach(child => {
          if (child.userData && child.userData.type === 'leg') {
            const time = Date.now() * 0.005;
            const legPosition = child.userData.position;
            
            // Create running motion by rotating legs
            if (legPosition === 'frontLeft' || legPosition === 'backRight') {
              child.rotation.x = Math.sin(time) * 0.5;
            } else {
              child.rotation.x = Math.sin(time + Math.PI) * 0.5;
            }
          }
        });
      }
      
      // Render scene
      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      // Continue animation loop
      frameIdRef.current = requestAnimationFrame(animate);
    };
    
    // Initialize and start animation
    initScene();
    animate();
    
    // Cleanup on component unmount
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      
      if (mountRef.current && rendererRef.current && rendererRef.current.domElement) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      
      window.removeEventListener('resize', handleResize);
      
      // Dispose Three.js resources
      if (mustangRef.current) {
        mustangRef.current.children.forEach(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      }
    };
  }, [containerHeight]);
  
  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: '100%', 
        height: `${containerHeight || 100}px`, 
        overflow: 'hidden',
        position: 'relative',
        marginBottom: '-20px', // Overlap with content below
        pointerEvents: 'none' // Don't capture mouse events
      }}
    />
  );
};

export default MustangAnimation; 