# 🚀 UniVerse Backend API (Node.js, Express & MongoDB)

This directory contains the REST API server, controllers, routes, and services for the UniVerse University Event Management System.

---

## 📁 Architecture Overview

```
backend/
├── server.ts              # Standalone Express application entry point
├── package.json           # Backend dependencies and scripts
├── .env.example           # Environment configuration template
├── routes/
│   ├── authRoutes.ts      # /api/auth (Login, registration, user profiles)
│   ├── eventRoutes.ts     # /api/events (Workshops, seminars, scheduling, check-ins)
│   ├── clubRoutes.ts      # /api/clubs (Societies directory & onboarding)
│   ├── registrationRoutes.ts # /api/events/:id/register & /api/registrations
│   └── notificationRoutes.ts # /api/emails, /api/notifications & SSE streaming
├── controllers/
│   ├── authController.ts
│   ├── eventController.ts
│   ├── clubController.ts
│   ├── registrationController.ts
│   └── notificationController.ts
└── services/
    └── emailService.ts    # Real-time HTML ticket email engine & SSE broadcaster
```

---

## 🛠️ How to Run the Backend Separately

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file from the template:
```bash
cp .env.example .env
```

### 3. Run in Development Mode
```bash
npm run dev
```
The server will boot on `http://localhost:5000` with hot-reload enabled.

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/users` | Get all campus user profiles |
| `POST` | `/api/auth/login` | Student / Organizer authentication |
| `GET` | `/api/events` | Browse upcoming workshops and seminars |
| `POST` | `/api/events` | Schedule a new club event |
| `PUT` | `/api/events/:id` | Reschedule event & dispatch email notices |
| `POST` | `/api/events/:id/register` | RSVP for an event & get digital ticket |
| `POST` | `/api/events/:id/broadcast` | Mass email all registered attendees |
| `POST` | `/api/events/:id/checkin` | Door QR / Ticket code verification |
| `GET` | `/api/clubs` | List registered college clubs and societies |
| `GET` | `/api/notifications/stream` | Server-Sent Events (SSE) live push alerts |
