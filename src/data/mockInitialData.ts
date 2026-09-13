import { Club, UniversityEvent, UniversityVenue, User } from '../types.js';

export const INITIAL_VENUES: UniversityVenue[] = [
  {
    id: 'venue-1',
    name: 'Sir C.V. Raman Auditorium',
    building: 'Main Academic Block (Level 1)',
    capacity: 450,
    facilities: ['Dolby Surround Sound', 'Dual 4K Projectors', 'Livestream Setup', 'Air Conditioned']
  },
  {
    id: 'venue-2',
    name: 'Turing Computer Lab 402',
    building: 'School of Computing (Block D)',
    capacity: 70,
    facilities: ['High-Performance GPU Workstations', 'Dual Monitors', 'Ethernet 1Gbps', 'Whiteboard']
  },
  {
    id: 'venue-3',
    name: 'APJ Abdul Kalam Seminar Hall',
    building: 'Science & Research Complex (Block B)',
    capacity: 180,
    facilities: ['Podium Mic', 'HD Projector', 'Interactive Smart Board', 'Video Conferencing']
  },
  {
    id: 'venue-4',
    name: 'Open Air Amphitheatre',
    building: 'Central Campus Plaza',
    capacity: 800,
    facilities: ['Stage Lighting Rig', 'Open Stage Acoustics', 'Lawn Seating', 'Drone Recording Deck']
  },
  {
    id: 'venue-5',
    name: 'Innovation & Incubation Hub',
    building: 'Student Activity Centre (Floor 3)',
    capacity: 120,
    facilities: ['Movable Pods', 'Prototyping Tools', 'Breakout Lounges', 'High-Speed Wi-Fi']
  }
];

export const INITIAL_CLUBS: Club[] = [
  {
    id: 'club-codecraft',
    name: 'CodeCraft - Developers & AI Club',
    category: 'Technical',
    description: 'The premier software engineering, open source, and artificial intelligence student community dedicated to hands-on workshops and building real-world projects.',
    logo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
    leadName: 'Devansh Verma',
    leadEmail: 'codecraft@campus.edu',
    facultyAdvisor: 'Dr. Meera Nambiar (CSE Dept)',
    memberCount: 380,
    eventsHosted: 24,
    foundedYear: 2018,
    isVerified: true,
    socialLinks: {
      github: 'https://github.com/codecraft-uni',
      linkedin: 'https://linkedin.com/company/codecraft',
      discord: 'https://discord.gg/campus-devs'
    } as any
  },
  {
    id: 'club-robotics',
    name: 'RoboKnights - Robotics Society',
    category: 'Technical',
    description: 'Autonomous robotics, embedded IoT systems, and drone engineering club participating in international roboraces and industrial hackathons.',
    logo: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=150&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
    leadName: 'Priya Sundaram',
    leadEmail: 'robotics@campus.edu',
    facultyAdvisor: 'Prof. Rajesh Kulkarni (ECE Dept)',
    memberCount: 210,
    eventsHosted: 16,
    foundedYear: 2019,
    isVerified: true
  },
  {
    id: 'club-ieee',
    name: 'IEEE University Student Branch',
    category: 'Academic',
    description: 'Advancing technology for humanity through peer-reviewed research seminars, technical symposiums, and faculty-led masterclasses.',
    logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
    leadName: 'Rohan Deshmukh',
    leadEmail: 'ieee@campus.edu',
    facultyAdvisor: 'Dr. Anandita Sen (Dean Academic Affairs)',
    memberCount: 450,
    eventsHosted: 32,
    foundedYear: 2014,
    isVerified: true
  },
  {
    id: 'club-design-cult',
    name: 'Drishti - Arts & Cultural Collective',
    category: 'Cultural',
    description: 'Celebrating theater, music, visual arts, design sprints, and the university annual cultural fest through vibrant campus showcases.',
    logo: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
    leadName: 'Ananya Roy',
    leadEmail: 'drishti@campus.edu',
    facultyAdvisor: 'Prof. Vikram Saxena (Humanities)',
    memberCount: 320,
    eventsHosted: 28,
    foundedYear: 2016,
    isVerified: true
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-student-1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@campus.edu',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    studentId: 'UNI-2023-CS089',
    department: 'Computer Science & Engineering',
    year: '3rd Year'
  },
  {
    id: 'user-club-1',
    name: 'Devansh Verma (CodeCraft Club)',
    email: 'codecraft@campus.edu',
    role: 'club_organizer',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
    clubId: 'club-codecraft',
    clubName: 'CodeCraft - Developers & AI Club'
  },
  {
    id: 'user-club-2',
    name: 'Priya Sundaram (RoboKnights)',
    email: 'robotics@campus.edu',
    role: 'club_organizer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    clubId: 'club-robotics',
    clubName: 'RoboKnights - Robotics Society'
  },
  {
    id: 'user-admin-1',
    name: 'Dr. Anandita Sen (Dean Student Affairs)',
    email: 'dean.affairs@campus.edu',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80'
  }
];

// Reference base date relative to current time or near upcoming days
const now = new Date();
const formatDate = (daysAhead: number) => {
  const d = new Date(now.getTime() + daysAhead * 86400000);
  return d.toISOString().split('T')[0];
};

export const INITIAL_EVENTS: UniversityEvent[] = [
  {
    id: 'evt-1',
    title: 'Generative AI & LLM Agent Architecture Workshop',
    tagline: 'Hands-on training building multi-agent systems with vector search and modern LLMs.',
    description: 'Join CodeCraft for an intensive full-day workshop diving into Generative AI engineering. Students will develop custom autonomous agent systems, integrate semantic document retrieval, and deploy full-stack applications. Open to all students with basic Python knowledge. Laptops required.',
    clubId: 'club-codecraft',
    clubName: 'CodeCraft - Developers & AI Club',
    clubLogo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80',
    category: 'Workshop',
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1000&auto=format&fit=crop&q=80',
    startDate: formatDate(3),
    startTime: '10:00',
    endDate: formatDate(3),
    endTime: '16:30',
    venue: 'Turing Computer Lab 402',
    venueId: 'venue-2',
    isOnline: false,
    capacity: 70,
    registeredCount: 52,
    registrationDeadline: formatDate(2),
    fee: 0,
    tags: ['Artificial Intelligence', 'Python', 'Hands-on', 'Certificate'],
    speakers: [
      {
        name: 'Arjun Mehta',
        role: 'Staff ML Engineer',
        companyOrCollege: 'Google DeepMind Alum',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
      },
      {
        name: 'Neha Kapoor',
        role: 'AI Research Scholar',
        companyOrCollege: 'Dept of CSE',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
      }
    ],
    agenda: [
      { id: 'ag-1', time: '10:00 - 11:15 AM', title: 'Foundations of Neural Transformers & Attention Mechanisms', speaker: 'Arjun Mehta' },
      { id: 'ag-2', time: '11:30 - 01:00 PM', title: 'Lab Session: Fine-tuning & Retrieval Augmented Generation (RAG)', speaker: 'Neha Kapoor' },
      { id: 'ag-3', time: '01:00 - 02:00 PM', title: 'Complimentary Lunch & Networking at Cafeteria', speaker: 'CodeCraft Team' },
      { id: 'ag-4', time: '02:00 - 04:00 PM', title: 'Mini-Hack: Build a Campus Academic Query Bot', speaker: 'Both Instructors' },
      { id: 'ag-5', time: '04:00 - 04:30 PM', title: 'Project Demos & Certificate Distribution', speaker: 'Faculty Advisor' }
    ],
    prerequisites: ['Basic Python programming', 'Bring your laptop with VS Code or Jupyter', 'College student ID card'],
    certificatesProvided: true,
    status: 'upcoming',
    contactEmail: 'codecraft@campus.edu',
    createdAt: new Date().toISOString()
  },
  {
    id: 'evt-2',
    title: 'Future of Quantum Computing & Cryptography',
    tagline: 'Distinguished university research seminar on post-quantum encryption protocols.',
    description: 'The IEEE Student Branch invites professors, graduate researchers, and undergraduate engineering students to an authoritative seminar unpacking the physics of superconducting qubits and the modern race for quantum-resistant lattice cryptographic standards.',
    clubId: 'club-ieee',
    clubName: 'IEEE University Student Branch',
    clubLogo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80',
    category: 'Seminar',
    coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1000&auto=format&fit=crop&q=80',
    startDate: formatDate(5),
    startTime: '14:00',
    endDate: formatDate(5),
    endTime: '17:00',
    venue: 'APJ Abdul Kalam Seminar Hall',
    venueId: 'venue-3',
    isOnline: false,
    capacity: 180,
    registeredCount: 128,
    registrationDeadline: formatDate(4),
    fee: 0,
    tags: ['Research', 'Quantum Tech', 'Cybersecurity', 'IEEE Certified'],
    speakers: [
      {
        name: 'Prof. Christopher Vance',
        role: 'Chair of Quantum Information Lab',
        companyOrCollege: 'National Institute of Quantum Physics',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
      }
    ],
    agenda: [
      { id: 'ag-21', time: '02:00 - 02:15 PM', title: 'Opening Remarks & Introduction by IEEE Branch Chair', speaker: 'Rohan Deshmukh' },
      { id: 'ag-22', time: '02:15 - 03:30 PM', title: 'Keynote: Superconducting Qubits and Quantum Supremacy Milestones', speaker: 'Prof. Christopher Vance' },
      { id: 'ag-23', time: '03:45 - 04:30 PM', title: 'Panel Discussion on Post-Quantum Cryptography Algorithms', speaker: 'Panel of Faculty' },
      { id: 'ag-24', time: '04:30 - 05:00 PM', title: 'Audience Q&A & Research Fellowship Guidance', speaker: 'Prof. Christopher Vance' }
    ],
    certificatesProvided: true,
    status: 'upcoming',
    contactEmail: 'ieee@campus.edu',
    createdAt: new Date().toISOString()
  },
  {
    id: 'evt-3',
    title: 'HackCampus 2026: 36-Hour National Collegiate Hackathon',
    tagline: 'Code, collaborate, and compete for ₹150,000 prize pool and mentorship from tech leads.',
    description: 'The biggest annual technical challenge of the university! 400+ developers from 50 colleges converging on campus to solve pressing real-world challenges across FinTech, HealthTech, Sustainable Energy, and AI for Social Good. High-speed Wi-Fi, 24-hour food, energy drinks, and fun mini-games included.',
    clubId: 'club-codecraft',
    clubName: 'CodeCraft - Developers & AI Club',
    clubLogo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80',
    category: 'Hackathon',
    coverImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1000&auto=format&fit=crop&q=80',
    startDate: formatDate(10),
    startTime: '09:00',
    endDate: formatDate(11),
    endTime: '21:00',
    venue: 'Sir C.V. Raman Auditorium',
    venueId: 'venue-1',
    isOnline: false,
    capacity: 450,
    registeredCount: 340,
    registrationDeadline: formatDate(8),
    fee: 0,
    tags: ['Hackathon', 'Coding', 'Prizes', 'Sponsorships', 'Networking'],
    speakers: [
      {
        name: 'Tarun Singhania',
        role: 'VP of Engineering',
        companyOrCollege: 'HyperScale Systems',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'
      }
    ],
    agenda: [
      { id: 'ag-31', time: 'Day 1 - 09:00 AM', title: 'Check-in, Swag Distribution & Team Formation' },
      { id: 'ag-32', time: 'Day 1 - 10:30 AM', title: 'Problem Statements Released & Hacking Commences' },
      { id: 'ag-33', time: 'Day 1 - 07:00 PM', title: 'Mentorship Rounds with Industry Veterans' },
      { id: 'ag-34', time: 'Day 2 - 03:00 PM', title: 'Project Code Freeze & Expo Booth Setup' },
      { id: 'ag-35', time: 'Day 2 - 06:00 PM', title: 'Final Pitching & Grand Award Ceremony' }
    ],
    certificatesProvided: true,
    status: 'upcoming',
    contactEmail: 'hackcampus@campus.edu',
    createdAt: new Date().toISOString()
  },
  {
    id: 'evt-4',
    title: 'Autonomous Drone Navigation & Embedded Robotics',
    tagline: 'Design, solder, and calibrate flight controllers with computer vision guidance.',
    description: 'Learn quadcopter aerodynamics, PX4 autopilot integration, and optical flow sensor calibration. Participants get to fly mini-drones through precision obstacle courses in the campus arena.',
    clubId: 'club-robotics',
    clubName: 'RoboKnights - Robotics Society',
    clubLogo: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=150&auto=format&fit=crop&q=80',
    category: 'Workshop',
    coverImage: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=1000&auto=format&fit=crop&q=80',
    startDate: formatDate(7),
    startTime: '13:30',
    endDate: formatDate(7),
    endTime: '18:00',
    venue: 'Innovation & Incubation Hub',
    venueId: 'venue-5',
    isOnline: false,
    capacity: 60,
    registeredCount: 45,
    registrationDeadline: formatDate(6),
    fee: 0,
    tags: ['Robotics', 'Hardware', 'Drones', 'Sensors'],
    speakers: [
      {
        name: 'Priya Sundaram',
        role: 'Robotics Lead & UAV Researcher',
        companyOrCollege: 'RoboKnights Society',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
      }
    ],
    agenda: [
      { id: 'ag-41', time: '01:30 - 02:45 PM', title: 'Aerodynamics & PID Flight Loop Tuning' },
      { id: 'ag-42', time: '03:00 - 04:30 PM', title: 'Hands-on Telemetry & Sensor Calibration' },
      { id: 'ag-43', time: '04:30 - 05:45 PM', title: 'Live Obstacle Course Flight Tests' }
    ],
    certificatesProvided: true,
    status: 'upcoming',
    contactEmail: 'robotics@campus.edu',
    createdAt: new Date().toISOString()
  },
  {
    id: 'evt-5',
    title: 'Symphony Under the Stars: Campus Unplugged Night',
    tagline: 'An evening of live indie fusion, acoustic performances, and spoken word poetry.',
    description: 'Take a break from midterm assignments and join the Arts & Cultural Collective for an enchanting acoustic musical night at the central amphitheatre under the stars.',
    clubId: 'club-design-cult',
    clubName: 'Drishti - Arts & Cultural Collective',
    clubLogo: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80',
    category: 'Cultural',
    coverImage: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1000&auto=format&fit=crop&q=80',
    startDate: formatDate(6),
    startTime: '18:30',
    endDate: formatDate(6),
    endTime: '22:00',
    venue: 'Open Air Amphitheatre',
    venueId: 'venue-4',
    isOnline: false,
    capacity: 800,
    registeredCount: 512,
    registrationDeadline: formatDate(5),
    fee: 0,
    tags: ['Music', 'Acoustic', 'Art', 'Open Mic', 'Night Fest'],
    speakers: [
      {
        name: 'The Campus Ensemble',
        role: 'Student Orchestra & Folk Band',
        companyOrCollege: 'Drishti Cultural Wing',
        avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80'
      }
    ],
    agenda: [
      { id: 'ag-51', time: '06:30 - 07:30 PM', title: 'Acoustic Covers & Vocal Solos' },
      { id: 'ag-52', time: '07:30 - 08:45 PM', title: 'Indie Fusion Rock Band Set' },
      { id: 'ag-53', time: '09:00 - 10:00 PM', title: 'Open Mic Poetry & Jamming Session' }
    ],
    certificatesProvided: false,
    status: 'upcoming',
    contactEmail: 'drishti@campus.edu',
    createdAt: new Date().toISOString()
  }
];
