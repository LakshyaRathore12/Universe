# 🗄️ UniVerse Database Architecture (MongoDB & Mongoose)

This directory contains the database schema definitions, Mongoose models, connection handlers, and seed scripts for the UniVerse University Event Management System.

---

## 📁 Directory Layout

```
database/
├── connection.ts          # Mongoose connection manager with fallback
├── seed.ts                # Database seeder with sample universities, clubs & events
├── models/
│   ├── index.ts           # Unified export of all models
│   ├── User.ts            # Users, student profiles & club organizers
│   ├── Club.ts            # College clubs, societies & conveners
│   ├── Event.ts           # Workshops, seminars, agendas, sessions & speakers
│   ├── Registration.ts    # Student RSVP records, ticket codes & check-in
│   └── EmailNotification.ts # Delivered emails, passes & broadcast dispatches
└── README.md              # Database documentation (this file)
```

---

## 📊 Collections & Schemas

### 1. `users`
- **Fields**:
  - `id`: Unique user string (e.g. `usr-101`)
  - `name`: Full student or staff name
  - `email`: University email (indexed, unique)
  - `role`: `'student' | 'club_organizer' | 'admin'`
  - `clubId` / `clubName`: Assigned club affiliation (for organizers)
  - `studentId`: University registration number (e.g. `2024CS0842`)
  - `department`: Academic department (e.g. `Computer Science`)
  - `year`: Academic year (e.g. `3rd Year B.Tech`)

### 2. `clubs`
- **Fields**:
  - `id`: Unique club identifier (e.g. `club-codecraft`)
  - `name`: Official organization name
  - `category`: `'Technical' | 'Cultural' | 'Academic' | 'Literary' | 'Sports' | 'Social'`
  - `leadName` & `leadEmail`: Student convener / lead contact
  - `facultyAdvisor`: Endorsing faculty mentor
  - `memberCount` & `eventsHosted`: Statistics
  - `isVerified`: University Dean endorsement flag

### 3. `events`
- **Fields**:
  - `id`: Event ID (e.g. `evt-101`)
  - `title`: Event name (e.g. `Full-Stack MERN & Cloud Architecture Workshop`)
  - `category`: `'Workshop' | 'Seminar' | 'Hackathon' | 'Guest Lecture' | 'Cultural' | 'Tech Talk'`
  - `clubId` & `clubName`: Hosting organization
  - `detailedAgenda`: Multi-session curriculum breakdown
  - `startDate`, `endDate`, `startTime`, `endTime`: Precise scheduling
  - `venue` & `venueCapacity`: Campus venue reservation
  - `capacity` & `registeredCount`: Real-time seat occupancy
  - `speakers`: Array of guest speakers, roles, organizations, and bios
  - `sessions`: Array of time blocks, topics, and room designations
  - `status`: `'upcoming' | 'ongoing' | 'completed' | 'cancelled'`

### 4. `registrations`
- **Fields**:
  - `id`: Registration ID
  - `eventId`: Target event
  - `userEmail`: Student email
  - `ticketCode`: Cryptographic alphanumeric pass (e.g. `TKT-2026-6468`)
  - `status`: `'confirmed' | 'checked_in' | 'cancelled'`
  - `checkedInAt`: Timestamp when scanned at the door
  - **Index**: Unique compound index `{ eventId: 1, userEmail: 1 }` prevents double-booking

### 5. `emailnotifications`
- **Fields**:
  - `recipientEmail` & `recipientName`: Target attendee
  - `senderName` & `senderEmail`: Club organizer or system mailer
  - `subject`: Email subject line
  - `plainText` & `htmlContent`: Rendered email pass body
  - `type`: `'registration_confirmation' | 'schedule_change' | 'organizer_announcement' | 'cancellation'`
  - `deliveryStatus`: `'delivered' | 'sent' | 'queued'`

---

## 🚀 Running with MongoDB

### Local MongoDB
```bash
# Start your local MongoDB server
mongod --dbpath /data/db

# Configure environment variable in .env
MONGODB_URI=mongodb://127.0.0.1:27017/universe_events
```

### Seed Database
```bash
npx tsx database/seed.ts
```
