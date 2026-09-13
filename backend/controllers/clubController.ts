import { Request, Response } from 'express';
import { Club } from '../../src/types.js';

export const createClubController = (clubsStore: Club[]) => {
  return {
    getClubs: (req: Request, res: Response) => {
      const { category } = req.query;
      let list = [...clubsStore];
      if (category && category !== 'all') {
        list = list.filter(c => c.category.toLowerCase() === (category as string).toLowerCase());
      }
      res.json({ success: true, count: list.length, clubs: list });
    },

    getClubById: (req: Request, res: Response) => {
      const club = clubsStore.find(c => c.id === req.params.id);
      if (!club) {
        return res.status(404).json({ success: false, message: 'Club not found' });
      }
      res.json({ success: true, club });
    },

    createClub: (req: Request, res: Response) => {
      const { name, category, description, leadName, leadEmail, facultyAdvisor, logo, bannerImage } = req.body;
      if (!name || !category || !leadEmail) {
        return res.status(400).json({ success: false, message: 'Club name, category, and lead email are required' });
      }

      const newClub: Club = {
        id: `club-${Date.now()}`,
        name,
        category,
        description: description || 'Active student society fostering campus learning and events.',
        leadName: leadName || 'Student Convener',
        leadEmail,
        facultyAdvisor: facultyAdvisor || 'Pending Faculty Endorsement',
        logo: logo || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
        bannerImage: bannerImage || 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&auto=format&fit=crop&q=80',
        memberCount: 25,
        eventsHosted: 0,
        foundedYear: new Date().getFullYear(),
        isVerified: true
      };

      clubsStore.unshift(newClub);
      res.status(201).json({ success: true, club: newClub, message: 'College club registered successfully' });
    }
  };
};
