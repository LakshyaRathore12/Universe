import { Request, Response } from 'express';
import { Club, ClubAdminInfo } from '../../src/types.js';

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
      const { 
        name, 
        category, 
        description, 
        leadName, 
        leadEmail, 
        leadPhone, 
        leadEnrollmentNo, 
        leadYear, 
        admins, 
        facultyAdvisor, 
        logo, 
        bannerImage 
      } = req.body;

      if (!name || !category) {
        return res.status(400).json({ success: false, message: 'Club name and category are required' });
      }

      // Process designated admins
      let resolvedAdmins: ClubAdminInfo[] = [];
      if (Array.isArray(admins) && admins.length > 0) {
        resolvedAdmins = admins.map((adm, idx) => ({
          id: adm.id || `adm-${Date.now()}-${idx}`,
          name: adm.name || 'Club Admin',
          email: adm.email,
          enrollmentNo: adm.enrollmentNo || `UNI-2024-${Math.floor(1000 + Math.random() * 9000)}`,
          phone: adm.phone || '+91 98000 00000',
          year: adm.year || '3rd Year',
          department: adm.department || 'Academic Department',
          roleTitle: adm.roleTitle || (idx === 0 ? 'Lead Organizer' : 'Co-Admin'),
          addedAt: new Date().toISOString()
        }));
      } else if (leadEmail) {
        resolvedAdmins = [{
          id: `adm-${Date.now()}-0`,
          name: leadName || 'Club Admin',
          email: leadEmail,
          enrollmentNo: leadEnrollmentNo || `UNI-2024-${Math.floor(1000 + Math.random() * 9000)}`,
          phone: leadPhone || '+91 98000 00000',
          year: leadYear || '3rd Year',
          department: 'Academic Department',
          roleTitle: 'President & Lead Admin',
          addedAt: new Date().toISOString()
        }];
      } else {
        return res.status(400).json({ success: false, message: 'At least one club admin with email, enrollment number, phone, and year is required' });
      }

      const primaryAdmin = resolvedAdmins[0];

      const newClub: Club = {
        id: `club-${Date.now()}`,
        name,
        category,
        description: description || 'Active student society fostering campus learning and events.',
        leadName: primaryAdmin.name,
        leadEmail: primaryAdmin.email,
        leadPhone: primaryAdmin.phone,
        leadEnrollmentNo: primaryAdmin.enrollmentNo,
        leadYear: primaryAdmin.year,
        admins: resolvedAdmins,
        facultyAdvisor: facultyAdvisor || 'Pending Faculty Endorsement',
        logo: logo || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
        bannerImage: bannerImage || 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&auto=format&fit=crop&q=80',
        memberCount: 25,
        eventsHosted: 0,
        foundedYear: new Date().getFullYear(),
        isVerified: true
      };

      clubsStore.unshift(newClub);
      res.status(201).json({ success: true, club: newClub, message: 'College club registered successfully with designated administrators' });
    },

    updateClubAdmins: (req: Request, res: Response) => {
      const { id } = req.params;
      const { admins } = req.body;

      const club = clubsStore.find(c => c.id === id);
      if (!club) {
        return res.status(404).json({ success: false, message: 'Club not found' });
      }

      if (!Array.isArray(admins) || admins.length === 0) {
        return res.status(400).json({ success: false, message: 'A club must have at least one designated administrator' });
      }

      // Format and validate updated admins list
      club.admins = admins.map((adm, idx) => ({
        id: adm.id || `adm-${Date.now()}-${idx}`,
        name: adm.name || 'Club Admin',
        email: adm.email,
        enrollmentNo: adm.enrollmentNo,
        phone: adm.phone,
        year: adm.year || '3rd Year',
        department: adm.department || 'Academic Department',
        roleTitle: adm.roleTitle || (idx === 0 ? 'Lead Organizer' : 'Co-Admin'),
        addedAt: adm.addedAt || new Date().toISOString()
      }));

      // Keep primary lead info aligned
      if (club.admins[0]) {
        club.leadName = club.admins[0].name;
        club.leadEmail = club.admins[0].email;
        club.leadPhone = club.admins[0].phone;
        club.leadEnrollmentNo = club.admins[0].enrollmentNo;
        club.leadYear = club.admins[0].year;
      }

      res.json({ success: true, club, message: 'Club administrators updated successfully' });
    }
  };
};
