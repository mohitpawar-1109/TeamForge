# TEAMFORGE
> **"Forge the right team. Build the right project."**

TeamForge is an AI-powered student team formation and project collaboration platform built for college students and hackathons. It bridges the gap between project ideas and technical talent by intelligently matching students based on verified skill sets, domain interests, schedule availability, and project requirements.

---

## 🌟 Key Features

1. **AI Project Requirements Analysis**: Converts plain text project ideas into structured tech stacks, estimated difficulty, team size, suggested roles, and architectural challenges using Google Gemini (with deterministic keyword fallback).
2. **Weighted Smart Matching Engine**:
   $$\text{Match Score} = (\text{Skills} \times 50\%) + (\text{Interests} \times 20\%) + (\text{Availability} \times 20\%) + (\text{Experience} \times 10\%)$$
   Transparent match percentages and explicit **"Why this match?"** rationales.
3. **Real-time Team Skill Gap Detection**: Dynamically compares the union of team members' skills against project requirements, displaying coverage percentages and missing critical skills.
4. **End-to-End Invitation & Team Formation**: Send, receive, accept, or decline team invitations with custom roles and automatic roster updates.
5. **Project Kanban Workspace**: Interactive task board (TODO, IN PROGRESS, DONE) with member assignment, priority indicators, and live project progress tracking.
6. **Student Portfolio Profiles**: Showcase skills, verified badges, availability schedules, university courses, and past hackathon contributions.
7. **1-Click Hackathon Demo Switcher**: Instant login switches between Team Lead (Mohit), Candidate (Aarav), Designer (Priya), and Demo Lead (Dev) for rapid judging evaluations.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide Icons
- **Backend**: Node.js, Express.js (ES Modules), MongoDB, Mongoose, JWT Authentication, bcryptjs, Morgan
- **AI Integration**: Google Gemini 1.5 Flash API + Isolated Deterministic Fallback Engine
- **Deployment**: Vercel (Frontend), Render / Railway (Backend), MongoDB Atlas (Database)

---

## 📁 Folder Structure

```
TeamForge/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection handler
│   ├── controllers/
│   │   ├── auth.controller.js    # Register, login, getMe
│   │   ├── user.controller.js    # Student profiles & search
│   │   ├── project.controller.js # Projects CRUD & membership
│   │   ├── match.controller.js   # Compatibility score & skill gap
│   │   ├── ai.controller.js      # AI project analyzer endpoint
│   │   ├── invite.controller.js  # Team recruitment invitations
│   │   ├── task.controller.js    # Kanban tasks CRUD & metrics
│   │   └── notif.controller.js   # User notifications
│   ├── middleware/
│   │   ├── auth.middleware.js    # JWT authorization guard
│   │   └── error.middleware.js   # Centralized error handler
│   ├── models/
│   │   ├── User.js               # Student profile schema
│   │   ├── Project.js            # Project & team schema
│   │   ├── Invitation.js         # Recruitment invite schema
│   │   ├── Task.js               # Kanban task schema
│   │   └── Notification.js       # Activity notifications
│   ├── routes/                   # Express REST API routes
│   ├── services/
│   │   ├── ai.service.js         # Gemini API + Fallback analyzer
│   │   └── match.service.js      # Weighted multi-factor matchmaker
│   ├── seed/
│   │   └── seed.js               # 10 students, 8 projects, tasks, invites
│   ├── server.js                 # Express server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Navbar, Sidebar, Header, Modal, Badge, Button
│   │   │   ├── cards/            # ProjectCard, CandidateCard
│   │   │   ├── matching/         # SkillGapVisualizer
│   │   │   └── ai/               # AIAnalysisModal
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Persistent auth & 1-click demo switcher
│   │   │   └── ToastContext.jsx  # Rich animated toast alerts
│   │   ├── layouts/
│   │   │   ├── MainLayout.jsx    # Responsive sidebar + mobile bottom nav
│   │   │   └── PublicLayout.jsx  # Public landing navbar & footer
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx   # Hero, CSS matching illustration, stats, features
│   │   │   ├── LoginPage.jsx     # Login with quick 1-click switcher
│   │   │   ├── RegisterPage.jsx  # Student onboarding wizard
│   │   │   ├── DashboardPage.jsx # Stats, recommendations & activity
│   │   │   ├── ExploreProjectsPage.jsx # Search, filters & best-match sorting
│   │   │   ├── CreateProjectPage.jsx  # 4-step wizard + AI analyzer
│   │   │   ├── ProjectDetailsPage.jsx # Project overview & skill coverage
│   │   │   ├── ProjectMatchesPage.jsx # Recommended candidates with match %
│   │   │   ├── ProjectTeamPage.jsx    # Team roster & skill gap visualizer
│   │   │   ├── ProjectTasksPage.jsx   # Kanban board (TODO/IN PROGRESS/DONE)
│   │   │   ├── InvitationsPage.jsx    # Received & sent invitations
│   │   │   ├── MyProjectsPage.jsx     # Created vs Joined projects
│   │   │   ├── ProfilePage.jsx        # Public/Self student portfolio
│   │   │   ├── EditProfilePage.jsx    # Profile editor
│   │   │   └── SettingsPage.jsx       # Preferences & credentials guide
│   │   ├── services/
│   │   │   └── api.js                 # Axios instance with interceptors
│   │   ├── App.jsx                   # Route configuration
│   │   ├── main.jsx
│   │   └── index.css                 # Tailwind design system tokens
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start & Local Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or MongoDB Atlas connection string)

### 1. Clone & Install Dependencies
```bash
# Backend Setup
cd backend
npm install

# Frontend Setup
cd ../frontend
npm install
```

### 2. Environment Variables Configuration
Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/teamforge
JWT_SECRET=teamforge_super_secret_jwt_key_2026_hackathon_demo
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY= # Optional: Add your Google Gemini API key
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Seed Database with Realistic Demo Data
Populates 10 students, 8 comprehensive projects, active tasks, notifications, and invitations:
```bash
cd backend
npm run seed
```

### 4. Run Locally
```bash
# In terminal 1 (Backend API):
cd backend
npm run dev

# In terminal 2 (Frontend Client):
cd frontend
npm run dev
```
Visit **http://localhost:5173** in your browser.

---

## 🔑 Demo Accounts & Credentials

| Role | Email | Password | Primary Skills |
| :--- | :--- | :--- | :--- |
| **Demo Account** | `demo@teamforge.app` | `Demo@123` | React, Node.js, Python, MongoDB |
| **Team Lead** | `mohit@teamforge.app` | `Demo@123` | React, Node.js, MongoDB, TypeScript |
| **ML Engineer** | `aarav@teamforge.app` | `Demo@123` | Python, Machine Learning, NLP, PyTorch |
| **UI/UX Designer** | `priya@teamforge.app` | `Demo@123` | UI/UX, Figma, Design Systems, Tailwind |
| **Backend Dev** | `rohan@teamforge.app` | `Demo@123` | Node.js, Express, PostgreSQL, Docker |
| **Mobile Dev** | `sneha@teamforge.app` | `Demo@123` | React Native, Flutter, Firebase |

*(Tip: You can use the 1-Click Quick Demo Login buttons on the Login page and in the Sidebar to switch users instantly!)*

---

## ⏱️ 3-Minute Hackathon Demo Flow

1. **Sign In**: Login as **Mohit** using the 1-click button.
2. **Dashboard**: View active metrics, personalized recommendations, and current projects.
3. **Create Project**: Click **Create Project**, enter title *"AI Resume Analyzer"*, and click **Analyze Project with AI**.
4. **AI Recommendations**: Watch the AI identify required skills (*Python, NLP, ML, React, UI/UX*), recommended team size (4), and potential challenges. Click **Use These Recommendations**.
5. **Skill Gap Detection**: Open the project page and observe the real-time **Team Skill Coverage** (highlighting missing ML and UI/UX skills).
6. **Smart Matching**: Click **Find Teammates**. Notice **Aarav (94% Match)** and **Priya (92% Match)** ranked at the top. Inspect the **"Why this match?"** justifications.
7. **Send Invite**: Click **Invite to Team** on Aarav or Priya.
8. **Switch User & Accept**: Use the bottom sidebar pill to switch to **Priya**, open **Invitations**, and click **Accept & Join**.
9. **Team Roster**: Open the **Team** page to observe updated members and **100% Skill Coverage**.
10. **Kanban Workspace**: Open **Tasks**, create or drag a task to **DONE**, and watch the project progress meter update in real time!

---

## 🚀 Deployment Instructions

### Frontend (Vercel)
1. Push repository to GitHub.
2. Import `frontend/` folder in Vercel.
3. Set environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`.
4. Deploy!

### Backend (Render / Railway)
1. Import `backend/` folder in Render / Railway.
2. Set build command: `npm install` and start command: `node server.js`.
3. Set environment variables:
   - `PORT=5000`
   - `MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/teamforge`
   - `JWT_SECRET=your_production_secret`
   - `CLIENT_URL=https://your-teamforge-app.vercel.app`
4. Run `node seed/seed.js` in the deployed console if initial seed data is desired.

---

## 📜 License
MIT License. Crafted for ambitious student builders and hackathons.
