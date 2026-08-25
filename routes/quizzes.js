const express = require('express');
const router = express.Router();
const { authMiddleware } = require('./auth');
const { jsonStore } = require('../config/db');
const groqService = require('../services/groqService');

// Helper key check
const getUserKey = (req) => {
  const users = jsonStore.get('users') || [];
  const user = users.find(u => u.id === req.user?.id);
  return user?.groqApiKey || process.env.GROQ_API_KEY;
};

// Generate AI Quiz
router.post('/generate', authMiddleware, async (req, res) => {
  const { topic, questionCount, difficulty } = req.body;
  const userApiKey = getUserKey(req);

  const quizData = await groqService.generateQuiz({
    topic: topic || 'Computer Science',
    questionCount: questionCount || 5,
    difficulty: difficulty || 'Medium',
    userApiKey
  });

  res.json({ success: true, quiz: quizData });
});

// Record Quiz Score
router.post('/result', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { title, subject, score, totalQuestions } = req.body;
  const quizzes = jsonStore.get('quizzes') || [];
  
  const newResult = {
    id: `quiz-${Date.now()}`,
    userId,
    title: title || 'Practice Quiz',
    subject: subject || 'General',
    score: score || 0,
    totalQuestions: totalQuestions || 5,
    date: new Date().toISOString().split('T')[0]
  };

  quizzes.unshift(newResult);
  jsonStore.set('quizzes', quizzes);

  // Update user EXP
  const users = jsonStore.get('users') || [];
  const userIndex = users.findIndex(u => u.id === userId || u.email === req.user.email);
  if (userIndex !== -1) {
    users[userIndex].exp = (users[userIndex].exp || 1250) + (score * 10);
    users[userIndex].level = Math.floor(users[userIndex].exp / 500) + 1;
    jsonStore.set('users', users);
  }

  res.json({ success: true, result: newResult, expGained: score * 10 });
});

// Get User Specific Quiz Results History
router.get('/history', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const quizzes = jsonStore.get('quizzes') || [];
  const userQuizzes = quizzes.filter(q => q.userId === userId);
  res.json({ success: true, quizzes: userQuizzes });
});

// Get User Specific Flashcard Decks & Cards
router.get('/flashcards', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const flashcards = jsonStore.get('flashcards') || [];
  const userCards = flashcards.filter(f => f.userId === userId);
  res.json({ success: true, flashcards: userCards });
});

// Generate AI Flashcards for User
router.post('/flashcards/generate', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { topic, cardCount } = req.body;
  const userApiKey = getUserKey(req);

  const deck = await groqService.generateFlashcards({
    topic: topic || 'Web Development',
    cardCount: cardCount || 5,
    userApiKey
  });

  const flashcards = jsonStore.get('flashcards') || [];
  const createdCards = (deck.cards || []).map((c, i) => ({
    id: `fc-${Date.now()}-${i}`,
    userId,
    deck: deck.deckName || topic,
    front: c.front,
    back: c.back,
    mastered: false
  }));

  flashcards.push(...createdCards);
  jsonStore.set('flashcards', flashcards);

  res.json({ success: true, deckName: deck.deckName, cards: createdCards });
});

// Toggle Flashcard Mastery for User
router.patch('/flashcards/:id/master', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const flashcards = jsonStore.get('flashcards') || [];
  const card = flashcards.find(c => c.id === req.params.id && c.userId === userId);
  if (card) {
    card.mastered = !card.mastered;
    jsonStore.set('flashcards', flashcards);
  }
  res.json({ success: true, card });
});

// YouTube Dynamic AI Educational Video Search & Recommender via Groq LLM
router.get('/youtube-recommendations', authMiddleware, async (req, res) => {
  const query = (req.query.q || 'Data Structures & Algorithms').trim();

  try {
    const aiData = await groqService.recommendYoutubeVideos({ query });
    const videos = (aiData && Array.isArray(aiData.videos)) ? aiData.videos : [];
    res.json({ success: true, topic: query, videos });
  } catch (err) {
    console.error('Groq AI YouTube search error:', err);
    res.status(500).json({ success: false, message: 'AI Search error' });
  }
});

module.exports = router;
