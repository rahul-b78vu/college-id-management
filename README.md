# 🎓 College ID Management & Verification System

[![Live Portal](https://img.shields.io/badge/Live%20Portal-Online%20(Edge%204G%2F5G)-00c853?style=for-the-badge&logo=cloudflare&logoColor=white)](https://outreach-random-concrete-cats.trycloudflare.com)
[![Deployment](https://img.shields.io/github/deployments/rahul-b78vu/college-id-management/Production?label=Production%20Deployment&style=for-the-badge&logo=github)](https://github.com/rahul-b78vu/college-id-management/deployments)
[![Cloud Host](https://img.shields.io/badge/24%2F7%20Cloud-Render%20Ready-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://dashboard.render.com)

> 🌐 **Live Public URL (Accessible on any mobile 4G/5G network worldwide):**  
> 👉 **[https://outreach-random-concrete-cats.trycloudflare.com](https://outreach-random-concrete-cats.trycloudflare.com)**
>
> 🔍 **Instant Verification Endpoint:**  
> 👉 **[https://outreach-random-concrete-cats.trycloudflare.com/verify](https://outreach-random-concrete-cats.trycloudflare.com/verify)**

---

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Cloudflare](https://img.shields.io/badge/Edge%20Tunnel-Cloudflare-F38020?logo=cloudflare&logoColor=white)](https://www.cloudflare.com/)
[![Security](https://img.shields.io/badge/Auth-2FA%20OTP%20%2B%20JWT-0052CC?logo=auth0&logoColor=white)](#security--2fa-verification)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Official Student Administration & Digital ID Verification Portal**  
> Designed for **Vignan's Foundation for Science, Technology & Research (Deemed to be University)**.

---

## 🌟 Key Features

### 🪪 1. Official PVC Student ID Card Generator
- **Exact University Format:** Matches official PVC smart card specifications (3.370" × 2.125" / CR80 standard).
- **High-Resolution Branding:** University banner, student photo, registration number, course, department, section, and academic validity.
- **Dynamic QR Code:** Every card contains an encrypted verification token linked to the student record.
- **One-Click Download / Print:** Download high-resolution PNG/PDF format ready for physical PVC printing.

### 🔐 2. Two-Factor Authentication (2FA) & Verification
- **Dual Verification:** Prevents unauthorized identity checks with timed 6-digit OTP verification sent to registered student emails.
- **Anti-Tamper Token System:** QR codes contain opaque cryptographically secure tokens rather than raw student details.
- **Official Verification Stamp:** Displays an authenticated verification certificate badge upon successful OTP validation.

### 📱 3. Universal Mobile QR Scanning (All Networks)
- **Zero Localhost Restrictions:** Scans seamlessly across **any mobile network** (Jio, Airtel, Vi, 4G, 5G, or public Wi-Fi).
- **Edge Routing:** Integrated with Cloudflare edge tunnels and production cloud proxies for low latency anywhere in the world.

### 🛡️ 4. Role-Based Admin Management Portal
- **Glassmorphic 3D Interface:** Modern dark-mode navigation suite with animated glowing cards and live status indicators.
- **Real-Time Analytics:** Live telemetry tracking Total Enrolled Students, Active Academic Departments, and 2FA Verification Rates.
- **Full Student CRUD:** Add, update, batch search, filter by department/year, and revoke student cards with instant audit logging.

---

## 👥 Giving Access to Collaborators on GitHub

If you want to grant teammates, professors, or evaluators access to this GitHub repository:

1. Go to your repository: **[https://github.com/rahul-b78vu/college-id-management](https://github.com/rahul-b78vu/college-id-management)**
2. Click **Settings** (top navigation tab).
3. In the left sidebar, click **Collaborators** under *Access*.
4. Click the green button **"Add people"**.
5. Enter their **GitHub username, full name, or email address**.
6. Select their access role:
   - **Read:** Can view, clone, and test the project.
   - **Triage:** Can manage issues and pull requests.
   - **Write:** Can push code and update features directly.
   - **Admin:** Full access to settings, secrets, and collaboration.
7. Click **"Add to this repository"** — an invitation email will be sent automatically.

---

## 🛠️ Architecture & Tech Stack

```
College-ID-Management/
├── frontend/                  # React 18 + Vite SPA
│   ├── src/
│   │   ├── App.jsx            # Main portal & PVC Card renderer
│   │   ├── App.css            # 3D Glassmorphic styles & animations
│   │   └── main.jsx           # React DOM root
│   ├── public/                # Logos, badges, and university assets
│   └── vite.config.js         # API proxy & Cloudflare edge host rules
├── backend/                   # Node.js + Express API
│   ├── models/                # MongoDB Mongoose schemas (Student, Admin, OTP)
│   ├── routes/                # REST endpoints (/api/students, /api/auth, /api/verify)
│   ├── server.js              # Express app with JWT & CORS security
│   └── .env                   # Database URI & environment variables
├── render.yaml                # 1-Click Cloud Deployment Blueprint
└── package.json               # Unified build & startup orchestration
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (or local MongoDB)

### 1. Clone the Repository
```bash
git clone https://github.com/rahul-b78vu/college-id-management.git
cd college-id-management
```

### 2. Configure Environment Variables
Create a file named `.env` inside the `backend/` folder:
```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret_key
```

### 3. Install Dependencies & Run
From the root project directory:
```bash
# Install all dependencies (frontend & backend)
npm run build

# Start both backend and frontend concurrently
npm start
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## ☁️ Permanent 24/7 Cloud Deployment

This project is configured with a unified entrypoint (`server.js`) and [`render.yaml`](render.yaml) for 1-click cloud hosting on [Render](https://render.com) or [Vercel](https://vercel.com):

1. Go to [dashboard.render.com](https://dashboard.render.com) and click **New + Web Service**.
2. Connect your repo: **`rahul-b78vu/college-id-management`**.
3. Set Environment Variable: `MONGO_URI` = *(your MongoDB Atlas URI)*.
4. Click **Deploy Web Service** — your app is live 24/7/365 with permanent SSL.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE) — created for academic administration and student verification.

