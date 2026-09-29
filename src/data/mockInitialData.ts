import { Club, Registration, UniversityEvent, UniversityVenue, User } from '../types.js';

export const INITIAL_VENUES: UniversityVenue[] = [
  {
    id: 'venue-1',
    name: 'MITS Central Auditorium',
    building: 'Main Academic Block (Level 1), MITS Gwalior',
    capacity: 650,
    facilities: ['Dolby Surround Sound', 'Dual Laser 4K Projectors', 'Livestream Setup', 'Air Conditioned', 'Stage Lights']
  },
  {
    id: 'venue-2',
    name: 'Madhav IT Park Supercomputer Lab 402',
    building: 'Department of CSE & IT (Block B), MITS Gwalior',
    capacity: 85,
    facilities: ['High-Performance GPU Workstations', 'Gigabit Ethernet', 'Interactive Smartboard', 'Central AC']
  },
  {
    id: 'venue-3',
    name: 'Silver Jubilee Seminar Hall',
    building: 'Mechanical & Civil Engineering Complex, MITS Gwalior',
    capacity: 200,
    facilities: ['Podium Mic', 'Full HD Projector', 'Interactive Smart Board', 'Video Conferencing Facility']
  },
  {
    id: 'venue-4',
    name: 'Student Activity Centre (SAC) & Open Air Theatre',
    building: 'SAC Campus Greens, MITS Gwalior',
    capacity: 900,
    facilities: ['Open Stage Acoustics', 'Lawn Seating', 'Stage Floodlights', 'Audio Console']
  },
  {
    id: 'venue-5',
    name: 'Electrical & Electronics Seminar Hall',
    building: 'Electrical Engineering Department (Level 2), MITS Gwalior',
    capacity: 150,
    facilities: ['Digital Podium', 'Dual Display Monitors', 'Wi-Fi 6', 'Stereo Audio System']
  },
  {
    id: 'venue-6',
    name: 'Architecture Audio-Visual Theatre',
    building: 'Department of Architecture, MITS Gwalior',
    capacity: 120,
    facilities: ['4K Display Panel', 'Design Presentation Boards', 'Surround Audio']
  }
];

export const INITIAL_CLUBS: Club[] = [
  {
    id: 'club-iste',
    name: 'ISTE Students\' Chapter MITS',
    category: 'Technical',
    description: 'The premier chapter of the Indian Society for Technical Education at MITS Gwalior, organizing national hackathons, technical paper contests, and IoT labs.',
    logo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
    leadName: 'Devansh Sharma',
    leadEmail: 'iste@mitsgwl.ac.in',
    leadPhone: '+91 98234 11223',
    leadEnrollmentNo: '0901CS221045',
    leadYear: '4th Year',
    admins: [
      {
        id: 'adm-iste-1',
        name: 'Devansh Sharma',
        email: 'devansh.sharma@mitsgwl.ac.in',
        enrollmentNo: '0901CS221045',
        phone: '+91 98234 11223',
        year: '4th Year',
        department: 'Computer Science & Engineering',
        roleTitle: 'President & Tech Convener',
        addedAt: '2026-08-01T10:00:00Z'
      },
      {
        id: 'adm-iste-2',
        name: 'Tanya Mehra',
        email: 'tanya.mehra@mitsgwl.ac.in',
        enrollmentNo: '0901IT231064',
        phone: '+91 98112 33445',
        year: '3rd Year',
        department: 'Information Technology',
        roleTitle: 'Vice Lead & AI Coordinator',
        addedAt: '2026-08-15T14:30:00Z'
      }
    ],
    facultyAdvisor: 'Dr. Meera Nambiar (CSE Dept, MITS)',
    memberCount: 420,
    eventsHosted: 28,
    foundedYear: 2012,
    isVerified: true,
    socialLinks: {
      github: 'https://github.com/iste-mits',
      linkedin: 'https://linkedin.com/company/iste-mits',
      discord: 'https://discord.gg/mits-devs'
    } as any
  },
  {
    id: 'club-ieee',
    name: 'IEEE MITS Student Branch',
    category: 'Academic',
    description: 'IEEE Student Branch at MITS Gwalior advancing technological innovation and excellence through peer-reviewed research symposiums and faculty masterclasses.',
    logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
    leadName: 'Rohan Deshmukh',
    leadEmail: 'ieee@mitsgwl.ac.in',
    leadPhone: '+91 98334 55667',
    leadEnrollmentNo: '0901EE221031',
    leadYear: '4th Year',
    admins: [
      {
        id: 'adm-ieee-1',
        name: 'Rohan Deshmukh',
        email: 'rohan.deshmukh@mitsgwl.ac.in',
        enrollmentNo: '0901EE221031',
        phone: '+91 98334 55667',
        year: '4th Year',
        department: 'Electrical Engineering',
        roleTitle: 'Chairperson',
        addedAt: '2026-06-12T09:00:00Z'
      }
    ],
    facultyAdvisor: 'Dr. Anandita Sen (Dean Academic Affairs, MITS)',
    memberCount: 480,
    eventsHosted: 36,
    foundedYear: 2010,
    isVerified: true
  },
  {
    id: 'club-coding',
    name: 'MITS Coding Club',
    category: 'Technical',
    description: 'Official competitive programming and developer society at MITS Gwalior. Hosts weekly contest problem solving, GeeksforGeeks and CodeChef chapters.',
    logo: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
    leadName: 'Aarav Sharma',
    leadEmail: 'codingclub@mitsgwl.ac.in',
    leadPhone: '+91 98765 43210',
    leadEnrollmentNo: '0901CS221089',
    leadYear: '3rd Year',
    admins: [
      {
        id: 'adm-code-1',
        name: 'Aarav Sharma',
        email: 'aarav.sharma@mitsgwl.ac.in',
        enrollmentNo: '0901CS221089',
        phone: '+91 98765 43210',
        year: '3rd Year',
        department: 'Computer Science & Engineering',
        roleTitle: 'Club Convener & Lead',
        addedAt: '2026-07-01T10:00:00Z'
      }
    ],
    facultyAdvisor: 'Prof. Radhika Iyer (Faculty Advisor, MITS)',
    memberCount: 520,
    eventsHosted: 30,
    foundedYear: 2016,
    isVerified: true
  },
  {
    id: 'club-robotics',
    name: 'Robotics & Automation Society (MITS RAS)',
    category: 'Technical',
    description: 'Autonomous robotics, embedded IoT systems, and UAV quadcopter engineering society participating in national roboraces and drone challenges.',
    logo: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=150&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
    leadName: 'Priya Sundaram',
    leadEmail: 'robotics@mitsgwl.ac.in',
    leadPhone: '+91 98987 65432',
    leadEnrollmentNo: '0901EC221019',
    leadYear: '4th Year',
    admins: [
      {
        id: 'adm-robotics-1',
        name: 'Priya Sundaram',
        email: 'priya.sundaram@mitsgwl.ac.in',
        enrollmentNo: '0901EC221019',
        phone: '+91 98987 65432',
        year: '4th Year',
        department: 'Electronics & Communication',
        roleTitle: 'President & Hardware Convener',
        addedAt: '2026-07-20T11:00:00Z'
      }
    ],
    facultyAdvisor: 'Dr. Rajesh Kulkarni (HOD ECE, MITS)',
    memberCount: 260,
    eventsHosted: 19,
    foundedYear: 2017,
    isVerified: true
  },
  {
    id: 'club-spandan',
    name: 'Spandan - Cultural & Arts Society MITS',
    category: 'Cultural',
    description: 'Celebrating theatre, music, dance, visual arts, and the signature annual cultural festival of Madhav Institute of Technology and Science Gwalior.',
    logo: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
    leadName: 'Ananya Roy',
    leadEmail: 'spandan@mitsgwl.ac.in',
    leadPhone: '+91 98456 77889',
    leadEnrollmentNo: '0901CE231012',
    leadYear: '3rd Year',
    admins: [
      {
        id: 'adm-spandan-1',
        name: 'Ananya Roy',
        email: 'ananya.roy@mitsgwl.ac.in',
        enrollmentNo: '0901CE231012',
        phone: '+91 98456 77889',
        year: '3rd Year',
        department: 'Civil Engineering',
        roleTitle: 'General Secretary',
        addedAt: '2026-07-01T12:00:00Z'
      }
    ],
    facultyAdvisor: 'Prof. Vikram Saxena (Dean Student Welfare, MITS)',
    memberCount: 390,
    eventsHosted: 32,
    foundedYear: 2013,
    isVerified: true
  },
  {
    id: 'club-baja',
    name: 'BAJA SAE MITS Collegiate Club',
    category: 'Technical',
    description: 'MITS student motorsports club engineering all-terrain vehicles and Formula electric prototypes for national SAE India competitions.',
    logo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=150&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80',
    leadName: 'Siddharth Jain',
    leadEmail: 'baja@mitsgwl.ac.in',
    leadPhone: '+91 98770 99881',
    leadEnrollmentNo: '0901ME221055',
    leadYear: '4th Year',
    admins: [
      {
        id: 'adm-baja-1',
        name: 'Siddharth Jain',
        email: 'siddharth.j@mitsgwl.ac.in',
        enrollmentNo: '0901ME221055',
        phone: '+91 98770 99881',
        year: '4th Year',
        department: 'Mechanical Engineering',
        roleTitle: 'Team Captain & Powertrain Lead',
        addedAt: '2026-08-10T16:00:00Z'
      }
    ],
    facultyAdvisor: 'Dr. C. S. Malvi (Mechanical Dept, MITS)',
    memberCount: 190,
    eventsHosted: 15,
    foundedYear: 2015,
    isVerified: true
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-student-1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@mitsgwl.ac.in',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    studentId: '0901CS221089',
    phone: '+91 98765 43210',
    department: 'Computer Science & Engineering',
    year: '3rd Year'
  },
  {
    id: 'user-student-2',
    name: 'Sneha Patel',
    email: 'sneha.patel@mitsgwl.ac.in',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    studentId: '0901EC231044',
    phone: '+91 91234 56789',
    department: 'Electronics & Communication',
    year: '2nd Year'
  },
  {
    id: 'user-faculty-1',
    name: 'Prof. Radhika Iyer',
    email: 'radhika.iyer@mitsgwalior.in',
    role: 'faculty',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    facultyId: 'FAC-MITS-CS42',
    designation: 'Professor & Faculty Advisor',
    department: 'Computer Science & Engineering',
    phone: '+91 98451 22334'
  },
  {
    id: 'user-faculty-2',
    name: 'Dr. Rajesh Kulkarni',
    email: 'rajesh.kulkarni@mitsgwalior.in',
    role: 'faculty',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
    facultyId: 'FAC-MITS-EC08',
    designation: 'Head of Department (HOD)',
    department: 'Electronics & Communication',
    phone: '+91 98765 11223'
  },
  {
    id: 'user-club-1',
    name: 'Devansh Sharma (ISTE MITS Admin)',
    email: 'iste@mitsgwl.ac.in',
    role: 'club_organizer',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
    studentId: '0901CS221045',
    phone: '+91 98234 11223',
    department: 'Computer Science & Engineering',
    year: '4th Year',
    clubId: 'club-iste',
    clubName: 'ISTE Students\' Chapter MITS'
  },
  {
    id: 'user-club-2',
    name: 'Priya Sundaram (MITS RAS Admin)',
    email: 'robotics@mitsgwl.ac.in',
    role: 'club_organizer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    studentId: '0901EC221019',
    phone: '+91 98987 65432',
    department: 'Electronics & Communication',
    year: '4th Year',
    clubId: 'club-robotics',
    clubName: 'Robotics & Automation Society (MITS RAS)'
  },
  {
    id: 'user-admin-1',
    name: 'Dr. Anandita Sen (Dean Academic Affairs)',
    email: 'dean.academics@mitsgwalior.in',
    role: 'admin',
    phone: '+91 91122 33445',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-master-1',
    name: 'Lakshya Rathore',
    email: '25mc1la65@mitsgwl.ac.in',
    role: 'student',
    studentId: 'BTMC25O1065',
    designation: 'Student',
    department: 'Mathematics and computing',
    year: '2nd Year',
    phone: '+91 98930 11001',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-master-2',
    name: 'Lakshya Sharma',
    email: '25mc1la66@mitsgwl.ac.in',
    role: 'student',
    studentId: 'BTMC25O1066',
    designation: 'Student',
    department: 'Mathematics and computing',
    year: '2nd Year',
    phone: '+91 98930 11002',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80'
  }
];

const now = new Date();
const formatDate = (daysAhead: number) => {
  const d = new Date(now.getTime() + daysAhead * 86400000);
  return d.toISOString().split('T')[0];
};

export const INITIAL_EVENTS: UniversityEvent[] = [
  {
    id: 'evt-1',
    title: 'MITS National Hackathon 2026 (Hack-MITS)',
    tagline: '36-hour code sprint tackling Smart Cities, Agri-Tech, and Generative AI.',
    description: 'Flagship national collegiate hackathon hosted by ISTE Students\' Chapter MITS Gwalior. Teams from top engineering institutions across the country compete for ₹150,000 in prizes, incubation backing, and direct mentor reviews.',
    clubId: 'club-iste',
    clubName: 'ISTE Students\' Chapter MITS',
    clubLogo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80',
    category: 'Hackathon',
    coverImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1000&auto=format&fit=crop&q=80',
    startDate: formatDate(3),
    startTime: '09:00',
    endDate: formatDate(4),
    endTime: '20:00',
    venue: 'MITS Central Auditorium',
    venueId: 'venue-1',
    isOnline: false,
    capacity: 450,
    registeredCount: 320,
    registrationDeadline: formatDate(2),
    fee: 0,
    tags: ['Hackathon', 'MITS Gwalior', 'Cash Prizes', 'Incubation', 'Coding'],
    speakers: [
      {
        name: 'Er. Tarun Singhania',
        role: 'MITS Alum & VP Engineering',
        companyOrCollege: 'HyperScale Systems',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'
      }
    ],
    agenda: [
      { id: 'ag-1', time: 'Day 1 - 09:00 AM', title: 'Registration, Badge Verification & Kit Distribution' },
      { id: 'ag-2', time: 'Day 1 - 10:30 AM', title: 'Inauguration by Director MITS & Problem Statement Release' },
      { id: 'ag-3', time: 'Day 1 - 08:00 PM', title: 'Round 1 Mentorship & Code Review' },
      { id: 'ag-4', time: 'Day 2 - 04:00 PM', title: 'Final Pitching to Jury Panel' },
      { id: 'ag-5', time: 'Day 2 - 07:00 PM', title: 'Prize Distribution & Valedictory Ceremony' }
    ],
    prerequisites: ['Valid MITS or College Student ID Card', 'Bring personal laptop & chargers', 'Team of 2 to 4 members'],
    certificatesProvided: true,
    facultyCoordinator: 'Prof. Radhika Iyer',
    facultyCoordinatorEmail: 'radhika.iyer@mitsgwalior.in',
    facultyCoordinatorDept: 'Department of Computer Science & Engineering',
    status: 'upcoming',
    contactEmail: 'iste@mitsgwl.ac.in',
    createdAt: new Date().toISOString()
  },
  {
    id: 'evt-2',
    title: 'IEEE Workshop: Applied AI, LLMs & Edge Computing',
    tagline: 'Hands-on lab deploying quantised neural models on edge micro-controllers.',
    description: 'Organized by IEEE MITS Student Branch. Comprehensive lab training covering ONNX runtime, PyTorch model pruning, and running local LLM inference on modern edge boards. Laptops required.',
    clubId: 'club-ieee',
    clubName: 'IEEE MITS Student Branch',
    clubLogo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80',
    category: 'Workshop',
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1000&auto=format&fit=crop&q=80',
    startDate: formatDate(5),
    startTime: '10:00',
    endDate: formatDate(5),
    endTime: '16:30',
    venue: 'Madhav IT Park Supercomputer Lab 402',
    venueId: 'venue-2',
    isOnline: false,
    capacity: 80,
    registeredCount: 68,
    registrationDeadline: formatDate(4),
    fee: 0,
    tags: ['Edge AI', 'IEEE', 'MITS Hands-on', 'Python', 'Certificates'],
    speakers: [
      {
        name: 'Dr. Anandita Sen',
        role: 'Dean Academic Affairs & IEEE Senior Member',
        companyOrCollege: 'MITS Gwalior',
        avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&auto=format&fit=crop&q=80'
      }
    ],
    agenda: [
      { id: 'ag-21', time: '10:00 - 11:30 AM', title: 'Edge Hardware Architecture & Quantisation Principles' },
      { id: 'ag-22', time: '11:45 - 01:15 PM', title: 'Hands-on: Converting PyTorch Models to ONNX & TensorRT' },
      { id: 'ag-23', time: '02:00 - 04:00 PM', title: 'Lab Deployment to Edge GPU Boards' },
      { id: 'ag-24', time: '04:00 - 04:30 PM', title: 'Performance Benchmark & IEEE Certificate Handover' }
    ],
    certificatesProvided: true,
    facultyCoordinator: 'Dr. Rajesh Kulkarni',
    facultyCoordinatorEmail: 'rajesh.kulkarni@mitsgwalior.in',
    facultyCoordinatorDept: 'Department of Electronics & Communication',
    status: 'upcoming',
    contactEmail: 'ieee@mitsgwl.ac.in',
    createdAt: new Date().toISOString()
  },
  {
    id: 'evt-3',
    title: 'Autonomous Drone Flight & PX4 Autopilot Masterclass',
    tagline: 'Practical flight hardware assembly, optical flow debugging, and radio telemetry.',
    description: 'Robotics & Automation Society (MITS RAS) brings a hands-on drone engineering lab. Participants build, wire, calibrate gyro sensors, and fly obstacle-avoidance quadcopters at the MITS Sports Ground arena.',
    clubId: 'club-robotics',
    clubName: 'Robotics & Automation Society (MITS RAS)',
    clubLogo: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=150&auto=format&fit=crop&q=80',
    category: 'Workshop',
    coverImage: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=1000&auto=format&fit=crop&q=80',
    startDate: formatDate(7),
    startTime: '13:00',
    endDate: formatDate(7),
    endTime: '18:00',
    venue: 'Silver Jubilee Seminar Hall',
    venueId: 'venue-3',
    isOnline: false,
    capacity: 75,
    registeredCount: 58,
    registrationDeadline: formatDate(6),
    fee: 0,
    tags: ['Robotics', 'Drones', 'UAV', 'MITS RAS', 'Hardware'],
    speakers: [
      {
        name: 'Priya Sundaram',
        role: 'Hardware Convener & Drone Researcher',
        companyOrCollege: 'MITS RAS Society',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
      }
    ],
    agenda: [
      { id: 'ag-31', time: '01:00 - 02:30 PM', title: 'Aerodynamics, PID Control Loops & ESC Wiring' },
      { id: 'ag-32', time: '02:45 - 04:30 PM', title: 'Telemetry Linking & Betaflight Sensor Calibration' },
      { id: 'ag-33', time: '04:45 - 06:00 PM', title: 'Outdoor Flight Trials on SAC Sports Ground' }
    ],
    certificatesProvided: true,
    facultyCoordinator: 'Dr. Rajesh Kulkarni',
    facultyCoordinatorEmail: 'rajesh.kulkarni@mitsgwalior.in',
    facultyCoordinatorDept: 'Department of Electronics & Communication',
    status: 'upcoming',
    contactEmail: 'robotics@mitsgwl.ac.in',
    createdAt: new Date().toISOString()
  },
  {
    id: 'evt-4',
    title: 'Spandan 2026: Campus Cultural Gala & Unplugged Night',
    tagline: 'An evening of classical ragas, modern acoustic fusion, and open-mic storytelling.',
    description: 'The premier annual cultural showcase of Madhav Institute of Technology and Science Gwalior at the open air theatre. Features student orchestra, street theatre, and celebrity guest band performance.',
    clubId: 'club-spandan',
    clubName: 'Spandan - Cultural & Arts Society MITS',
    clubLogo: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80',
    category: 'Cultural',
    coverImage: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1000&auto=format&fit=crop&q=80',
    startDate: formatDate(9),
    startTime: '18:00',
    endDate: formatDate(9),
    endTime: '22:30',
    venue: 'Student Activity Centre (SAC) & Open Air Theatre',
    venueId: 'venue-4',
    isOnline: false,
    capacity: 900,
    registeredCount: 640,
    registrationDeadline: formatDate(8),
    fee: 0,
    tags: ['Spandan', 'Cultural', 'MITS Gwalior', 'Music', 'Theatre'],
    speakers: [
      {
        name: 'The MITS Ensemble',
        role: 'Student Orchestra & Vocal Society',
        companyOrCollege: 'Spandan Cultural Wing',
        avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80'
      }
    ],
    agenda: [
      { id: 'ag-41', time: '06:00 - 07:15 PM', title: 'Classical Saraswati Vandana & Instrumental Medley' },
      { id: 'ag-42', time: '07:30 - 09:00 PM', title: 'Inter-Department Drama & Skit Showcase' },
      { id: 'ag-43', time: '09:15 - 10:30 PM', title: 'Unplugged Fusion Band & Light Show' }
    ],
    certificatesProvided: false,
    facultyCoordinator: 'Prof. Vikram Saxena',
    facultyCoordinatorEmail: 'dean.dsw@mitsgwalior.in',
    facultyCoordinatorDept: 'Office of Dean Student Welfare',
    status: 'upcoming',
    contactEmail: 'spandan@mitsgwl.ac.in',
    createdAt: new Date().toISOString()
  },
  {
    id: 'evt-comp-1',
    title: 'MITS Faculty-Student Symposium on Cloud Computing & Microservices',
    tagline: 'Academic seminar on Docker, Kubernetes orchestrations, and zero-trust security.',
    description: 'Departmental seminar for CSE/IT students and faculty on building cloud-native infrastructure with Kubernetes and automated CI/CD pipelines.',
    clubId: 'club-coding',
    clubName: 'MITS Coding Club',
    clubLogo: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150&auto=format&fit=crop&q=80',
    category: 'Seminar',
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1000&auto=format&fit=crop&q=80',
    startDate: '2026-09-12',
    startTime: '10:00',
    endDate: '2026-09-12',
    endTime: '15:30',
    venue: 'Madhav IT Park Supercomputer Lab 402',
    venueId: 'venue-2',
    isOnline: false,
    capacity: 70,
    registeredCount: 65,
    registrationDeadline: '2026-09-11',
    fee: 0,
    tags: ['Cloud', 'Kubernetes', 'MITS Gwalior', 'Completed'],
    speakers: [
      {
        name: 'Prof. Radhika Iyer',
        role: 'Faculty Advisor',
        companyOrCollege: 'Department of CSE, MITS',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
      }
    ],
    agenda: [
      { id: 'ag-c1', time: '10:00 - 12:00', title: 'Containerization Best Practices' },
      { id: 'ag-c2', time: '01:00 - 03:30', title: 'Cluster Orchestration & Ingress Security' }
    ],
    certificatesProvided: true,
    facultyCoordinator: 'Prof. Radhika Iyer',
    facultyCoordinatorEmail: 'radhika.iyer@mitsgwalior.in',
    facultyCoordinatorDept: 'Department of Computer Science & Engineering',
    status: 'completed',
    contactEmail: 'codingclub@mitsgwl.ac.in',
    createdAt: '2026-09-01T08:00:00.000Z'
  }
];

export const INITIAL_REGISTRATIONS: Registration[] = [
  {
    id: 'reg-demo-1',
    eventId: 'evt-1',
    userId: 'user-student-1',
    userName: 'Aarav Sharma',
    userEmail: 'aarav.sharma@mitsgwl.ac.in',
    studentId: '0901CS221089',
    phone: '+91 98765 43210',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    ticketCode: 'MITS-2026-HK-8192',
    registeredAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    status: 'confirmed',
    emailSent: true,
    emailSentAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=MITS-PASS:MITS-2026-HK-8192:evt-1:aarav.sharma@mitsgwl.ac.in'
  },
  {
    id: 'reg-demo-2',
    eventId: 'evt-1',
    userId: 'user-student-2',
    userName: 'Sneha Patel',
    userEmail: 'sneha.patel@mitsgwl.ac.in',
    studentId: '0901EC231044',
    phone: '+91 91234 56789',
    department: 'Electronics & Communication',
    year: '2nd Year',
    ticketCode: 'MITS-2026-HK-4521',
    registeredAt: new Date(Date.now() - 3600000 * 24 * 2.5).toISOString(),
    status: 'checked_in',
    attendanceStatus: 'present',
    attendanceMarkedBy: 'Prof. Radhika Iyer (Faculty Advisor)',
    checkedInAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    emailSent: true,
    emailSentAt: new Date(Date.now() - 3600000 * 24 * 2.5).toISOString(),
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=MITS-PASS:MITS-2026-HK-4521:evt-1:sneha.patel@mitsgwl.ac.in'
  },
  {
    id: 'reg-demo-3',
    eventId: 'evt-2',
    userId: 'user-student-1',
    userName: 'Aarav Sharma',
    userEmail: 'aarav.sharma@mitsgwl.ac.in',
    studentId: '0901CS221089',
    phone: '+91 98765 43210',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    ticketCode: 'MITS-2026-AI-9014',
    registeredAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    status: 'confirmed',
    emailSent: true,
    emailSentAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=MITS-PASS:MITS-2026-AI-9014:evt-2:aarav.sharma@mitsgwl.ac.in'
  },
  {
    id: 'reg-demo-4',
    eventId: 'evt-comp-1',
    userId: 'user-student-1',
    userName: 'Aarav Sharma',
    userEmail: 'aarav.sharma@mitsgwl.ac.in',
    studentId: '0901CS221089',
    phone: '+91 98765 43210',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    ticketCode: 'MITS-2026-CC-3180',
    registeredAt: '2026-09-08T10:00:00.000Z',
    status: 'checked_in',
    attendanceStatus: 'present',
    attendanceMarkedBy: 'Prof. Radhika Iyer (Faculty Advisor)',
    checkedInAt: '2026-09-12T10:15:00.000Z',
    certificateId: 'CERT-MITS-2026-CC-8192',
    certificateIssuedAt: '2026-09-12T16:00:00.000Z',
    emailSent: true,
    emailSentAt: '2026-09-08T10:00:00.000Z',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=MITS-PASS:MITS-2026-CC-3180:evt-comp-1:aarav.sharma@mitsgwl.ac.in'
  }
];
