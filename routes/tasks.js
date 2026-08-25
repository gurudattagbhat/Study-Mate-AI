const express = require('express');
const router = express.Router();
const { authMiddleware } = require('./auth');
const { jsonStore } = require('../config/db');
const groqService = require('../services/groqService');

// Get all Tasks & Assignments for current logged in user
router.get('/', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const tasks = jsonStore.get('tasks') || [];
  const userTasks = tasks.filter(t => t.userId === userId);
  res.json({ success: true, tasks: userTasks });
});

// Create Task or Assignment
router.post('/', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { title, subject, type, dueDate, priority, weightage, aiSubtasks } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

  const tasks = jsonStore.get('tasks') || [];
  const newTask = {
    id: `task-${Date.now()}`,
    userId,
    title,
    subject: subject || 'General',
    type: type || 'todo', // 'todo' or 'assignment'
    dueDate: dueDate || new Date().toISOString().split('T')[0],
    priority: priority || 'medium',
    completed: false,
    weightage: weightage || '',
    aiSubtasks: aiSubtasks || [`Review core definitions for ${title}`, `Practice sample exercise`]
  };

  tasks.unshift(newTask);
  jsonStore.set('tasks', tasks);
  res.json({ success: true, task: newTask });
});

// Toggle Task Completion
router.patch('/:id/toggle', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const tasks = jsonStore.get('tasks') || [];
  const task = tasks.find(t => t.id === req.params.id && t.userId === userId);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  task.completed = !task.completed;
  jsonStore.set('tasks', tasks);

  res.json({ success: true, completed: task.completed });
});

// Delete Task
router.delete('/:id', authMiddleware, (req, res) => {
  const userId = req.user.id;
  let tasks = jsonStore.get('tasks') || [];
  tasks = tasks.filter(t => !(t.id === req.params.id && t.userId === userId));
  jsonStore.set('tasks', tasks);
  res.json({ success: true, message: 'Task deleted' });
});

// Get User Specific Timetable
router.get('/timetable', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const timetable = jsonStore.get('timetable') || [];
  const userTimetable = timetable.filter(t => t.userId === userId);
  res.json({ success: true, timetable: userTimetable });
});

// Save Timetable Entry for User
router.post('/timetable', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { day, time, subject, room } = req.body;
  const timetable = jsonStore.get('timetable') || [];
  const newEntry = {
    id: `tt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userId,
    day: day || 'Monday',
    time: time || '10:00 AM - 11:30 AM',
    subject: subject || 'Core Course',
    room: room || 'LH-101'
  };
  timetable.push(newEntry);
  jsonStore.set('timetable', timetable);
  res.json({ success: true, entry: newEntry });
});

// Delete Timetable Entry
router.delete('/timetable/:id', authMiddleware, (req, res) => {
  const userId = req.user.id;
  let timetable = jsonStore.get('timetable') || [];
  const targetId = req.params.id;

  // Handle by id or by index for backwards compatibility
  const numericIdx = parseInt(targetId);
  const userEntries = timetable.filter(t => t.userId === userId);

  if (!isNaN(numericIdx) && numericIdx >= 0 && numericIdx < userEntries.length) {
    const itemToRemove = userEntries[numericIdx];
    timetable = timetable.filter(t => t !== itemToRemove);
  } else {
    timetable = timetable.filter(t => !(t.id === targetId && t.userId === userId));
  }

  jsonStore.set('timetable', timetable);
  const remainingUserTimetable = timetable.filter(t => t.userId === userId);
  res.json({ success: true, timetable: remainingUserTimetable });
});

// Get User Specific Reminders
router.get('/reminders', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const reminders = jsonStore.get('reminders') || [];
  const userReminders = reminders.filter(r => r.userId === userId);
  res.json({ success: true, reminders: userReminders });
});

// Create User Specific Reminder
router.post('/reminders', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { title, time } = req.body;
  const reminders = jsonStore.get('reminders') || [];
  const newReminder = {
    id: `rem-${Date.now()}`,
    userId,
    title: title || 'Study Session Alert',
    time: time || 'In 30 minutes',
    active: true
  };
  reminders.unshift(newReminder);
  jsonStore.set('reminders', reminders);
  res.json({ success: true, reminder: newReminder });
});

// AI Schedule Auto-Import Endpoint (Parse Routine PDF/Photo for User)
router.post('/ai-import-schedule', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { extractedText } = req.body;
    if (!extractedText) {
      return res.status(400).json({ success: false, message: 'Schedule text is required!' });
    }

    const parsed = await groqService.parseScheduleWithAI({ rawText: extractedText });

    // Store Timetable for User
    if (parsed.timetable && parsed.timetable.length > 0) {
      let currentTimetable = jsonStore.get('timetable') || [];
      parsed.timetable.forEach(slot => {
        currentTimetable.push({
          id: `tt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          userId,
          day: slot.day || 'Monday',
          time: slot.time || '10:00 AM - 11:30 AM',
          subject: slot.subject || 'Core Course',
          room: slot.room || 'LH-101'
        });
      });
      jsonStore.set('timetable', currentTimetable);
    }

    // Store Todos / Tasks for User
    if (parsed.todos && parsed.todos.length > 0) {
      let currentTasks = jsonStore.get('tasks') || [];
      parsed.todos.forEach(t => {
        currentTasks.unshift({
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          userId,
          title: t.title || 'Extracted Task',
          subject: t.subject || 'General',
          type: t.type || 'todo',
          dueDate: t.dueDate || new Date().toISOString().split('T')[0],
          priority: t.priority || 'medium',
          completed: false,
          weightage: '10%'
        });
      });
      jsonStore.set('tasks', currentTasks);
    }

    // Store Calendar Events for User
    if (parsed.calendar && parsed.calendar.length > 0) {
      let currentCal = jsonStore.get('calendar') || [];
      parsed.calendar.forEach(c => {
        currentCal.unshift({
          id: `cal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          userId,
          title: c.title || 'Academic Event',
          date: c.date || new Date().toISOString().split('T')[0],
          type: c.type || 'exam'
        });
      });
      jsonStore.set('calendar', currentCal);
    }

    res.json({
      success: true,
      message: 'Schedule successfully parsed and imported by Study Mate AI!',
      data: parsed
    });
  } catch (err) {
    console.error('Error in ai-import-schedule route:', err);
    res.status(500).json({ success: false, message: 'Server error importing schedule.' });
  }
});

// Get User Specific Academic Calendar Events
router.get('/calendar', authMiddleware, (req, res) => {
  const userId = req.user.id;
  let calendar = jsonStore.get('calendar') || [];
  const userCalendar = calendar.filter(c => c.userId === userId);
  res.json({ success: true, calendar: userCalendar });
});

// Create Academic Calendar Event for User
router.post('/calendar', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { title, date, type } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

  let calendar = jsonStore.get('calendar') || [];
  const newEvent = {
    id: `cal-${Date.now()}`,
    userId,
    title,
    date: date || new Date().toISOString().split('T')[0],
    type: type || 'exam'
  };
  calendar.unshift(newEvent);
  jsonStore.set('calendar', calendar);
  res.json({ success: true, event: newEvent });
});

// Delete Academic Calendar Event
router.delete('/calendar/:id', authMiddleware, (req, res) => {
  const userId = req.user.id;
  let calendar = jsonStore.get('calendar') || [];
  calendar = calendar.filter(c => !(c.id === req.params.id && c.userId === userId));
  jsonStore.set('calendar', calendar);
  res.json({ success: true, message: 'Event deleted' });
});

module.exports = router;
