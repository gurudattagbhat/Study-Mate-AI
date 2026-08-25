const express = require('express');
const router = express.Router();
const { authMiddleware } = require('./auth');
const { jsonStore } = require('../config/db');

// Get Progress & Analytics Data for current logged in user
router.get('/', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const users = jsonStore.get('users') || [];
  const user = users.find(u => u.id === userId || u.email === req.user.email) || { name: 'Student', streak: 1, exp: 100, level: 1 };
  
  const notes = (jsonStore.get('notes') || []).filter(n => n.userId === userId);
  const tasks = (jsonStore.get('tasks') || []).filter(t => t.userId === userId);
  const quizzes = (jsonStore.get('quizzes') || []).filter(q => q.userId === userId);
  const flashcards = (jsonStore.get('flashcards') || []).filter(f => f.userId === userId);

  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const masteredCards = flashcards.filter(f => f.mastered).length;

  // Build subject breakdown from user's actual notes and tasks
  const subjectStats = {};
  [...notes, ...tasks].forEach(item => {
    const subj = item.subject || 'General';
    subjectStats[subj] = (subjectStats[subj] || 0) + 1;
  });

  if (Object.keys(subjectStats).length === 0) {
    subjectStats["Computer Science"] = 2;
    subjectStats["General Study"] = 1;
  }

  const weeklyStudyHours = [3.5, 4.2, 5.0, 2.8, 6.1, 4.5, 5.8]; // Mon-Sun

  const badges = [
    { id: "b1", title: "Early Bird", description: "Completed a focus study session", icon: "🌅", unlocked: true },
    { id: "b2", title: "Streak Master", description: "Maintained active study streak", icon: "🔥", unlocked: (user.streak || 1) >= 3 },
    { id: "b3", title: "Quiz Mastermind", description: "Completed practice quizzes", icon: "🎯", unlocked: quizzes.length >= 1 },
    { id: "b4", title: "Flashcard Ninja", description: "Mastered flashcard decks", icon: "🎴", unlocked: masteredCards >= 3 },
    { id: "b5", title: "Viva Champ", description: "Scored high in AI Viva Examination", icon: "🎤", unlocked: false }
  ];

  res.json({
    success: true,
    userStats: {
      name: user.name,
      streak: user.streak || 1,
      exp: user.exp || 100,
      level: user.level || 1,
      totalNotes: notes.length,
      completedTasks,
      pendingTasks,
      totalQuizzes: quizzes.length,
      masteredCards,
      totalCards: flashcards.length
    },
    subjectStats,
    weeklyStudyHours,
    badges
  });
});

module.exports = router;
