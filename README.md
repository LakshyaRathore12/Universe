# 🎓 UniVerse: Complete MERN University Event Management System

A full-stack, production-ready University Event Management System featuring:
- **Workshops, Seminars & Hackathons Directory**: Unified hub for campus events with multi-session agendas, speaker bios, and venue capacities.
- **College Club Onboarding & Scheduling**: Direct registration for student societies with venue reservations and clash-free scheduling.
- **Real-Time Email Notifications & Digital Ticket Passes**: Instant HTML ticket dispatch upon RSVP, digital QR entrance passes, and iCalendar (.ics) integration.
- **Server-Sent Events (SSE) Live Alerts**: Real-time push notifications for schedule updates, room changes, and organizer broadcasts.
- **Door Check-In Verification**: Live scanner and ticket code verification console for event coordinators.

---

## 📁 Project Architecture & Clean Separation

The codebase is strictly separated into three distinct layers:

```
universe-event-management/
├── frontend/              # 💻 React 19, TypeScript, Tailwind CSS, Vite
│   ├── package.json       # Standalone frontend dependencies
│   ├── README.md          # Frontend development instructions
│   └── src/               # UI components, modals, views & utilities
│
├── backend/               # 🚀 Node.js, Express, REST APIs, SSE Engine
│   ├── server.ts          # Standalone Express backend server
│   ├── package.json       # Standalone backend dependencies
│   ├── README.md          # API reference & setup instructions
│   ├── routes/            # Modular Express routers (auth, events, clubs, passes)
│   ├── controllers/       # Business logic handlers
│   └── services/          # Email dispatch & real-time SSE broadcaster
│
├── database/              # 🗄️ MongoDB & Mongoose Schemas
│   ├── connection.ts      # Mongoose connection manager with fallback
│   ├── seed.ts            # Seeder script for initial campus data
│   ├── README.md          # Database schemas & indices documentation
│   └── models/            # Mongoose models (User, Club, Event, Registration, EmailNotification)
│
├── public/                # Static assets & downloadable ZIP archives
│   ├── frontend.zip       # Standalone Frontend bundle
│   ├── backend.zip        # Standalone Backend bundle
│   ├── database.zip       # Standalone Database schemas & seed scripts
│   └── universe-event-management.zip # Full repository archive
│
├── server.ts              # Root development & container server (Vite + API proxy)
└── package.json           # Root workspace build scripts
```

---

## ⚡ Quick Start: Running Full-Stack

### 1. Clone or Extract the Archive
```bash
git clone <repo-url>
cd universe-event-management
npm install
```

### 2. Start Both Frontend & Backend Concurrently
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 📦 Running Frontend, Backend & Database Separately

### Option A: Database (MongoDB)
```bash
# 1. Start MongoDB daemon
mongod --dbpath /data/db

# 2. Seed initial campus data
npx tsx database/seed.ts
```

### Option B: Backend (Express API)
```bash
cd backend
npm install
npm run dev
# Running on http://localhost:5000
```

### Option C: Frontend (React SPA)
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```
