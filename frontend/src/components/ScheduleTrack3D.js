import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

const ScheduleTrack3D = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const runnersRef = useRef([]);
  const frameIdRef = useRef(null);
  
  useEffect(() => {
    // Initialize scene
    const initScene = () => {
      // Scene setup
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = new THREE.Color(0xf5f5f5);
      scene.fog = new THREE.Fog(0xf5f5f5, 10, 50);
      
      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      cameraRef.current = camera;
      camera.position.set(0, 10, 20);
      camera.lookAt(0, 0, 0);
      
      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      rendererRef.current = renderer;
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0xf5f5f5, 0.3); // Semi-transparent background
      renderer.shadowMap.enabled = true;
      
      // Add canvas to DOM
      mountRef.current.appendChild(renderer.domElement);
      
      // Ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      // Directional light (sun)
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 10, 7);
      directionalLight.castShadow = true;
      scene.add(directionalLight);
      
      // Create track
      createTrack(scene);
      
      // Create runners
      createRunners(scene);
      
      // Handle window resize
      window.addEventListener('resize', handleResize);
    };
    
    // Create oval track
    const createTrack = (scene) => {
      // Track outer shape
      const trackShape = new THREE.Shape();
      
      // Parameters for the oval
      const trackWidth = 12;
      const trackLength = 20;
      const cornerRadius = 5;
      
      // Draw the oval track
      trackShape.moveTo(trackLength / 2, -trackWidth / 2);
      trackShape.lineTo(trackLength / 2, trackWidth / 2);
      trackShape.absarc(
        trackLength / 2 - cornerRadius,
        trackWidth / 2 - cornerRadius,
        cornerRadius,
        0,
        Math.PI / 2,
        false
      );
      trackShape.lineTo(-trackLength / 2 + cornerRadius, trackWidth / 2);
      trackShape.absarc(
        -trackLength / 2 + cornerRadius,
        trackWidth / 2 - cornerRadius,
        cornerRadius,
        Math.PI / 2,
        Math.PI,
        false
      );
      trackShape.lineTo(-trackLength / 2, -trackWidth / 2 + cornerRadius);
      trackShape.absarc(
        -trackLength / 2 + cornerRadius,
        -trackWidth / 2 + cornerRadius,
        cornerRadius,
        Math.PI,
        (3 * Math.PI) / 2,
        false
      );
      trackShape.lineTo(trackLength / 2 - cornerRadius, -trackWidth / 2);
      trackShape.absarc(
        trackLength / 2 - cornerRadius,
        -trackWidth / 2 + cornerRadius,
        cornerRadius,
        (3 * Math.PI) / 2,
        0,
        false
      );
      
      // Create the inner hole
      const innerHole = new THREE.Path();
      const innerWidth = trackWidth - 2;
      const innerLength = trackLength - 2;
      const innerRadius = cornerRadius - 1;
      
      innerHole.moveTo(innerLength / 2, -innerWidth / 2);
      innerHole.lineTo(innerLength / 2, innerWidth / 2);
      innerHole.absarc(
        innerLength / 2 - innerRadius,
        innerWidth / 2 - innerRadius,
        innerRadius,
        0,
        Math.PI / 2,
        false
      );
      innerHole.lineTo(-innerLength / 2 + innerRadius, innerWidth / 2);
      innerHole.absarc(
        -innerLength / 2 + innerRadius,
        innerWidth / 2 - innerRadius,
        innerRadius,
        Math.PI / 2,
        Math.PI,
        false
      );
      innerHole.lineTo(-innerLength / 2, -innerWidth / 2 + innerRadius);
      innerHole.absarc(
        -innerLength / 2 + innerRadius,
        -innerWidth / 2 + innerRadius,
        innerRadius,
        Math.PI,
        (3 * Math.PI) / 2,
        false
      );
      innerHole.lineTo(innerLength / 2 - innerRadius, -innerWidth / 2);
      innerHole.absarc(
        innerLength / 2 - innerRadius,
        -innerWidth / 2 + innerRadius,
        innerRadius,
        (3 * Math.PI) / 2,
        0,
        false
      );
      
      trackShape.holes.push(innerHole);
      
      // Create track geometry
      const extrudeSettings = {
        depth: 0.2,
        bevelEnabled: false
      };
      const trackGeometry = new THREE.ExtrudeGeometry(trackShape, extrudeSettings);
      
      // Create track material
      const trackMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff0000, // Red track
        transparent: true,
        opacity: 0.7
      });
      
      // Create track mesh
      const track = new THREE.Mesh(trackGeometry, trackMaterial);
      track.rotation.x = -Math.PI / 2; // Rotate to be horizontal
      track.receiveShadow = true;
      
      scene.add(track);
      
      // Add lane markings
      const lanes = 6;
      const laneWidth = (trackWidth - 2) / lanes;
      
      for (let i = 1; i < lanes; i++) {
        // Create lane path
        const lanePath = new THREE.Path();
        const laneDistance = -trackWidth / 2 + i * laneWidth + 1;
        
        lanePath.moveTo(trackLength / 2 - 0.5, laneDistance);
        lanePath.absarc(
          trackLength / 2 - cornerRadius,
          trackWidth / 2 - cornerRadius - (lanes - i) * laneWidth,
          cornerRadius - (lanes - i) * laneWidth / 2,
          0,
          Math.PI / 2,
          false
        );
        lanePath.lineTo(-trackLength / 2 + cornerRadius, trackWidth / 2 - (lanes - i) * laneWidth);
        lanePath.absarc(
          -trackLength / 2 + cornerRadius,
          trackWidth / 2 - cornerRadius - (lanes - i) * laneWidth,
          cornerRadius - (lanes - i) * laneWidth / 2,
          Math.PI / 2,
          Math.PI,
          false
        );
        
        // Lane points
        const lanePoints = lanePath.getPoints(50);
        const laneGeometry = new THREE.BufferGeometry().setFromPoints(lanePoints);
        
        // Lane material (white dashed lines)
        const laneMaterial = new THREE.LineDashedMaterial({
          color: 0xffffff,
          scale: 1,
          dashSize: 0.5,
          gapSize: 0.5,
        });
        
        // Create lane line
        const lane = new THREE.Line(laneGeometry, laneMaterial);
        lane.computeLineDistances(); // Required for dashed lines
        lane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        lane.position.y = 0.25; // Slightly above the track
        
        scene.add(lane);
      }
      
      // Create field (green area in the middle)
      const fieldGeometry = new THREE.PlaneGeometry(innerLength, innerWidth);
      const fieldMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x4caf50, // Green field
        transparent: true,
        opacity: 0.7
      });
      const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
      field.rotation.x = -Math.PI / 2; // Horizontal
      field.position.y = 0.1; // Slightly above ground
      field.receiveShadow = true;
      
      scene.add(field);
    };
    
    // Create runners
    const createRunners = (scene) => {
      const runnerCount = 4;
      const runners = [];
      
      for (let i = 0; i < runnerCount; i++) {
        // Create a simple runner shape (small cone)
        const runnerGeometry = new THREE.ConeGeometry(0.2, 0.6, 8);
        const runnerMaterial = new THREE.MeshPhongMaterial({
          color: i === 0 ? 0xffc107 : 0x1a237e, // First runner yellow, others navy blue
          transparent: true,
          opacity: 0.8
        });
        
        const runner = new THREE.Mesh(runnerGeometry, runnerMaterial);
        runner.rotation.x = Math.PI / 2; // Orient properly
        runner.castShadow = true;
        
        // Position on the track
        const lane = 9 - i; // Lane position
        runner.userData = {
          lane: lane,
          speed: 0.01 + (Math.random() * 0.005), // Slightly different speeds
          angle: i * Math.PI / 2, // Start at different positions
          radius: 9 - lane // Radius depends on lane
        };
        
        // Add to scene and store reference
        scene.add(runner);
        runners.push(runner);
      }
      
      runnersRef.current = runners;
    };
    
    // Handle window resize
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current && mountRef.current) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        
        rendererRef.current.setSize(width, height);
      }
    };
    
    // Animation loop
    const animate = () => {
      // Move runners along the track path
      runnersRef.current.forEach(runner => {
        const { lane, speed, radius } = runner.userData;
        
        // Update angle for circular motion
        runner.userData.angle += speed;
        const angle = runner.userData.angle;
        
        // Calculate position on the oval track
        const trackLength = 20;
        const trackWidth = 12;
        const cornerRadius = 5;
        
        let x, z;
        
        // Top straight
        if (angle % (2 * Math.PI) < Math.PI / 4 || angle % (2 * Math.PI) > 7 * Math.PI / 4) {
          x = (trackLength / 2 - cornerRadius) * Math.cos(angle * 4) + cornerRadius;
          z = -trackWidth / 2 + lane;
        } 
        // Right curve
        else if (angle % (2 * Math.PI) < 3 * Math.PI / 4) {
          const curveAngle = angle % (2 * Math.PI) - Math.PI / 4;
          x = trackLength / 2 - cornerRadius;
          z = -trackWidth / 2 + lane + cornerRadius * Math.sin(curveAngle * 2);
        }
        // Bottom straight
        else if (angle % (2 * Math.PI) < 5 * Math.PI / 4) {
          x = -(trackLength / 2 - cornerRadius) * Math.cos((angle - Math.PI) * 4) - cornerRadius;
          z = trackWidth / 2 - lane;
        }
        // Left curve
        else {
          const curveAngle = angle % (2 * Math.PI) - 5 * Math.PI / 4;
          x = -(trackLength / 2 - cornerRadius);
          z = trackWidth / 2 - lane - cornerRadius * Math.sin(curveAngle * 2);
        }
        
        // Update runner position
        runner.position.set(x, 0.4, z); // 0.4 height above track
        
        // Update orientation to face direction of movement
        runner.lookAt(
          x + Math.cos(angle),
          0.4,
          z + Math.sin(angle)
        );
      });
      
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
      
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <div 
      ref={mountRef} 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: -1, 
        opacity: 0.3, 
        pointerEvents: 'none' 
      }}
    />
  );
};

export default ScheduleTrack3D; 