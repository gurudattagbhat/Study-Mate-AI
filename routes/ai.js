const express = require('express');
const router = express.Router();
const groqService = require('../services/groqService');

// 1. AI Study Tutor Chat
router.post('/chat', async (req, res) => {
  try {
    const { message, history, subject } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message string required.' });

    const response = await groqService.chatTutor({ message, history, subject });
    res.json({ success: true, response });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ success: false, message: 'AI Tutor service error' });
  }
});

// 2. PDF & Document Analyzer
router.post('/analyze-pdf', async (req, res) => {
  try {
    const { text, fileName } = req.body;
    if (!text && !fileName) return res.status(400).json({ success: false, message: 'Document text or filename required.' });

    const analysis = await groqService.analyzeDocument({ text: text || fileName, fileName: fileName || 'Document' });
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('PDF Analyzer Error:', error);
    res.status(500).json({ success: false, message: 'PDF Analyzer service error' });
  }
});

// 2b. PDF Document Follow-Up Q&A
router.post('/analyze-pdf-followup', async (req, res) => {
  try {
    const { documentText, fileName, question, history } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'Follow-up question required.' });

    const answer = await groqService.documentFollowUp({
      documentText: documentText || '',
      fileName: fileName || 'Document',
      question,
      history: history || []
    });

    res.json({ success: true, answer });
  } catch (error) {
    console.error('PDF Follow-Up Error:', error);
    res.status(500).json({ success: false, message: 'Document Follow-Up service error' });
  }
});

// 3. AI Image OCR Scanner
router.post('/ocr-scan', async (req, res) => {
  try {
    const { extractedText } = req.body;
    const analysis = await groqService.analyzeImageText({ extractedText: extractedText || 'Scanned handwritten notes' });
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('OCR Scan Error:', error);
    res.status(500).json({ success: false, message: 'OCR Scan service error' });
  }
});

// 4. AI Quiz Generator
router.post('/generate-quiz', async (req, res) => {
  try {
    const { topic, questionCount, difficulty } = req.body;
    const quiz = await groqService.generateQuiz({ topic: topic || 'General Study', questionCount, difficulty });
    res.json({ success: true, quiz });
  } catch (error) {
    console.error('Quiz Generator Error:', error);
    res.status(500).json({ success: false, message: 'Quiz Generator service error' });
  }
});

// 5. AI Flashcard Creator
router.post('/generate-flashcards', async (req, res) => {
  try {
    const { topic, cardCount } = req.body;
    const deck = await groqService.generateFlashcards({ topic: topic || 'General Study', cardCount });
    res.json({ success: true, deck });
  } catch (error) {
    console.error('Flashcard Error:', error);
    res.status(500).json({ success: false, message: 'Flashcard service error' });
  }
});

// 6a. AI Viva Question Generator
router.post('/viva-question', async (req, res) => {
  try {
    const { topic } = req.body;
    const question = await groqService.generateVivaQuestion({ topic: topic || 'Database Management Systems' });
    res.json({ success: true, question });
  } catch (error) {
    console.error('Viva Question Error:', error);
    res.status(500).json({ success: false, message: 'Viva Question service error' });
  }
});

// 6b. AI Viva Examiner Evaluator
router.post('/viva-prep', async (req, res) => {
  try {
    const { question, answer, topic } = req.body;
    const assessment = await groqService.vivaSession({ question, answer, topic: topic || 'General Study' });
    res.json({ success: true, assessment });
  } catch (error) {
    console.error('Viva Prep Error:', error);
    res.status(500).json({ success: false, message: 'Viva Prep service error' });
  }
});

// 7. Exam Preparation Mode
router.post('/exam-prep', async (req, res) => {
  try {
    const { subject, targetDate } = req.body;
    const guide = await groqService.generateExamPrep({ subject: subject || 'General Subject', targetDate });
    res.json({ success: true, guide });
  } catch (error) {
    console.error('Exam Prep Error:', error);
    res.status(500).json({ success: false, message: 'Exam Prep service error' });
  }
});

// 8. Syllabus Analyzer
router.post('/syllabus-analyzer', async (req, res) => {
  try {
    const { syllabusText, courseName } = req.body;
    const analysis = await groqService.analyzeSyllabus({ syllabusText: syllabusText || '', courseName: courseName || 'Course' });
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Syllabus Analyzer Error:', error);
    res.status(500).json({ success: false, message: 'Syllabus Analyzer service error' });
  }
});

// 9. Weak Topic Detection
router.get('/weak-topics', async (req, res) => {
  try {
    const weakTopics = await groqService.detectWeakTopics({ quizScores: [55, 62, 68] });
    res.json({ success: true, weakTopics });
  } catch (error) {
    console.error('Weak Topics Error:', error);
    res.status(500).json({ success: false, message: 'Weak Topics service error' });
  }
});

// 10. AI Revision Planner
router.get('/revision-plan', async (req, res) => {
  try {
    const plan = await groqService.getRevisionPlan({ subjects: ['Database Systems', 'Operating Systems', 'Algorithms'] });
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Revision Plan Error:', error);
    res.status(500).json({ success: false, message: 'Revision Plan service error' });
  }
});

module.exports = router;
