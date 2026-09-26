# 🚢 Vessel Tracker Web App - Rohit Kujur

This project implements a maritime tracking platform inspired by systems like MarineTraffic. Built with `React`, `Vite`, `Express`, and `PostgreSQL`, it displays vessel positions on an interactive map, provides detailed vessel information, and supports filtering by vessel type. It uses `Drizzle ORM` for database management, `Zod` for data validation, and `Leaflet` for mapping, with sample data fallback when no AISstream.io key is provided. 🌍

---

## 📆 Features

- 🗺️ **Interactive Map**: Displays vessel locations using `Leaflet` (User Story 1).
- ℹ️ **Vessel Details**: Shows IMO, name, speed, and ETA on marker click (User Story 2).
- 🔍 **Filtering**: Filters vessels by type (e.g., tanker, cargo) (User Story 3).
- ⚙️ **Backend API**: `Express` serves endpoints like `/api/vessels` for data retrieval.
- 🗄️ **Database**: `PostgreSQL` with `Drizzle ORM` stores vessel, trail, geofence, and alert data.
- 📊 **Sample Data**: Uses mock data for testing without an AISstream.io key.

---

## ✅ Prerequisites

- `Node.js`: `v18` or higher
- `PostgreSQL`: `17.5` recommended
- `npm`: `v10` or higher

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/VesselTracker-Rohit-Kujur.git
cd VesselTracker-Rohit-Kujur

2. Install Dependencies
npm install

3. Set Up PostgreSQL

Install PostgreSQL 17.5 from:https://www.postgresql.org/download/windows/


Add PostgreSQL to your system PATH:$env:Path += ";C:\Program Files\PostgreSQL\17\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path, [System.EnvironmentVariableTarget]::User)


Verify PostgreSQL installation:psql --version


Start the PostgreSQL service (run PowerShell as Administrator):net start postgresql-x64-17


Create the database:psql -U postgres

CREATE DATABASE vessel_tracking;
\q



4. Configure Environment

Create a .env file in the project root:DATABASE_URL=postgresql://postgres:<your-password>@localhost:5432/vessel_tracking
PORT=5000


Replace <your-password> with your PostgreSQL password.
Optionally add:VITE_AISSTREAM_API_KEY=<your-key>



5. Apply Database Schema

Run:npm run db:push


This uses Drizzle ORM to create tables (vessels, vessel_trail, geofences, alerts).
Verify tables:psql -U postgres -d vessel_tracking

\dt
\q



6. Start the Application

Start the development server:npm run dev


Access the app at:http://localhost:5000


Test the API:curl http://localhost:5000/api/vessels




🧪 Demo Workflow
🔹 Verify Database
psql -U postgres -d vessel_tracking

SELECT * FROM vessels;
\q

Expected output: List of vessels (if populated) or empty table.
🔹 Access Map Interface
Open in browser:
http://localhost:5000

Displays:

Interactive map with vessel markers
Vessel details on marker click
Filter options for vessel types

🔹 Test API Endpoint
curl http://localhost:5000/api/vessels

Expected output:
[
  {"imo": "123", "name": "Ship A", "latitude": 51.505, "longitude": -0.09, "speed": 10, "eta": "2025-07-18T12:00:00Z"},
  ...
]


📂 Project Structure
VesselTracker-Rohit-Kujur/
├── client/                # React frontend
│   ├── index.html         # HTML entry point
│   ├── src/               # React components
│   │   ├── main.tsx       # App entry point
│   │   ├── App.tsx        # Main component with Leaflet map
├── server/                # Express backend
│   ├── index.ts           # API server
├── shared/                # Shared schema
│   ├── schema.ts          # Drizzle ORM schema
├── migrations/            # Database migrations
├── .env                   # Environment variables
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
└── README.md


🧰 Technologies Used

Frontend: React, Vite, Leaflet
Backend: Express, TypeScript, tsx
Database: PostgreSQL, Drizzle ORM, Zod
Utilities: cross-env


🛠 Troubleshooting
🚧 No Vessels on Map?

Verify API endpoint:curl http://localhost:5000/api/vessels


Check Vite logs:npm run dev



❌ Database Not Connecting?

Ensure PostgreSQL is running:Get-Service postgresql-x64-17


Verify DATABASE_URL in .env.
Check schema application:npm run db:push



💣 Permission Errors?

Run PowerShell as Administrator for service commands:net start postgresql-x64-17



🧹 Vite Issues?

If main.tsx fails to load, verify client/src/main.tsx and client/index.html. Test Vite independently:npx vite


Check logs for errors:dir C:\Users\<your-username>\AppData\Local\npm-cache\_logs




🙌 Final Notes

Replace <your-username> with your GitHub username in the clone URL.
Ensure PostgreSQL is running before starting the app.
GitHub repo:https://github.com/<your-username>/VesselTracker-Rohit-Kujur


For AISstream.io integration, install:npm install ws




