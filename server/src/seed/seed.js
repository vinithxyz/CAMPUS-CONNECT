import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Building from '../models/Building.js';
import Report from '../models/Report.js';
import Counter from '../models/Counter.js';
import Notification from '../models/Notification.js';
import ReportNote from '../models/ReportNote.js';
import AuditLog from '../models/AuditLog.js';
import KnowledgeArticle from '../models/KnowledgeArticle.js';


const C = { lat: 12.6599, lng: 77.4512 }; // Dayananda Sagar University, Harohalli 562112

const BUILDINGS = [
  ['LIB', 'Central Library', 0.0012, -0.0016],
  ['ACD', 'Academic Block', 0.0004, 0.0003],
  ['HOS', 'Student Hostel', 0.0016, 0.0014],
  ['BLA', 'Engineering Block A', -0.0006, -0.001],
  ['BLB', 'Management Block B', -0.0014, 0.0012],
  ['CAN', 'University Food Court', -0.0002, 0.002],
  ['GATE', 'Main Entrance Gate', -0.002, -0.0004],
];

// id, title, buildingCode, room, category, priority, status, daysAgo, [dLat,dLng jitter], description
const REPORTS = [
  [12, 'Leaking tap', 'BLA', 'Block A - Room 104', 'plumbing', 'medium', 'in_progress', 11, [0.00004, 0.00003], 'The tap in the washroom is leaking and wasting water.'],
  [11, 'Electrical issue', 'HOS', 'Hostel', 'electrical', 'high', 'pending', 12, [-0.00005, 0.00004], 'Sparks seen near the corridor switchboard.'],
  [10, 'Broken fan', 'ACD', 'Class 104', 'mechanical', 'medium', 'resolved', 13, [0.00003, -0.00004], 'Ceiling fan does not rotate.'],
  [9, 'Water leakage', 'LIB', 'Library', 'plumbing', 'low', 'resolved', 15, [0.00005, 0.00002], 'Water dripping from the ceiling near the shelves.'],
  [8, 'Damaged bench', 'CAN', 'Canteen', 'civil', 'low', 'resolved', 17, [-0.00003, 0.00005], 'Bench slats are broken.'],
  [7, 'Flickering lights', 'LIB', '2nd floor', 'electrical', 'high', 'in_progress', 18, [-0.00004, -0.00003], 'Lights flicker constantly in the quiet study area.'],
  [6, 'Wi-Fi dropouts', 'HOS', 'Wing C', 'wifi', 'medium', 'in_progress', 20, [0.00006, -0.00002], 'Connection drops every few minutes during evening hours.'],
  [5, 'Cracked pavement', 'GATE', 'Entrance path', 'civil', 'medium', 'in_progress', 22, [0.00002, 0.00006], 'Large crack is a tripping hazard for pedestrians.'],
  [4, 'Overflowing bin', 'CAN', 'Back entrance', 'sanitation', 'low', 'resolved', 24, [0.00004, -0.00005], 'Waste bin overflowing daily near the cafeteria exit.'],
  [3, 'Projector not working', 'ACD', 'Seminar hall', 'electrical', 'medium', 'resolved', 26, [-0.00002, 0.00004], 'Projector shows no signal during presentations.'],
  [2, 'Lift out of service', 'BLB', 'Lift 1', 'mechanical', 'medium', 'in_progress', 28, [0.00003, 0.00003], 'Lift stuck on ground floor with door sensor alert.'],
  [1, 'Door lock broken', 'HOS', 'Room 210', 'civil', 'low', 'resolved', 30, [-0.00004, 0.00002], 'Door lock jammed from outside.'],
];

export async function seedData() {
  await Promise.all([User, Building, Report, Counter, Notification, ReportNote, AuditLog, KnowledgeArticle].map((m) => m.deleteMany({})));

  const [student, admin, staff] = await User.create([
    {
      name: 'Student User',
      rollNumber: 'CS2026001',
      email: 'student@campusconnect.edu',
      role: 'student',
      passwordHash: await User.hashPassword('Student@123'),
    },
    {
      name: 'Campus Admin',
      email: 'admin@campusconnect.edu',
      role: 'admin',
      passwordHash: await User.hashPassword('Admin@123'),
    },
    {
      name: 'Maintenance Staff',
      email: 'staff@campusconnect.edu',
      role: 'staff',
      passwordHash: await User.hashPassword('Staff@123'),
    },
  ]);

  const buildings = await Building.insertMany(
    BUILDINGS.map(([code, name, dLat, dLng]) => ({
      code,
      name,
      isSample: true,
      location: { type: 'Point', coordinates: [C.lng + dLng, C.lat + dLat] },
    }))
  );
  const byCode = Object.fromEntries(buildings.map((b) => [b.code, b]));

  const day = 24 * 60 * 60 * 1000;
  for (const [n, title, code, room, category, priority, status, daysAgo, [jLat, jLng], description] of REPORTS.sort(
    (a, b) => a[0] - b[0]
  )) {
    const b = byCode[code];
    const created = new Date(Date.now() - daysAgo * day);
    const history = [
      { status: 'pending', note: 'Report submitted', changedBy: student._id, changedAt: created },
    ];
    if (status !== 'pending') {
      history.push({
        status: 'in_progress',
        note: 'Assigned to maintenance team',
        changedBy: admin._id,
        changedAt: new Date(created.getTime() + day),
      });
    }
    if (status === 'resolved') {
      history.push({
        status: 'resolved',
        note: 'Issue fixed and verified',
        changedBy: admin._id,
        changedAt: new Date(created.getTime() + 3 * day),
      });
    }

    const images =
      n === 12
        ? [{ url: '/uploads/leak-sample.jpg', filename: 'leak-sample.jpg' }]
        : [];

    await Report.create({
      reportId: `CP${String(n).padStart(4, '0')}`,
      title,
      description,
      category,
      priority,
      status,
      room,
      building: b._id,
      reporter: student._id,
      assignedTo: status === 'in_progress' ? staff._id : undefined,
      images,
      history,
      isSample: true,
      resolvedAt: status === 'resolved' ? history[history.length - 1].changedAt : undefined,
      location: {
        type: 'Point',
        coordinates: [b.location.coordinates[0] + jLng, b.location.coordinates[1] + jLat],
      },
      createdAt: created,
      updatedAt: history[history.length - 1].changedAt,
    });
  }

  await Counter.create({ _id: 'report', seq: REPORTS.length });

  // Add initial welcome notification
  const cp12 = await Report.findOne({ reportId: 'CP0012' });
  if (cp12) {
    await Notification.create({
      user: student._id,
      report: cp12._id,
      message: 'CP0012 "Leaking tap" is now in progress',
      createdAt: new Date(),
    });

    // Add internal notes on CP0012
    await ReportNote.create([
      {
        report: cp12._id,
        author: staff._id,
        text: 'Inspected washroom tap. Replacement valve ordered from supplier.',
        createdAt: new Date(Date.now() - 5 * day),
      },
      {
        report: cp12._id,
        author: admin._id,
        text: 'Supplier confirmed delivery for tomorrow morning.',
        createdAt: new Date(Date.now() - 2 * day),
      },
    ]);
  }

  // Seed starter knowledge base articles
  await KnowledgeArticle.insertMany([
    {
      title: 'How to report a problem',
      category: 'reporting',
      published: true,
      tags: ['report', 'complaint', 'submit', 'steps'],
      body: 'To report an issue on CampusConnect:\n1. Click "Report Issue" or ask the assistant.\n2. Choose a category, building and room.\n3. Add an accurate title and description.\n4. Optionally upload up to 5 photos.\n5. Confirm and submit the report to track its progress.',
      updatedBy: admin._id,
    },
    {
      title: 'What the statuses and priorities mean',
      category: 'reporting',
      published: true,
      tags: ['status', 'priority', 'meaning', 'lifecycle'],
      body: 'Statuses:\n- Pending: Newly registered complaint awaiting team review.\n- In Progress: Assigned to campus technicians and actively under repair.\n- Resolved: Work completed and verified.\n- Cancelled: Cancelled by the reporter prior to repair.\n\nPriorities:\n- Low: Minor issues without operational hindrance.\n- Medium: Normal maintenance.\n- High: Significantly affects comfort or academics.\n- Critical: Safety or infrastructure hazard.',
      updatedBy: admin._id,
    },
    {
      title: 'Expected fix times: <FILL IN>',
      category: 'general',
      published: false,
      tags: ['turnaround', 'sla', 'fix times'],
      body: 'Standard resolution turnaround by priority: <FILL IN>',
      updatedBy: admin._id,
    },
    {
      title: 'Hostel rules and timings: <FILL IN>',
      category: 'hostel',
      published: false,
      tags: ['hostel', 'curfew', 'visitors'],
      body: 'Hostel entry gates close at: <FILL IN>\nVisitor regulations: <FILL IN>',
      updatedBy: admin._id,
    },
    {
      title: 'Canteen timings: <FILL IN>',
      category: 'canteen',
      published: false,
      tags: ['canteen', 'food', 'meals'],
      body: 'Breakfast: <FILL IN>\nLunch: <FILL IN>\nDinner: <FILL IN>',
      updatedBy: admin._id,
    },
    {
      title: 'Wi-Fi help (network name, portal, who to contact): <FILL IN>',
      category: 'wifi',
      published: false,
      tags: ['wifi', 'internet', 'portal'],
      body: 'Network SSID: <FILL IN>\nLogin instructions: <FILL IN>\nIT Support desk: <FILL IN>',
      updatedBy: admin._id,
    },
    {
      title: 'Campus contacts (maintenance office, hostel warden, IT help desk): <FILL IN>',
      category: 'contacts',
      published: false,
      tags: ['contacts', 'phone', 'warden', 'it'],
      body: 'Maintenance: <FILL IN>\nHostel Warden: <FILL IN>\nIT Helpline: <FILL IN>',
      updatedBy: admin._id,
    },
    {
      title: 'Emergency contacts and what counts as an emergency: <FILL IN>',
      category: 'emergency',
      published: false,
      tags: ['emergency', 'security', 'fire', 'medical'],
      body: 'Campus 24/7 Security Hotline: <FILL IN>\nWhat counts as an emergency: Fire, exposed electric sparks, severe water flooding, structural damage, or physical injury.',
      updatedBy: admin._id,
    },
  ]);

  console.log('Database seeded: 3 users, 7 buildings, 12 sample reports, 2 notes, 8 knowledge articles, 1 counter, 1 notification');

}

export async function seedIfEmpty() {
  const count = await Report.countDocuments();
  if (count === 0) {
    console.log('Database is empty, auto-seeding sample data...');
    await seedData();
  }
}

// Standalone execution
if (process.argv[1]?.endsWith('seed.js')) {
  const { disconnectDB } = await import('../config/db.js');
  await connectDB();
  await seedData();
  await disconnectDB();
  console.log('Seed completed successfully.');
  process.exit(0);
}
