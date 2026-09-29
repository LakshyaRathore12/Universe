import { Club, User } from '../types.js';

export const MASTER_EMAILS = [
  '25mc1la65@mitsgwl.ac.in',
  '25mc1la65@mits.gwl.ac.in',
  '25mc1la66@mitsgwl.ac.in'
];

export const MASTER_ENROLLMENTS = [
  'btmc25o1065',
  'btmc25o1066',
  '25mc1la65',
  '25mc1la66'
];

/**
 * Checks whether an email address or student identifier is one of the designated Master accounts:
 * - Lakshya Rathore: 25mc1la65@mitsgwl.ac.in / Enrollment: BTMC25O1065 (Mathematics and Computing 2nd Year)
 * - Lakshya Sharma: 25mc1la66@mitsgwl.ac.in / Enrollment: BTMC25O1066 (Mathematics and Computing 2nd Year)
 */
export const isMasterEmail = (identifier?: string | null): boolean => {
  if (!identifier) return false;
  const clean = identifier.trim().toLowerCase();
  if (MASTER_EMAILS.some(m => m.toLowerCase() === clean)) return true;
  if (MASTER_ENROLLMENTS.some(e => e.toLowerCase() === clean)) return true;
  return false;
};

/**
 * Checks whether a user possesses Master clearance.
 * Master accounts log in normally as students but hold all administrative,
 * faculty, and organizer permissions without displaying any Master Control button.
 */
export const isMasterUser = (user?: User | null): boolean => {
  if (!user) return false;
  if (user.role === 'master_admin') return true;
  if (isMasterEmail(user.email)) return true;
  if (user.studentId && isMasterEmail(user.studentId)) return true;
  return false;
};

/**
 * Checks whether a role title represents a President, Vice President, or Lead Convener position.
 */
export const isPresidentOrVicePresidentTitle = (roleTitle?: string | null): boolean => {
  if (!roleTitle) return true;
  const title = roleTitle.toLowerCase();
  return (
    title.includes('president') ||
    title.includes('vice') ||
    title.includes('vp') ||
    title.includes('lead') ||
    title.includes('convener') ||
    title.includes('chair') ||
    title.includes('captain') ||
    title.includes('head')
  );
};

/**
 * Determines whether a user's email has been assigned by faculty for the President
 * or Vice President (or Lead Admin) position in a SPECIFIC club.
 * Under MITS regulations, a club leader ONLY has permissions for the club where
 * faculty has assigned their email for President or Vice President position,
 * and is strictly unable to modify any other clubs.
 */
export const isUserAssignedLeaderForClub = (
  user?: User | null,
  club?: Club | null
): boolean => {
  if (!user || !club) return false;
  if (isMasterUser(user)) return true;

  const userEmail = (user.email || '').trim().toLowerCase();
  if (!userEmail) return false;

  // 1. Primary Lead Email designated in club
  if (club.leadEmail && club.leadEmail.trim().toLowerCase() === userEmail) {
    return true;
  }

  // 2. Assigned in club.admins by Faculty for President or Vice President position
  if (club.admins && Array.isArray(club.admins)) {
    const adminMatch = club.admins.find(a => a.email && a.email.trim().toLowerCase() === userEmail);
    if (adminMatch) {
      if (isPresidentOrVicePresidentTitle(adminMatch.roleTitle)) {
        return true;
      }
    }
  }

  // 3. Assigned in club.members by Faculty with leader / co_leader status or President/VP title
  if (club.members && Array.isArray(club.members)) {
    const memberMatch = club.members.find(
      m => m.userEmail && m.userEmail.trim().toLowerCase() === userEmail && m.status === 'active'
    );
    if (memberMatch) {
      if (memberMatch.role === 'leader' || memberMatch.role === 'co_leader') {
        return true;
      }
      if (isPresidentOrVicePresidentTitle(memberMatch.roleTitle)) {
        return true;
      }
    }
  }

  // 4. Linked explicitly via user.clubId and verified role
  if (user.role === 'club_organizer' && user.clubId === club.id) {
    return true;
  }

  return false;
};

/**
 * Returns all clubs where the user is authorized to manage as Club Leader (President/Vice President).
 * Faculty and Master Control users receive all clubs.
 */
export const getAllowedClubsForUser = (
  user: User | null | undefined,
  clubs: Club[]
): Club[] => {
  if (!user) return [];
  if (isMasterUser(user) || user.role === 'faculty' || user.role === 'admin' || user.role === 'master_admin') {
    return clubs;
  }
  return clubs.filter(c => isUserAssignedLeaderForClub(user, c));
};

/**
 * Checks whether user has permission to organize/schedule events for a given club.
 * Club leaders are strictly restricted to only their assigned club.
 */
export const canUserOrganizeEventsForClub = (
  user: User | null | undefined,
  club: Club | null | undefined
): boolean => {
  if (!user || !club) return false;
  if (isMasterUser(user) || user.role === 'faculty' || user.role === 'admin' || user.role === 'master_admin') {
    return true;
  }
  return isUserAssignedLeaderForClub(user, club);
};

/**
 * Checks whether user has permission to modify a club's settings or admins.
 * Club leaders cannot modify other clubs.
 */
export const canUserModifyClub = (
  user: User | null | undefined,
  club: Club | null | undefined
): boolean => {
  if (!user || !club) return false;
  if (isMasterUser(user) || user.role === 'faculty' || user.role === 'admin' || user.role === 'master_admin') {
    return true;
  }
  return isUserAssignedLeaderForClub(user, club);
};

/**
 * Checks whether user can mark/take attendance for an event of a specific club.
 * Restricted strictly to Faculty Coordinators and designated Leaders of that specific club.
 */
export const canUserMarkAttendanceForClub = (
  user: User | null | undefined,
  clubId: string,
  clubs: Club[]
): boolean => {
  if (!user) return false;
  if (isMasterUser(user) || user.role === 'faculty' || user.role === 'admin' || user.role === 'master_admin') {
    return true;
  }
  const club = clubs.find(c => c.id === clubId);
  if (!club) return false;
  return isUserAssignedLeaderForClub(user, club);
};

/**
 * Validates whether an email complies with official institutional domains:
 * - Faculty & Dean: @mitsgwalior.in
 * - Students: @mitsgwl.ac.in
 * - Master Control: 25mc1la65@mits.gwl.ac.in / 25mc1la66@mitsgwl.ac.in
 * - Club Organizers: @mitsgwl.ac.in or @mitsgwalior.in
 */
export const validateEmailForRole = (
  email: string,
  role?: string
): { valid: boolean; message?: string } => {
  const clean = email.trim().toLowerCase();
  if (!clean) return { valid: false, message: 'Email address cannot be empty.' };

  // Master Control accounts are always unconditionally permitted
  if (isMasterEmail(clean)) {
    return { valid: true };
  }

  if (role === 'faculty' || role === 'admin') {
    if (!clean.endsWith('@mitsgwalior.in')) {
      return {
        valid: false,
        message: 'Domain Restriction: Faculty and Dean/Administrator accounts must use the official @mitsgwalior.in institutional email domain.'
      };
    }
    return { valid: true };
  }

  if (role === 'student') {
    if (!clean.endsWith('@mitsgwl.ac.in')) {
      return {
        valid: false,
        message: 'Domain Restriction: Student accounts must use the official @mitsgwl.ac.in institutional email domain.'
      };
    }
    return { valid: true };
  }

  // General or Club Organizer
  if (clean.endsWith('@mitsgwl.ac.in') || clean.endsWith('@mitsgwalior.in')) {
    return { valid: true };
  }

  return {
    valid: false,
    message: 'Invalid domain: Official institutional email must end with @mitsgwalior.in (Faculty/Dean) or @mitsgwl.ac.in (Students).'
  };
};
