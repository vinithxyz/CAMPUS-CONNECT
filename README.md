# CampusConnect 🎓📍

**Campus Problem Reporting & Heat Map System**

A full-stack MERN application built with **MongoDB, Express.js, React (Vite, TypeScript), and Node.js**, featuring interactive OpenStreetMap campus mapping, problem density heat maps, and a multi-step complaint reporting workflow matching the design specifications in `CampusConnect_Frontend_Pages_User123.pdf` and `CAMPUS_CONNECT_GUIDE.md`.

---

## 🌟 Features

- **Landing Page (PDF Page 1)**:
  - Responsive hero section with high-res campus architectural imagery.
  - Floating feature highlights: *Report Problems*, *Track Progress*, and *See Heat Map*.
  - Smooth navigation with quick access to reporting and campus map.

- **Authentication (PDF Pages 2 & 3)**:
  - Split 50/50 authentication layout with campus imagery and dark navy branding (`#0b2545`).
  - Login by Email or Roll Number with password visibility toggle and "Remember me".
  - Student registration with Roll Number / Student ID validation and password security hints.
  - Secure HTTP-only JWT cookies with bcrypt password hashing (cost factor 12).

- **Student Dashboard (PDF Page 4)**:
  - Dynamic greeting personalized for the logged-in student.
  - **4 Stat Cards**: *Total Complaints (12)*, *In Progress (5)*, *Resolved (6)*, and *High Priority (2)* computed in real-time from MongoDB aggregations.
  - **Recent Complaints Table**: Clickable rows routing directly to complaint details.
  - **Issue Categories Doughnut Chart**: Interactive chart with category distribution percentages and legend.
  - **Quick Actions**: Instant access to report new issues or open the campus map.

- **Report an Issue Wizard (PDF Page 5)**:
  - 3-step progress stepper: *1. Issue Details*, *2. Location*, *3. Review*.
  - Categorization (Electrical, Plumbing, Mechanical, Civil, Sanitation, Wi-Fi, Hostel, Canteen, Safety, Other).
  - Drag-and-drop photo uploader supporting up to 5 JPG/PNG images (2MB limit).
  - Building selection and interactive OpenStreetMap pin picker with automatic campus coordinate centering.
  - Atomic incremental sequence generation (`CP0001`, `CP0002`, ...).

- **Campus Map & Heat Map (PDF Page 6)**:
  - Interactive Leaflet campus map with permanent building labels.
  - **Heat Map View**: Smooth density visualization (`leaflet.heat`) colored by problem intensity (green = low, amber = medium, red = high).
  - **Markers View**: Interactive pins with informative popups showing priority, status, category, and building.
  - **Category Filters**: Multi-select checkboxes to isolate specific maintenance problem types.

- **My Complaints & History Timeline (PDF Page 7)**:
  - Status filter tabs (*All*, *Pending*, *In Progress*, *Resolved*), search box, and date sorting.
  - Split view with complaints list and right-hand detail pane with full photo preview.
  - **View Updates**: Status timeline modal displaying history logs (who changed status, maintenance note, and timestamp).

- **Staff & Admin Management**:
  - Dedicated admin portal (`/admin/reports`) allowing campus staff to review reports and update statuses with maintenance notes.
  - Automated in-app notifications generated for students upon status changes.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### 1. Backend Setup

```bash
cd server
npm install
npm run seed      # Seeds demo users, campus buildings, and sample complaints
npm run dev       # Starts API server on http://localhost:5000
```

> **Note on MongoDB**: If a local MongoDB instance is running at `mongodb://127.0.0.1:27017/campusconnect`, the server connects to it automatically. If not found, it seamlessly starts an embedded in-memory database (`mongodb-memory-server`) with zero manual setup required.

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev       # Starts Vite dev server on http://localhost:5173
```

---

## 🔑 Demo Credentials

| Role | Email / Identifier | Password | Access |
| :--- | :--- | :--- | :--- |
| **Student** | `student@campusconnect.edu` or `CS2026001` | `Student@123` | Report issues, view own complaints, see map & notifications |
| **Maintenance Staff** | `staff@campusconnect.edu` | `Staff@123` | View assigned reports, update status with notes, internal logs |
| **Admin** | `admin@campusconnect.edu` | `Admin@123` | Full administrative control: reports, assign staff, users, buildings, audit logs |

---

## 📁 Repository Structure

```
campusconnect/
├── client/                           # React + Vite + TypeScript Frontend
│   ├── public/images/                # campus-hero.jpg, leak-sample.jpg
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                   # Badges, StatCards, Modals, Steppers
│   │   │   ├── layout/               # Navbar, Sidebar, Header, Notifications
│   │   │   ├── dashboard/            # Doughnut chart, Recent complaints, Quick actions
│   │   │   ├── map/                  # CampusMap, HeatLayer, LocationPicker
│   │   │   └── reports/              # DetailPanel, Timeline, ImageUploader
│   │   ├── pages/                    # Landing, Login, Register, Dashboard, Map, etc.
│   │   ├── context/                  # AuthContext, ToastContext
│   │   ├── services/                 # Axios API service layer
│   │   └── types/                    # TypeScript interfaces
│   └── vite.config.ts
├── server/                           # Node.js + Express + Mongoose Backend
│   ├── src/
│   │   ├── config/                   # env, db connection with embedded fallback
│   │   ├── models/                   # User, Report, Building, Counter, Notification
│   │   ├── controllers/              # Auth, Reports, Map, Admin, Buildings
│   │   ├── middleware/               # Auth guards, Multer uploads, Error handling
│   │   ├── seed/                     # Seed script with realistic coordinates & demo reports
│   │   └── server.js
│   └── uploads/                      # Uploaded complaint photos
└── README.md
```
