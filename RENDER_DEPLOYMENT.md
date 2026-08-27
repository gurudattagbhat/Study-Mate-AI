# 🚀 Hosting Study Mate AI on Render

This guide provides step-by-step instructions for deploying **Study Mate AI** on [Render](https://render.com).

---

## 📋 Prerequisites

Before deploying, ensure you have:
1. A **Render account** (Sign up at [dashboard.render.com](https://dashboard.render.com/)).
2. A **GitHub** or **GitLab** account containing your repository for **Study Mate AI**.
3. (Optional but Recommended) A free **MongoDB Atlas** cluster for permanent data persistence.

---

## ⚡ Method 1: Automatic Blueprint Deployment (Recommended)

Render can automatically configure your service using the included `render.yaml` blueprint file.

1. **Push your code** to GitHub or GitLab:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```
2. Log into [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** in the top-right corner and select **Blueprint**.
4. Connect your GitHub/GitLab repository.
5. Render will detect `render.yaml` and set up the Web Service automatically.
6. Under **Environment Variables**, fill in your actual values for:
   - `GROQ_API_KEY`: Your Groq AI key (from [Groq Console](https://console.groq.com/keys)).
   - `MONGODB_URI`: Your MongoDB connection string (Optional).
   - `EMAIL_USER`: Your Gmail address for verification emails (Optional).
   - `EMAIL_PASS`: Your Gmail App Password (Optional).
7. Click **Apply**. Render will build and deploy your app automatically!

---

## 🛠️ Method 2: Manual Web Service Creation

If you prefer to configure the Web Service manually on Render:

1. Go to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your repository.
4. Fill in the service configuration:

| Setting | Value |
| :--- | :--- |
| **Name** | `study-mate-ai` |
| **Language / Runtime** | `Node` |
| **Branch** | `main` (or your default branch) |
| **Region** | Select closest region to your users |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

5. Expand **Advanced Settings**:
   - **Health Check Path**: `/api/health`
6. Add the following **Environment Variables**:

| Key | Recommended Value / Description |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `JWT_SECRET` | Render will auto-generate or set a long random string |
| `GROQ_API_KEY` | Your Groq API key (`gsk_...`) |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/studymate` |
| `EMAIL_USER` | *(Optional)* Gmail address for OTP emails |
| `EMAIL_PASS` | *(Optional)* Gmail App Password |

7. Click **Create Web Service**.

---

## 🗄️ Database Setup (MongoDB Atlas)

By default, Study Mate AI will fall back to an in-memory / JSON store if `MONGODB_URI` is omitted. However, because free-tier web services on Render have ephemeral disks (data resets on restart), configuring MongoDB Atlas is recommended for full persistence:

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Database Cluster**.
3. Create a Database User (username & password).
4. Add `0.0.0.0/0` (Allow access from anywhere) under **Network Access**.
5. Copy your connection string: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/studymate?retryWrites=true&w=majority`
6. Paste this string as the `MONGODB_URI` environment variable in Render.

---

## ✅ Verifying Your Deployment

Once Render finishes deploying:
1. Open your live application URL (e.g., `https://study-mate-ai.onrender.com`).
2. Test the health check endpoint: `https://study-mate-ai.onrender.com/api/health`
3. Try creating a note or interacting with Study Mate AI!

---

## 🔍 Troubleshooting & Logs

- **Viewing logs**: In the Render Dashboard, navigate to your web service and click **Logs**.
- **Cold Starts**: Render's free web services automatically sleep after 15 minutes of inactivity. The first request after sleep may take ~30 seconds to spin back up.
