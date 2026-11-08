# College ID Management & Verification System

A web-based student ID management system built for Vignan University. It allows administrators to issue official PVC-style student ID cards with dynamic QR codes and provides an instant verification portal with 2FA email OTP to verify student authenticity on the spot.

🔗 **Live Permanent Link:** [https://college-id-management.onrender.com](https://college-id-management.onrender.com)  
🔍 **Verification Portal:** [https://college-id-management.onrender.com/verify](https://college-id-management.onrender.com/verify)

---

## About the Project

Physical college ID cards often lack an easy way to verify authenticity on the spot. This project solves that by generating digital and printable ID cards where each card has a unique QR code. When scanned by any smartphone camera (works across any mobile data network, Wi-Fi, etc.), it opens an official verification page where identity can be confirmed using a one-time passcode (OTP).

### Key Features:
- **Card Generation:** Generates printable student ID cards following Vignan University's standard layout (student photo, registration number, branch, section, and academic year).
- **QR Code Verification:** Each card has a unique token embedded in a QR code. Scanning it opens the student's verification page directly without needing local network setup.
- **Two-Factor Authentication (2FA):** To prevent unauthorized access to student details, verification requires entering a 6-digit OTP sent to the registered student email.
- **Admin Dashboard:** Lets authorized staff search, add, edit, and manage student records, view total counts per department, and download or print ID cards.

---

## Tech Stack

- **Frontend:** React (Vite), CSS3
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **Deployment & Cloud Hosting:** Render (24/7 Cloud Architecture)

---

## Project Structure

```
College-ID-Management/
├── frontend/          # React client application
│   ├── src/
│   │   ├── App.jsx    # Main dashboard & ID card component
│   │   └── App.css    # Styling and responsive layout
│   └── public/        # University logos and card template assets
├── backend/           # Express server & API endpoints
│   ├── models/        # Database schemas (Students, Admins, OTPs)
│   ├── routes/        # API route handlers
│   └── server.js      # Server entry point
└── package.json
```

---

## Running Locally

### 1. Clone the repo
```bash
git clone https://github.com/rahul-b78vu/college-id-management.git
cd college-id-management
```

### 2. Set up the backend
Create a `.env` file in the `backend/` folder:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

### 3. Install and run
You can install dependencies and run both servers from the root:
```bash
# Install dependencies
npm run build

# Start the application
npm start
```

Or run them in separate terminals:
```bash
# Terminal 1 - Backend
cd backend
npm install
node server.js

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:5173` and the backend at `http://localhost:5000`.

---

## Collaborators & Access

To add collaborators to this repository:
1. Go to **Settings** > **Collaborators** on GitHub.
2. Click **Add people** and enter their GitHub username or email.
3. Choose the appropriate permission (Read, Write, or Admin).

---

## Author
Developed by **Rahul** — Vignan University
