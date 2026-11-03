# IEM Admission Management System (MEAN Stack)

> **Academic Software Engineering Lab Project**  
> **Institute:** Institute of Engineering & Management (IEM), Kolkata  
> *Note: This is an academic prototype for demonstration and laboratory evaluation purposes.*

---

## 🚀 Overview

The **IEM Admission Management System** is a full-stack web application designed to digitize the undergraduate and postgraduate admission workflows. It features distinct role-based portals for **Student Applicants** and **Administrators**, powered by a RESTful Express API and MongoDB database with reactive Angular frontend components.

---

## 🛠️ Technology Stack

| Layer | Technology | Role |
|---|---|---|
| **Frontend** | Angular 17, TypeScript, Bootstrap 5 | Single Page Application (SPA), Reactive Forms, Guards, Interceptors |
| **Backend** | Node.js, Express.js | REST API, Routing, Error handling, Security middleware |
| **Database** | MongoDB (Local / Atlas) | Document store for users, applications, documents, and notifications |
| **ODM** | Mongoose | Data modeling, Schema validation, Population, Aggregation pipelines |
| **Authentication** | JSON Web Tokens (JWT) + bcrypt | Stateless authentication & salted password hashing |
| **File Handling** | Multer | Multipart/form-data storage with UUID names and MIME whitelisting |

---

## 📂 Project Architecture & Folder Structure

```
e:\SWE/
├── iem-ams-backend/                # Node.js + Express REST API
│   ├── scripts/
│   │   └── seedAdmin.js            # Initial admin seeder script
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js               # Mongoose MongoDB connection
│   │   │   └── multer.js           # Secure file upload storage & filters
│   │   ├── controllers/
│   │   │   ├── admin.controller.js # Admin review, metrics, and dossier API
│   │   │   ├── application.controller.js # Student application lifecycle
│   │   │   ├── auth.controller.js  # Registration, login, and JWT signing
│   │   │   ├── document.controller.js # Upload, list, download, delete files
│   │   │   └── notification.controller.js # Student alert feeds
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js  # JWT validation & user attachment
│   │   │   └── role.middleware.js  # Role guard ('admin' vs 'student')
│   │   ├── models/
│   │   │   ├── Application.model.js# Admission application schema
│   │   │   ├── Document.model.js   # Verification document schema
│   │   │   ├── Notification.model.js # Alerts schema
│   │   │   └── User.model.js       # User credentials & role schema
│   │   ├── routes/
│   │   │   ├── admin.routes.js
│   │   │   ├── application.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── document.routes.js
│   │   │   └── notification.routes.js
│   │   ├── utils/
│   │   │   ├── jwt.utils.js        # Token signing & verification helpers
│   │   │   └── response.utils.js   # Standardized JSON response envelope
│   │   └── app.js                  # Express middleware stack & route mounting
│   ├── uploads/                    # Physical upload destination (git-ignored)
│   ├── .env                        # Environment configurations & secrets
│   └── server.js                   # Server entry point
│
└── iem-ams-frontend/               # Angular 17 Client Application
    ├── proxy.conf.json             # Dev-server proxy (/api -> localhost:5000)
    └── src/
        ├── app/
        │   ├── core/
        │   │   ├── guards/         # authGuard & roleGuard
        │   │   ├── interceptors/   # jwtInterceptor (Authorization Bearer)
        │   │   └── services/       # auth, application, document, admin, notification
        │   ├── features/
        │   │   ├── admin/          # Dashboard, Applications List, Dossier Evaluation
        │   │   ├── auth/           # Login & Registration components
        │   │   └── student/        # Dashboard, Apply Form, Document Uploader
        │   └── shared/
        │       ├── components/     # Navbar, Footer, StatusBadge
        │       └── models/         # TypeScript interfaces matching backend models
        └── environments/           # API baseUrl configurations
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+ or v24)
- **MongoDB** running locally on port 27017 or a MongoDB Atlas cloud URI

### 2. Configure Environment Variables
Inside `e:\SWE\iem-ams-backend\.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/iem_ams
JWT_SECRET=iem_ams_dev_secret_change_before_production_abc123xyz
JWT_EXPIRES_IN=2h
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=5
CLIENT_ORIGIN=http://localhost:4200
ADMIN_EMAIL=admin@iem.edu.in
ADMIN_PASSWORD=SecureAdminPass@123
ADMIN_NAME=IEM Administrator
```

### 3. Start Backend API
```powershell
cd e:\SWE\iem-ams-backend
npm run seed:admin   # Seeds the initial administrator
npm run dev          # Starts Express on http://localhost:5000
```

### 4. Start Angular Frontend
In a second terminal:
```powershell
cd e:\SWE\iem-ams-frontend
npm start            # Starts Angular dev-server on http://localhost:4200
```

---

## 🔐 Credentials for Evaluation

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@iem.edu.in` | `SecureAdminPass@123` |
| **Demo Student** | Any registered student | (Set during registration) |

*(Note: The login page at `http://localhost:4200/login` also includes **Demo Auto-fill** buttons to simplify testing during presentations!)*

---

## 🔄 User Workflows

### 🎓 Student / Applicant Flow
1. **Register & Login:** Register at `/register`. Auto-logs in and directs to `/student/dashboard`.
2. **Fill Admission Form:** Select program (`B.Tech`, `MBA`, `MCA`, `M.Tech`, `BBA`), personal info, and academic history. Click **Save Draft** anytime or **Fill Demo Info** for testing.
3. **Upload Documents:** Navigate to **Documents**, attach marksheets or ID proof (PDF, JPG, PNG). Download or delete as needed.
4. **Submit Application:** Finalize the application form. Status transitions to `📨 Submitted` and inputs lock to prevent modification.
5. **Receive Updates:** As reviewers inspect the file, check the notification bell 🔔 and reviewer feedback alert box in real time.

### 🛡️ Administrator Flow
1. **Login:** Sign in at `/login` with admin credentials.
2. **Dashboard Analytics:** View real-time metric cards (Total, Submitted Queue, Under Review, Admitted) and course distribution counts.
3. **Review Applications Queue:** Filter by course, status, or search candidate name/email.
4. **Inspect Dossier:** Open an applicant's file to view academic marks, addresses, and download attached verification marksheets.
5. **Issue Decision:** Change status to `Under Review`, `Accepted`, or `Rejected` and provide official feedback notes. The applicant is automatically notified.

