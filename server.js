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

// Ensure Database Connection for Serverless Functions
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Serverless DB connection error:', err);
  }
  next();
});

// Static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/quizzes', quizzesRoutes);
app.use('/api/analytics', analyticsRoutes);

// Fallback single page & HTML router
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API Endpoint Not Found' });
  }

  const reqPath = req.path === '/' ? 'index.html' : req.path.replace(/^\//, '');
  const targetFile = path.join(__dirname, 'public', reqPath);

  res.sendFile(targetFile, (err) => {
    if (err) {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
  });
});

// Start server locally when executed directly
if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`\n==================================================`);
      console.log(`🚀 Study Mate AI Server running on http://localhost:${PORT}`);
      console.log(`🎨 Themes: Light Mode (Default Warm Slate) & Slate Dark Mode`);
      console.log(`==================================================\n`);
    });
  });
}

module.exports = app;

