import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Building from '../models/Building.js';
import Report from '../models/Report.js';
import Counter from '../models/Counter.js';
import Notification from '../models/Notification.js';

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
  await Promise.all([User, Building, Report, Counter, Notification].map((m) => m.deleteMany({})));

  const [student, admin] = await User.create([
    {
      name: 'User 123',
      rollNumber: 'CS2025001',
      email: 'user123@example.edu',
      role: 'student',
      passwordHash: await User.hashPassword('Password@123'),
    },
    {
      name: 'Campus Admin',
      email: 'admin@example.edu',
      role: 'admin',
      passwordHash: await User.hashPassword('Admin@12345'),
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
  await Notification.create({
    user: student._id,
    report: (await Report.findOne({ reportId: 'CP0012' }))._id,
    message: 'CP0012 "Leaking tap" is now in progress',
    createdAt: new Date(),
  });

  console.log('Database seeded: 2 users, 7 buildings, 12 sample reports, 1 counter, 1 notification');
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
