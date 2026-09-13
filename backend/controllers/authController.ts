import { Request, Response } from 'express';
import { User } from '../../src/types.js';

export const createAuthController = (usersStore: User[]) => {
  return {
    getUsers: (req: Request, res: Response) => {
      res.json({ success: true, users: usersStore });
    },

    getCurrentUser: (req: Request, res: Response) => {
      const email = req.query.email as string;
      if (!email) {
        return res.json({ success: true, user: usersStore[0] });
      }
      const found = usersStore.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (found) {
        return res.json({ success: true, user: found });
      }
      res.status(404).json({ success: false, message: 'User profile not found' });
    },

    login: (req: Request, res: Response) => {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'University email is required' });
      }

      let user = usersStore.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        // Auto-create student account if it doesn't exist
        user = {
          id: `usr-${Date.now()}`,
          name: email.split('@')[0].replace('.', ' ').toUpperCase(),
          email,
          role: 'student',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
          studentId: `2026ST${Math.floor(1000 + Math.random() * 9000)}`,
          department: 'General Engineering',
          year: '2nd Year',
        };
        usersStore.push(user);
      }

      res.json({
        success: true,
        user,
        message: 'Successfully authenticated',
        token: `mock-jwt-${user.id}-${Date.now()}`,
      });
    },

    register: (req: Request, res: Response) => {
      const { name, email, role, department, studentId, clubId, clubName } = req.body;
      if (!name || !email) {
        return res.status(400).json({ success: false, message: 'Name and email are required' });
      }

      const existing = usersStore.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return res.status(400).json({ success: false, message: 'An account with this campus email already exists' });
      }

      const newUser: User = {
        id: `usr-${Date.now()}`,
        name,
        email,
        role: role || 'student',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
        department: department || 'Computer Science',
        studentId: studentId || `2026ST${Math.floor(1000 + Math.random() * 9000)}`,
        clubId: clubId || undefined,
        clubName: clubName || undefined,
      };

      usersStore.push(newUser);
      res.status(201).json({
        success: true,
        user: newUser,
        message: 'Student profile registered successfully',
        token: `mock-jwt-${newUser.id}-${Date.now()}`,
      });
    },
  };
};
