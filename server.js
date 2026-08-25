const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./config/db');
const { router: authRoutes } = require('./routes/auth');
const aiRoutes = require('./routes/ai');
const notesRoutes = require('./routes/notes');
const tasksRoutes = require('./routes/tasks');
const quizzesRoutes = require('./routes/quizzes');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/quizzes', quizzesRoutes);
app.use('/api/analytics', analyticsRoutes);

// Fallback single page router
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API Endpoint Not Found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database & start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Study Mate AI Server running on http://localhost:${PORT}`);
    console.log(`🎨 Themes: Light Mode (Default Warm Slate) & Slate Dark Mode`);
    console.log(`==================================================\n`);
  });
});
