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
const inventoryRoutes = require('./api/inventory');
const eventsRoutes = require('./api/events');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5011;

// Middleware
// CORS configuration - development only
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],  // React dev server
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/athletes', athleteRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/events', eventsRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: "Backend running" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 