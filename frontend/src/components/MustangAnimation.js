import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

// Custom shader for the horse with shimmering effect
const horseVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const horseFragmentShader = `
  uniform vec3 baseColor;
  uniform float time;
  uniform float shimmerIntensity;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    // Base color with normal influence
    vec3 color = baseColor;
    
    // Add lighting effect based on normals
    float lightIntensity = max(0.5, dot(vNormal, normalize(vec3(1.0, 2.0, 3.0))));
    color = color * lightIntensity;
    
    // Add shimmer effect
    float shimmer = shimmerIntensity * sin(vPosition.x * 10.0 + time * 2.0) * sin(vPosition.y * 10.0 + time * 2.0);
    color = mix(color, vec3(1.0, 0.9, 0.6), shimmer * 0.15);
    
    // Add edge highlighting
    float edgeFactor = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    edgeFactor = pow(edgeFactor, 2.0);
    color = mix(color, vec3(1.0, 0.8, 0.4), edgeFactor * 0.3);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Trail effect shader
const trailVertexShader = `
  attribute float size;
  attribute float opacity;
  attribute vec3 color;
  
  varying float vOpacity;
  varying vec3 vColor;
  
  void main() {
    vOpacity = opacity;
    vColor = color;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const trailFragmentShader = `
  varying float vOpacity;
  varying vec3 vColor;
  
  void main() {
    // Create a circular point
    float distanceFromCenter = length(gl_PointCoord - vec2(0.5));
    if (distanceFromCenter > 0.5) discard;
    
    // Smooth edges
    float alpha = smoothstep(0.5, 0.4, distanceFromCenter) * vOpacity;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

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
  const horseRef = useRef(null);
  const animationFrameRef = useRef(null);
  const clockRef = useRef(null);
  const timeRef = useRef(0);
  const materialRef = useRef(null);
  const trailParticlesRef = useRef(null);
  const trailPositionsRef = useRef([]);
  const pathPointsRef = useRef([]);
  
  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };
    
    // Initialize scene
    const initScene = () => {
      // Scene setup
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = new THREE.Color(0xffffff);
      scene.background.alpha = 0; // Transparent background
      
      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        40,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      cameraRef.current = camera;
      camera.position.set(0, 5, 15);
      camera.lookAt(0, 0, 0);
      
      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true 
      });
      rendererRef.current = renderer;
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000, 0); // Transparent background
      renderer.shadowMap.enabled = true;
      
      // Add canvas to DOM
      if (mountRef.current) {
        mountRef.current.appendChild(renderer.domElement);
      }
      
      // Ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);
      
      // Directional light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Yellow-ish light
      directionalLight.position.set(5, 10, 7);
      directionalLight.castShadow = true;
      scene.add(directionalLight);
      
      // Add point light to enhance the horse
      const pointLight = new THREE.PointLight(0xffc107, 0.7, 10);
      pointLight.position.set(0, 2, 3);
      scene.add(pointLight);
      
      // Add window resize listener
      window.addEventListener('resize', handleResize);
    };
    
    // Initialize the scene first
    initScene();
    
    // Create mustang horse model
    const createHorse = () => {
      const horseGroup = new THREE.Group();
      
      // Create shader material with uniforms
      const horseMaterial = new THREE.ShaderMaterial({
        uniforms: {
          baseColor: { value: new THREE.Color('#1C2526') },
          time: { value: 0 },
          shimmerIntensity: { value: 0.3 }
        },
        vertexShader: horseVertexShader,
        fragmentShader: horseFragmentShader
      });
      materialRef.current = horseMaterial;
      
      // Body
      const bodyGeometry = new THREE.BoxGeometry(2, 1, 3);
      const body = new THREE.Mesh(bodyGeometry, horseMaterial);
      body.position.y = 1.5;
      horseGroup.add(body);
      
      // Neck
      const neckGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.5, 8);
      neckGeometry.translate(0, 0.75, 0);
      neckGeometry.rotateX(Math.PI / 4);
      const neck = new THREE.Mesh(neckGeometry, horseMaterial);
      neck.position.set(0, 1.8, 1.2);
      horseGroup.add(neck);
      
      // Head
      const headGeometry = new THREE.BoxGeometry(0.5, 0.7, 1.2);
      const head = new THREE.Mesh(headGeometry, horseMaterial);
      head.position.set(0, 3, 1.8);
      horseGroup.add(head);
      
      // Muzzle
      const muzzleGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.8);
      const muzzle = new THREE.Mesh(muzzleGeometry, horseMaterial);
      muzzle.position.set(0, 2.8, 2.3);
      horseGroup.add(muzzle);
      
      // Ears
      const earGeometry = new THREE.ConeGeometry(0.15, 0.4, 4);
      const leftEar = new THREE.Mesh(earGeometry, horseMaterial);
      leftEar.position.set(0.2, 3.4, 1.6);
      leftEar.rotation.x = -Math.PI / 4;
      horseGroup.add(leftEar);
      
      const rightEar = leftEar.clone();
      rightEar.position.set(-0.2, 3.4, 1.6);
      horseGroup.add(rightEar);
      
      // Tail
      const tailGeometry = new THREE.CylinderGeometry(0.1, 0.2, 1.5, 6);
      tailGeometry.translate(0, -0.75, 0);
      tailGeometry.rotateX(Math.PI / 4);
      const tail = new THREE.Mesh(tailGeometry, horseMaterial);
      tail.position.set(0, 1.7, -1.5);
      horseGroup.add(tail);
      
      // Legs
      const createLeg = (x, z) => {
        const legGroup = new THREE.Group();
        
        const upperLegGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
        const upperLeg = new THREE.Mesh(upperLegGeometry, horseMaterial);
        upperLeg.position.y = -0.5;
        legGroup.add(upperLeg);
        
        const lowerLegGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 8);
        const lowerLeg = new THREE.Mesh(lowerLegGeometry, horseMaterial);
        lowerLeg.position.y = -1.5;
        legGroup.add(lowerLeg);
        
        const hoofGeometry = new THREE.BoxGeometry(0.25, 0.2, 0.35);
        const hoof = new THREE.Mesh(hoofGeometry, horseMaterial);
        hoof.position.y = -2.1;
        legGroup.add(hoof);
        
        legGroup.position.set(x, 1, z);
        
        return legGroup;
      };
      
      // Add four legs
      const frontLeftLeg = createLeg(0.7, 1);
      const frontRightLeg = createLeg(-0.7, 1);
      const backLeftLeg = createLeg(0.7, -1);
      const backRightLeg = createLeg(-0.7, -1);
      
      horseGroup.add(frontLeftLeg, frontRightLeg, backLeftLeg, backRightLeg);
      
      // Create reference object for animations
      horseGroup.userData = {
        legs: {
          frontLeft: frontLeftLeg,
          frontRight: frontRightLeg,
          backLeft: backLeftLeg,
          backRight: backRightLeg
        },
        head: head,
        neck: neck,
        tail: tail
      };
      
      return horseGroup;
    };
    
    const horse = createHorse();
    horse.scale.set(0.6, 0.6, 0.6);
    sceneRef.current.add(horse);
    horseRef.current = horse;
    
    // Create animation path (a curved path for the horse to follow)
    const createPath = () => {
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(-10, 0, -5),
        new THREE.Vector3(-5, 0, 5),
        new THREE.Vector3(5, 0, 5),
        new THREE.Vector3(10, 0, -5)
      );
      
      const points = curve.getPoints(50);
      pathPointsRef.current = points;
      
      return points;
    };
    
    // Create the path
    createPath();
    
    // Create particle trail
    const createTrail = () => {
      const particleCount = 100;
      const positions = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      const opacities = new Float32Array(particleCount);
      const colors = new Float32Array(particleCount * 3);
      
      // Initialize particles with zero positions and full transparency
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
        
        sizes[i] = 3.0 + Math.random() * 2.0;
        opacities[i] = 0;
        
        // Golden color with slight variations
        colors[i * 3] = 1.0; // R
        colors[i * 3 + 1] = 0.8 + Math.random() * 0.2; // G
        colors[i * 3 + 2] = 0.4 + Math.random() * 0.2; // B
      }
      
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      const material = new THREE.ShaderMaterial({
        uniforms: {},
        vertexShader: trailVertexShader,
        fragmentShader: trailFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      
      const particles = new THREE.Points(geometry, material);
      sceneRef.current.add(particles);
      
      trailParticlesRef.current = particles;
      trailPositionsRef.current = [];
      
      return particles;
    };
    
    // Create the trail
    createTrail();
    
    // Clock for animations
    clockRef.current = new THREE.Clock();
    
    // Animate horse galloping and movement along path
    const setupAnimations = () => {
      const horse = horseRef.current;
      const legs = horse.userData.legs;
      
      // Leg movement animation
      const legTimeline = gsap.timeline({
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      
      // Front legs animation
      legTimeline.to(
        legs.frontLeft.rotation, 
        { x: -0.3, duration: 0.2 },
        0
      );
      legTimeline.to(
        legs.frontRight.rotation, 
        { x: 0.3, duration: 0.2 },
        0
      );
      
      // Back legs animation slightly offset
      legTimeline.to(
        legs.backLeft.rotation, 
        { x: 0.3, duration: 0.2 },
        0.1
      );
      legTimeline.to(
        legs.backRight.rotation, 
        { x: -0.3, duration: 0.2 },
        0.1
      );
      
      // Head bobbing animation
      gsap.to(
        horse.userData.head.rotation, 
        {
          x: 0.1,
          duration: 1.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        }
      );
      
      // Tail swishing animation
      gsap.to(
        horse.userData.tail.rotation, 
        {
          z: 0.3,
          duration: 1.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        }
      );
      
      // Subtle body bouncing animation
      gsap.to(
        horse.position, 
        {
          y: 0.2,
          duration: 0.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        }
      );
      
      // Path animation
      const points = pathPointsRef.current;
      let currentPoint = 0;
      
      const moveHorseAlongPath = () => {
        const targetPoint = points[currentPoint];
        
        // Calculate direction to face
        if (currentPoint < points.length - 1) {
          const nextPoint = points[currentPoint + 1];
          const direction = new THREE.Vector3().subVectors(nextPoint, targetPoint).normalize();
          
          // Make the horse face the direction of movement
          const angle = Math.atan2(direction.x, direction.z);
          gsap.to(horse.rotation, {
            y: angle,
            duration: 0.5,
            ease: "sine.inOut"
          });
        }
        
        // Move to the point
        gsap.to(horse.position, {
          x: targetPoint.x,
          z: targetPoint.z,
          duration: 0.5,
          ease: "sine.inOut",
          onComplete: () => {
            // Update trail positions
            updateTrailPosition(horse.position.clone());
            
            // Move to next point
            currentPoint = (currentPoint + 1) % points.length;
            moveHorseAlongPath();
          }
        });
      };
      
      // Start the movement
      moveHorseAlongPath();
    };
    
    // Update the trail positions
    const updateTrailPosition = (position) => {
      trailPositionsRef.current.unshift({
        position: position.clone(),
        time: clockRef.current.getElapsedTime()
      });
      
      // Limit the number of trail positions
      if (trailPositionsRef.current.length > 100) {
        trailPositionsRef.current.pop();
      }
    };
    
    // Setup animations
    setupAnimations();
    
    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Update time for shaders
      const time = clockRef.current.getElapsedTime();
      timeRef.current = time;
      
      if (materialRef.current) {
        materialRef.current.uniforms.time.value = time;
      }
      
      // Update trail particles
      if (trailParticlesRef.current) {
        const positions = trailParticlesRef.current.geometry.getAttribute('position');
        const opacities = trailParticlesRef.current.geometry.getAttribute('opacity');
        const sizes = trailParticlesRef.current.geometry.getAttribute('size');
        
        // Update each particle in the trail
        for (let i = 0; i < trailPositionsRef.current.length; i++) {
          if (i < positions.count) {
            const trailPos = trailPositionsRef.current[i];
            const timeDiff = time - trailPos.time;
            
            // Position
            positions.setXYZ(
              i, 
              trailPos.position.x,
              trailPos.position.y - 0.5 + Math.sin(time * 5 + i) * 0.1, // Add some wave effect
              trailPos.position.z
            );
            
            // Opacity (fade out based on time)
            opacities.setX(i, Math.max(0, 1 - timeDiff * 2));
            
            // Size (shrink over time)
            sizes.setX(i, Math.max(1, 5 - timeDiff * 5));
          }
        }
        
        positions.needsUpdate = true;
        opacities.needsUpdate = true;
        sizes.needsUpdate = true;
      }
      
      // Render the scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    // Start animation
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      
      // Dispose geometries and materials
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object.isMesh) {
            object.geometry.dispose();
            
            if (object.material.isMaterial) {
              object.material.dispose();
            } else {
              // Handle array of materials
              for (const material of object.material) {
                if (material.isMaterial) {
                  material.dispose();
                }
              }
            }
          }
        });
        
        sceneRef.current.clear();
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