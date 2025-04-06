import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, TextField, Button, Typography, Paper, Alert, CircularProgress, useTheme, styled } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import gsap from 'gsap';
import Logo3D from '../components/Logo3D';

// Styled components for enhanced UI
const LoginContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
  position: 'relative',
  overflow: 'hidden',
}));

const LoginPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderRadius: 16,
  width: '100%',
  maxWidth: 450,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  position: 'relative',
  zIndex: 10,
  overflow: 'hidden', // Prevent content overflow
}));

const LogoContainer = styled(Box)({
  marginBottom: 24,
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
});

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  '& .MuiOutlinedInput-root': {
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
    },
    '&.Mui-focused': {
      transform: 'scale(1.02)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
  },
}));

const LoginButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
  padding: theme.spacing(1.2, 0),
  fontSize: '1rem',
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
    transform: 'translateX(-100%)',
  },
  '&:hover::after': {
    transform: 'translateX(100%)',
    transition: 'transform 0.6s',
  },
}));

// Background particles component
const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const theme = useTheme();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createParticles();
    };
    
    const createParticles = () => {
      particles = [];
      const particleCount = Math.floor(window.innerWidth / 10);
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedX: Math.random() * 1 - 0.5,
          speedY: Math.random() * 1 - 0.5,
          opacity: Math.random() * 0.5 + 0.1
        });
      }
    };
    
    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
        ctx.fill();
        
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Boundary check
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
      });
      
      animationFrameId = requestAnimationFrame(drawParticles);
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    drawParticles();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1
      }}
    />
  );
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const formRef = useRef(null);
  const titleRef = useRef(null);
  const errorRef = useRef(null);
  const theme = useTheme();
  
  useEffect(() => {
    // First set initial opacity to 1 for all elements to ensure they're visible after animation
    if (titleRef.current) {
      gsap.set(titleRef.current, { opacity: 1 });
    }
    
    if (formRef.current) {
      gsap.set(formRef.current.querySelector('.logo-container'), { opacity: 1 });
      gsap.set(formRef.current.querySelectorAll('.MuiTextField-root'), { opacity: 1 });
      gsap.set(formRef.current.querySelector('.login-button'), { opacity: 1 });
    }
    
    // Animation timeline for initial load
    const tl = gsap.timeline();
    
    tl.fromTo(titleRef.current, 
      { y: -50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", clearProps: "all" }
    )
    .fromTo(formRef.current.querySelector('.logo-container'),
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "elastic.out(1, 0.8)", clearProps: "all" },
      "-=0.4"
    )
    .fromTo(formRef.current.querySelectorAll('.MuiTextField-root'),
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.2, duration: 0.6, ease: "power2.out", clearProps: "all" },
      "-=0.6"
    )
    .fromTo(formRef.current.querySelector('.login-button'),
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)", clearProps: "all" },
      "-=0.2"
    );
  }, []);
  
  // Animation for error message
  useEffect(() => {
    if (error && errorRef.current) {
      gsap.fromTo(errorRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", clearProps: "all" }
      );
    }
  }, [error]);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Button press animation
      gsap.to(e.currentTarget, {
        scale: 0.95,
        duration: 0.1,
        ease: "power1.in",
        onComplete: () => {
          gsap.to(e.currentTarget, {
            scale: 1,
            duration: 0.3,
            ease: "elastic.out(1, 0.5)",
            clearProps: "scale"
          });
        }
      });
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Success animation
      const loginForm = formRef.current;
      gsap.to(loginForm, {
        y: -20,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => {
          // No need to reset as we're navigating away
          navigate('/dashboard');
        }
      });
      
    } catch (err) {
      let errorMessage = 'Failed to log in';
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection';
      }
      
      setError(errorMessage);
      setLoading(false);
      
      // Error shake animation
      gsap.to(formRef.current, {
        x: 10,
        duration: 0.1,
        repeat: 3,
        yoyo: true,
        ease: "power2.inOut",
        clearProps: "x" // Clear the transform after animation
      });
    }
  };
  
  return (
    <LoginContainer>
      <ParticleBackground />
      
      <Container maxWidth="sm" sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2, sm: 3 } // Add responsive padding
      }}>
        <Box ref={titleRef} textAlign="center" mb={3} position="relative" zIndex={10} width="100%">
          <Typography 
            variant="h2" 
            color="white" 
            fontWeight="bold"
            sx={{ 
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              letterSpacing: '-0.02em'
            }}
          >
            Mustangs Track System
          </Typography>
        </Box>
        
        <LoginPaper ref={formRef}>
          <LogoContainer className="logo-container">
            <Logo3D width={200} height={120} />
          </LogoContainer>
          
          <Typography variant="h4" component="h1" gutterBottom textAlign="center" fontWeight="bold">
            Login
          </Typography>
          
          {error && (
            <Box ref={errorRef} width="100%" mb={3}>
              <Alert severity="error" variant="filled">
                {error}
              </Alert>
            </Box>
          )}
          
          <Box component="form" width="100%" onSubmit={handleLogin}>
            <StyledTextField
              label="Email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              type="email"
              required
            />
            
            <StyledTextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            
            <LoginButton
              type="submit"
              fullWidth
              variant="contained"
              color="secondary"
              className="login-button"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
            </LoginButton>
          </Box>
        </LoginPaper>
      </Container>
    </LoginContainer>
  );
} 