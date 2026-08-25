# 🧠 Study Mate AI — Intelligent AI Academic Companion

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Groq AI](https://img.shields.io/badge/AI_Engine-Groq_LLaMA_3.3-F05032?logo=fastapi&logoColor=white)](https://groq.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Study Mate AI** is a modern, feature-packed web application designed to accelerate student learning, exam revision, and academic organization. Powered by high-speed Groq AI models, Study Mate AI transforms course notes, PDFs, and whiteboard photos into interactive study tools, practice quizzes, 3D flashcards, and simulated oral viva exams.

---

## ✨ Key Features

### 🤖 1. AI Study Assistant & Tutor
- **Instant Concept Explanations**: Ask any complex topic across Computer Science, Engineering, Mathematics, or Humanities.
- **Step-by-Step Problem Breakdown**: Detailed solution steps for math problems, algorithm logic, and code debugging.

### 📄 2. PDF & Document Analyzer
- **Summary Extraction**: Automatically extracts core definitions, key takeaways, and practice exam questions from uploaded notes and PDFs.
- **Study Duration Estimator**: Calculates estimated reading and revision time for assigned papers.

### 📷 3. AI Image & Note Scanner (OCR)
- **Handwritten & Whiteboard Scanning**: Converts photos of notebook pages, whiteboard drawings, or textbook snippets into clean structured digital summaries using AI OCR.

### 🎙️ 4. AI Viva Examination Prep
- **Simulated Oral Viva Exams**: Realistic mock viva sessions tailored to specific course topics.
- **Live Scoring & Examiner Follow-ups**: Generates AI performance scorecards and probing follow-up examiner questions.

### ❓ 5. AI Quiz Generator
- **Custom Multiple-Choice Quizzes**: Generates tailored practice quizzes by subject and difficulty level (Easy, Medium, Hard).
- **Instant Live Scoring**: Real-time answer validation and detailed explanations for every question.

### 🎴 6. 3D AI Flashcards
- **Interactive 3D Flippable Decks**: Active recall training with 3D flippable card decks.
- **Spaced Repetition Tracking**: Track mastered vs. unmastered cards across subjects.

### 📅 7. Smart Timetable & Planner
- **Lecture Schedule Organizer**: Clean weekly timetable manager.
- **Automated Conflict Detection**: Detects overlapping class times and assignment deadlines.
- **AI Subtask Breakdown**: Automatically breaks large assignments into manageable step-by-step subtasks.

### ⏱️ 8. Study Timer / Pomodoro
- **Session Focus Clock**: Built-in 25/5 minute Pomodoro timer clock with sound alerts and session logs.

### 🏆 9. Gamification & Analytics
- **Daily Study Streak**: Keep your momentum going with consecutive daily login tracking.
- **EXP & Level Progression**: Earn EXP for completing quizzes, creating notes, and finishing study timers.
- **Leaderboards & Badges**: Unlock achievement badges and view progress analytics.

### 🔐 10. Authentication & SMTP Verification
- **JWT Authentication**: Secure user session tokens.
- **Nodemailer Gmail SMTP**: Real 6-digit email OTP verification codes for secure password recovery.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | HTML5, Vanilla CSS3 (Custom Design System, Glassmorphism), JavaScript (ES6+), FontAwesome |
| **Backend** | Node.js, Express.js |
| **Database** | Dual Storage: Mongoose (MongoDB) & Local JSON File Engine (`data/db.json`) |
| **AI Integration** | Groq SDK (`groq-sdk`) leveraging LLaMA 3.3 70B & Qwen models |
| **Security & Mail** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, Nodemailer SMTP |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)
- A free Groq API key from [Groq Console](https://console.groq.com/keys)

---

### Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/study-mate-ai.git
   cd study-mate-ai
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory (or copy `.env.example`):
   ```bash
   cp .env.example .env
   ```

   Configure your `.env` settings:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Optional MongoDB Connection (falls back to local JSON db if empty)
   MONGODB_URI=

   # Authentication & JWT Security
   JWT_SECRET=your_super_secret_jwt_key_here

   # Groq AI Service API Key (Get from https://console.groq.com/keys)
   GROQ_API_KEY=gsk_your_groq_api_key_here

   # Email SMTP Verification Credentials (Gmail App Password)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_gmail_app_password
   ```

4. **Run the Application**
   ```bash
   npm start
   ```

5. **Open in Browser**
   Navigate to [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 📁 Project Directory Structure

```
Study Mate AI NEW/
├── config/
│   └── db.js                 # Dual MongoDB & JSON DB storage layer
├── data/
│   └── db.json               # Local JSON fallback database
├── models/
│   └── User.js               # Mongoose User model schema
├── public/
│   ├── assets/               # Dashboard images and visual graphics
│   ├── css/
│   │   ├── variables.css     # Design tokens & color variables
│   │   └── main.css          # Main UI stylesheets & dark/light themes
│   ├── js/
│   │   ├── app.js            # Main dashboard script
│   │   └── auth.js           # Authentication & OTP handlers
│   ├── index.html            # Main Dashboard page
│   ├── ai-suite.html         # AI Study Assistant & Tutor page
│   ├── practice.html         # Quizzes, Viva & Flashcards page
│   ├── planner.html          # Smart Timetable & Planner page
│   ├── analytics.html        # Gamification & Progress Leaderboard
│   ├── knowledge.html        # PDF & Notes Storage Knowledge Base
│   ├── login.html            # User Login page
│   ├── signup.html           # Registration page
│   ├── forgot-password.html  # Password Recovery OTP page
│   └── settings.html         # User Profile & API Key Settings
├── routes/
│   ├── auth.js               # Auth, Registration, Login & OTP endpoints
│   ├── ai.js                 # AI Tutor & PDF analysis routes
│   ├── notes.js              # Notes CRUD & AI summarizer
│   ├── quizzes.js            # AI Quiz generator routes
│   ├── tasks.js              # Planner & Timetable routes
│   └── analytics.js          # User stats & leaderboard API
├── services/
│   ├── groqService.js        # Groq LLaMA AI integration & prompt logic
│   └── otpService.js         # Nodemailer Gmail OTP dispatch service
├── .env                      # Environment secret key configuration
├── .env.example              # Environment key template
├── .gitignore                # Git ignored patterns
├── package.json              # Project manifests and scripts
├── server.js                 # Express server entry point
└── README.md                 # Project Documentation
```

---

## 🔑 Environment Variables Reference

| Variable | Description | Required | Default |
| :--- | :--- | :---: | :--- |
| `PORT` | HTTP Server Port | No | `3000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | No | `development` |
| `MONGODB_URI` | MongoDB Connection URI string | No | *(Local JSON DB fallback)* |
| `JWT_SECRET` | Secret key used for signing JWT auth tokens | Yes | `studymate_default_jwt_secret_key` |
| `GROQ_API_KEY` | Groq API Key for AI features | Yes | `""` |
| `EMAIL_USER` | Gmail address for sending verification OTPs | Optional | `""` |
| `EMAIL_PASS` | Gmail 16-character App Password | Optional | `""` |

---

## 🌐 How to Host 100% Free (Step-by-Step Guide)

You can host **Study Mate AI** live on the web completely for free using **Render** (for the Node.js Express server) and **MongoDB Atlas** (optional free cloud database).

### Step 1: Push Project to GitHub

1. Create a free account at [github.com](https://github.com).
2. Open your terminal in the project directory and initialize git:
   ```bash
   git init
   git add .
   git commit -m "Deploy Study Mate AI"
   ```
3. Create a new repository on GitHub and push your code:
   ```bash
   git remote add origin https://github.com/your-username/study-mate-ai.git
   git branch -M main
   git push -u origin main
   ```

---

### Step 2: Deploy Free Web Service on Render

1. Sign up for a free account at [render.com](https://render.com) (Log in with GitHub).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository (`study-mate-ai`).
4. Configure the Web Service settings:
   - **Name**: `study-mate-ai`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` ($0/month)

---

### Step 3: Set Environment Variables on Render

In your Render dashboard under **Environment**:
Click **Add Environment Variable** and enter your secret keys:

| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | `your_super_secret_jwt_key_here` |
| `GROQ_API_KEY` | `gsk_your_groq_api_key` |
| `EMAIL_USER` | `your_email@gmail.com` |
| `EMAIL_PASS` | `your_gmail_app_password` |

---

### Step 4: Click "Create Web Service"

Render will build and launch your application automatically. Within 1–2 minutes, you will receive a **Free HTTPS Public URL** (e.g. `https://study-mate-ai.onrender.com`)!

---

### 🗄️ Optional: Free Cloud Database (MongoDB Atlas)

If you want persistent cloud storage across container restarts:
1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Cluster** (512MB storage forever free).
3. Copy your MongoDB Connection String (`mongodb+srv://<user>:<password>@cluster0.mongodb.net/studymate`).
4. Add `MONGODB_URI` to your Render Environment Variables!

---

### 🌐 Deploying on Vercel (Recommended)

#### Option 1: Deploy via Vercel CLI
1. Install Vercel CLI globally (if not already installed):
   ```bash
   npm i -g vercel
   ```
2. Log in and deploy:
   ```bash
   vercel
   ```
3. Follow the prompts (use default project settings). To deploy to production:
   ```bash
   vercel --prod
   ```

#### Option 2: Deploy via Vercel Web Dashboard (GitHub Integration)
1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```
2. Import project in [Vercel Dashboard](https://vercel.com/new).
3. Under **Environment Variables**, add:
   - `JWT_SECRET`: `your_jwt_secret_key`
   - `GROQ_API_KEY`: `gsk_your_groq_api_key`
   - `EMAIL_USER`: `your_email@gmail.com`
   - `EMAIL_PASS`: `your_gmail_app_password`
   - `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/` *(Optional)*
4. Click **Deploy**. Vercel will instantly build and host your application!

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🤝 Acknowledgments

- [Groq AI Console](https://console.groq.com/) for high-speed LLaMA 3.3 model inference.
- [Vercel](https://vercel.com/) & [Render](https://render.com/) for cloud hosting.
- Built with ❤️ for students worldwide.

