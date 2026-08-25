const express = require('express');
const router = express.Router();
const { authMiddleware } = require('./auth');
const { jsonStore } = require('../config/db');
const { chatTutor } = require('../services/groqService');

// Get all notes for current logged in user
router.get('/', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const notes = jsonStore.get('notes') || [];
  const userNotes = notes.filter(n => n.userId === userId);
  res.json({ success: true, notes: userNotes });
});

// Create Note for User
router.post('/', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { title, subject, content, tags } = req.body;
  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Title and content are required' });
  }

  const notes = jsonStore.get('notes') || [];
  const newNote = {
    id: `note-${Date.now()}`,
    userId,
    title,
    subject: subject || 'General',
    content,
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : ['General']),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  notes.unshift(newNote);
  jsonStore.set('notes', notes);

  res.json({ success: true, note: newNote });
});

// Update Note for User
router.put('/:id', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { title, subject, content, tags } = req.body;
  const notes = jsonStore.get('notes') || [];
  const index = notes.findIndex(n => n.id === req.params.id && n.userId === userId);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Note not found or access denied' });
  }

  if (title) notes[index].title = title;
  if (subject) notes[index].subject = subject;
  if (content) notes[index].content = content;
  if (tags) notes[index].tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
  notes[index].updatedAt = new Date().toISOString();

  jsonStore.set('notes', notes);
  res.json({ success: true, note: notes[index] });
});

// Delete Note for User
router.delete('/:id', authMiddleware, (req, res) => {
  const userId = req.user.id;
  let notes = jsonStore.get('notes') || [];
  notes = notes.filter(n => !(n.id === req.params.id && n.userId === userId));
  jsonStore.set('notes', notes);
  res.json({ success: true, message: 'Note deleted successfully' });
});

// AI Summarize / Expand Note Content
router.post('/ai-summarize', authMiddleware, async (req, res) => {
  const { content, action } = req.body; // action: 'summarize' or 'expand'
  const users = jsonStore.get('users') || [];
  const user = users.find(u => u.id === req.user.id);
  const userApiKey = user?.groqApiKey || process.env.GROQ_API_KEY;

  const prompt = action === 'expand' 
    ? `Elaborate and provide detailed academic explanations, examples, and formulas for this study note:\n\n${content}`
    : `Summarize the following study note into 3 key bullet points and core terms:\n\n${content}`;

  const result = await chatTutor({
    message: prompt,
    subject: 'Note Processing',
    userApiKey
  });

  res.json({ success: true, result });
});

module.exports = router;
