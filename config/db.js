const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../data/db.json');

// Ensure data directory exists for JSON fallback
const dataDir = path.join(__dirname, '../data');
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (err) {
  // Directory creation may fail on read-only serverless filesystems
}

// Initial DB template
const initialDb = {
  users: [
    {
      id: "demo-user-1",
      name: "Alex Johnson",
      email: "demo@studymate.ai",
      passwordHash: "$2a$10$e8w.x7.M19L1h8.Bw5bF1e6P5Z5Q1Y6/X6b.y.7g8h9i0j1k2l3m", // 'password123'
      streak: 5,
      exp: 1250,
      level: 3,
      groqApiKey: "",
      otp: null,
      otpExpires: null
    }
  ],
  notes: [
    {
      id: "note-1",
      userId: "demo-user-1",
      title: "Data Structures & Algorithms Overview",
      subject: "Computer Science",
      content: "# Data Structures & Algorithms\n\n- **Arrays**: Fixed size contiguous memory block.\n- **Linked Lists**: Node pointers with O(1) insertion.\n- **Trees & Binary Search Trees**: Balanced searching in O(log N).\n- **Graph Algorithms**: Dijkstra's algorithm for shortest path.",
      tags: ["CS", "Algorithms", "Core"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "note-2",
      userId: "demo-user-1",
      title: "Operating Systems - Process Scheduling",
      subject: "Operating Systems",
      content: "# Process Scheduling\n\n- **FCFS**: First-come, first-served (non-preemptive).\n- **SJF**: Shortest Job First.\n- **Round Robin**: Time quantum slices for fair scheduling.\n- **Deadlock Conditions**: Mutual exclusion, Hold & wait, No preemption, Circular wait.",
      tags: ["OS", "Processes"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  tasks: [
    {
      id: "task-1",
      userId: "demo-user-1",
      title: "Review DBMS Normalization Rules",
      subject: "Database Systems",
      type: "todo",
      dueDate: "2026-08-25",
      priority: "high",
      completed: false,
      aiSubtasks: ["Review 1NF, 2NF, 3NF definitions", "Solve BCNF decomposition exercise", "Practice functional dependencies"]
    },
    {
      id: "task-2",
      userId: "demo-user-1",
      title: "AI Ethics Assignment Paper",
      subject: "Artificial Intelligence",
      type: "assignment",
      dueDate: "2026-08-28",
      priority: "medium",
      completed: false,
      weightage: "15%"
    }
  ],
  timetable: [
    { id: "tt-1", userId: "demo-user-1", day: "Monday", time: "09:00 - 10:30", subject: "Computer Networks", room: "Room 302" },
    { id: "tt-2", userId: "demo-user-1", day: "Monday", time: "11:00 - 12:30", subject: "Database Systems", room: "Lab 2" },
    { id: "tt-3", userId: "demo-user-1", day: "Tuesday", time: "10:00 - 11:30", subject: "Machine Learning", room: "Hall B" },
    { id: "tt-4", userId: "demo-user-1", day: "Wednesday", time: "09:00 - 10:30", subject: "Operating Systems", room: "Room 104" },
    { id: "tt-5", userId: "demo-user-1", day: "Thursday", time: "14:00 - 16:00", subject: "Web Development Lab", room: "Lab 5" }
  ],
  quizzes: [
    {
      id: "quiz-1",
      userId: "demo-user-1",
      title: "Quick Check: OS Memory Management",
      subject: "Operating Systems",
      score: 85,
      totalQuestions: 5,
      date: "2026-08-22"
    }
  ],
  flashcards: [
    {
      id: "fc-1",
      userId: "demo-user-1",
      deck: "Web Technologies",
      front: "What does CORS stand for?",
      back: "Cross-Origin Resource Sharing. A mechanism that uses HTTP headers to tell browsers to give a web application running at one origin access to selected resources from a different origin.",
      mastered: true
    },
    {
      id: "fc-2",
      userId: "demo-user-1",
      deck: "Web Technologies",
      front: "What is the difference between SQL and NoSQL?",
      back: "SQL databases are relational, structured, and use SQL schemas (e.g. PostgreSQL, MySQL). NoSQL databases are non-relational, document-oriented or key-value stores (e.g. MongoDB, Redis).",
      mastered: false
    }
  ],
  reminders: [
    { id: "rem-1", userId: "demo-user-1", title: "DB Exam Prep Session", time: "Today at 06:00 PM", active: true },
    { id: "rem-2", userId: "demo-user-1", title: "Submit Web Dev Assignment", time: "Tomorrow at 11:59 PM", active: true }
  ]
};

try {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
  }
} catch (e) {
  // Ignore filesystem write error on read-only environments
}

class JsonStore {
  constructor() {
    this.filePath = DB_FILE;
    this.memoryCache = null;
  }
  read() {
    if (this.memoryCache) return this.memoryCache;
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      this.memoryCache = JSON.parse(raw);
      return this.memoryCache;
    } catch (e) {
      this.memoryCache = initialDb;
      return this.memoryCache;
    }
  }
  write(data) {
    this.memoryCache = data;
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (e) {
      // In read-only serverless environments like Vercel, maintain data in memory
    }
  }
  get(collectionName) {
    const db = this.read();
    return db[collectionName] || [];
  }
  set(collectionName, items) {
    const db = this.read();
    db[collectionName] = items;
    this.write(db);
  }
}

const jsonStore = new JsonStore();

let isMongoConnected = false;
let connPromise = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    return false;
  }
  if (mongoose.connection.readyState >= 1) {
    isMongoConnected = true;
    return true;
  }
  if (connPromise) {
    return connPromise;
  }
  connPromise = (async () => {
    try {
      await mongoose.connect(mongoUri);
      isMongoConnected = true;
      console.log('⚡ Connected to MongoDB successfully.');
      return true;
    } catch (err) {
      console.warn('⚠️ MongoDB connection failed. Falling back to JSON database store:', err.message);
      isMongoConnected = false;
      connPromise = null;
      return false;
    }
  })();
  return connPromise;
};

module.exports = {
  connectDB,
  isMongoConnected: () => isMongoConnected,
  jsonStore
};

