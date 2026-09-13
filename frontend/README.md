# 💻 UniVerse Frontend Client (React 19, TypeScript & Tailwind CSS)

This directory contains the user interface and client logic for the UniVerse University Event Management System.

---

## 📁 Architecture Overview

```
src/
├── App.tsx                # Primary application state, modal coordinator & SSE listener
├── main.tsx               # DOM mounting entry point
├── types.ts               # Shared TypeScript interfaces for events, passes, & users
├── index.css              # Tailwind CSS imports & global styles
├── components/
│   ├── Navbar.tsx         # Header, role switcher & notification center
│   ├── EventCard.tsx      # Workshop & seminar preview cards
│   ├── EventDetailModal.tsx # Multi-session agenda, speaker bios & RSVP
│   ├── EventScheduleModal.tsx # Club hosting & venue booking form
│   ├── TicketPassModal.tsx # Digital pass with QR code & calendar export
│   ├── MailboxModal.tsx   # Interactive campus email client
│   ├── BroadcastModal.tsx # Real-time email announcement tool
│   ├── CalendarView.tsx   # Monthly schedule matrix & timeline
│   ├── ClubsView.tsx      # University club directory
│   ├── ClubRegisterModal.tsx # Club onboarding flow
│   ├── OrganizerDashboard.tsx # Club console & door check-in scanner
│   ├── MyPassesView.tsx   # Student ticket wallet
│   └── NotificationToast.tsx # Real-time push alert toast
├── utils/
│   ├── emailTemplates.ts  # HTML email layout generators
│   └── calendar.ts        # iCalendar (.ics) export generator
└── data/
    └── mockInitialData.ts # Initial campus dataset
```

---

## 🛠️ How to Run the Frontend Separately

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Backend API Proxy
In `vite.config.ts`, Vite proxies `/api` requests to `http://localhost:5000` automatically:
```ts
server: {
  proxy: {
    '/api': 'http://localhost:5000'
  }
}
```

### 3. Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` or `http://localhost:3000` in your browser.
