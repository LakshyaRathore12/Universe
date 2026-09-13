import { connectDB } from './connection.js';
import { UserModel, ClubModel, EventModel, RegistrationModel, EmailNotificationModel } from './models/index.js';
import { INITIAL_USERS, INITIAL_CLUBS, INITIAL_EVENTS, INITIAL_VENUES } from '../src/data/mockInitialData.js';

export const seedDatabase = async () => {
  console.log('[Seed] Initializing database seeding...');
  const isConnected = await connectDB();

  if (!isConnected) {
    console.log('[Seed] Note: MongoDB connection not active, in-memory data store initialized.');
    return;
  }

  try {
    // Seed Users
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      await UserModel.insertMany(INITIAL_USERS);
      console.log(`[Seed] Seeded ${INITIAL_USERS.length} initial users.`);
    }

    // Seed Clubs
    const clubCount = await ClubModel.countDocuments();
    if (clubCount === 0) {
      await ClubModel.insertMany(INITIAL_CLUBS);
      console.log(`[Seed] Seeded ${INITIAL_CLUBS.length} initial clubs.`);
    }

    // Seed Events
    const eventCount = await EventModel.countDocuments();
    if (eventCount === 0) {
      await EventModel.insertMany(INITIAL_EVENTS);
      console.log(`[Seed] Seeded ${INITIAL_EVENTS.length} initial events.`);
    }

    console.log('[Seed] Database initialization and seeding complete.');
  } catch (error) {
    console.error('[Seed] Error during database seeding:', error);
  }
};

// Allow standalone CLI execution: tsx database/seed.ts
if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase().then(() => process.exit(0));
}
