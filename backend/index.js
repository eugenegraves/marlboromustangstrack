const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
const serviceAccount = require('./config/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Import API routes
const uploadRoutes = require('./api/upload');
const athleteRoutes = require('./api/athletes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5011;

// Middleware
// CORS configuration - development only
app.use(cors({
  origin: '*',  // Allow all origins (not recommended for production)
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/athletes', athleteRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: "Backend running" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 