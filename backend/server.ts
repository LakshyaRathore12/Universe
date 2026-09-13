import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from '../database/connection.js';
import { INITIAL_USERS, INITIAL_CLUBS, INITIAL_EVENTS, INITIAL_VENUES } from '../src/data/mockInitialData.js';
import { createAuthRoutes } from './routes/authRoutes.js';
import { createEventRoutes } from './routes/eventRoutes.js';
import { createClubRoutes } from './routes/clubRoutes.js';
import { createRegistrationRoutes } from './routes/registrationRoutes.js';
import { createNotificationRoutes } from './routes/notificationRoutes.js';
import { User, Club, UniversityEvent, Registration, EmailNotification, InAppNotification, UniversityVenue } from '../src/types.js';

dotenv.config();

const app = express();
const PORT: number = Number(process.env.PORT) || 5000;

// Enable CORS for frontend clients
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-Memory fallback data store (synced with MongoDB if active)
const users: User[] = [...INITIAL_USERS];
const clubs: Club[] = [...INITIAL_CLUBS];
const events: UniversityEvent[] = [...INITIAL_EVENTS];
const venues: UniversityVenue[] = [...INITIAL_VENUES];
const registrations: Registration[] = [];
const emails: EmailNotification[] = [];
const inAppNotifications: InAppNotification[] = [];

// Mount modular API routes
app.use('/api/auth', createAuthRoutes(users));
app.use('/api/events', createEventRoutes(events, registrations, emails, inAppNotifications, venues));
app.use('/api/events', createRegistrationRoutes(registrations, events, emails, inAppNotifications));
app.use('/api/registrations', createRegistrationRoutes(registrations, events, emails, inAppNotifications));
app.use('/api/clubs', createClubRoutes(clubs));
app.use('/api', createNotificationRoutes(emails, inAppNotifications, venues));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'UniVerse Event Management Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Start Server
async function startServer() {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 UniVerse Backend API server running on port ${PORT}`);
  });
}

startServer();

export { app };
