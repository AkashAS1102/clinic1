# 🏥 Hospital Management System — Frontend

A modern, responsive frontend for a Clinic/Hospital Management System built with **React 18 + Vite**.

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18.2.0 | UI Framework |
| Vite | 5.1.4 | Build Tool & Dev Server |
| React Router DOM | 6.22.0 | Client-side Routing |
| Axios | 1.18.1 | HTTP API Requests |
| Lucide React | 0.344.0 | Icons |
| CSS Modules | — | Component Styling |

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── api/                    # Axios API service calls
│   ├── components/             # Reusable UI components
│   ├── context/                # React Context (global state)
│   ├── pages/
│   │   ├── Appointments/       # Appointment booking & listing
│   │   ├── Consultation/       # Doctor consultations
│   │   ├── DoctorView/         # Doctor-specific dashboard
│   │   ├── Doctors/            # Doctor management
│   │   ├── HR/                 # HR & payroll management
│   │   ├── Login/              # Authentication page
│   │   ├── Manager/            # Manager dashboard
│   │   ├── NurseStation/       # Nurse queue & station
│   │   ├── Nurses/             # Nurse management
│   │   ├── Patients/           # Patient records
│   │   ├── Pharmacy/           # Inventory & billing
│   │   ├── Registration/       # Patient registration
│   │   ├── Rooms/              # Room allocation
│   │   ├── Settings/           # App settings
│   │   └── Staffs/             # Staff management
│   ├── App.jsx                 # Root component & routes
│   ├── main.jsx                # App entry point
│   ├── index.css               # Global styles
│   └── mockData.js             # Local mock data for dev/testing
├── index.html                  # HTML entry point
├── vite.config.js              # Vite configuration
└── package.json                # Dependencies & scripts
```

---

## 📦 Pages / Modules

| Page | Route | Description |
|---|---|---|
| 🔐 Login | `/login` | User authentication |
| 📋 Registration | `/registration` | New patient registration |
| 👤 Patients | `/patients` | View & manage patients |
| 🩺 Doctors | `/doctors` | Doctor profiles |
| 🩺 Doctor View | `/doctor-view` | Doctor's personal dashboard |
| 📅 Appointments | `/appointments` | Book & manage appointments |
| 💬 Consultation | `/consultation` | Consultation records |
| 👩‍⚕️ Nurses | `/nurses` | Nurse management |
| 🚶 Nurse Station | `/nurse-station` | Patient queue |
| 🛏️ Rooms | `/rooms` | Room allocation |
| 👔 Staffs | `/staffs` | Staff management |
| 👔 HR | `/hr` | HR & payroll |
| 💊 Pharmacy | `/pharmacy` | Medicines & billing |
| 📊 Manager | `/manager` | Manager overview |
| ⚙️ Settings | `/settings` | App configuration |

---

## ⚙️ Prerequisites

- ✅ **Node.js** v18 or higher — [Download](https://nodejs.org/)
- ✅ **npm** v9 or higher (comes with Node.js)
- ✅ Backend server running at `http://localhost:8080`

Verify installation:
```bash
node -v
npm -v
```

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Amihive/Hospital_management-_frontend.git
cd Hospital_management-_frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
```

### 4. Open in browser
```
http://localhost:5173
```

> ⚠️ Make sure the **backend** is running at `http://localhost:8080` before starting the frontend.

---

## 🔗 Backend Repository

The backend API is maintained separately:

👉 [Hospital_management-_backend](https://github.com/AmIhive/Hospital_management-_backend)

- **Base URL:** `http://localhost:8080/api`
- **Tech:** Java 17 + Spring Boot 3 + SQLite

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (hot reload) |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview the production build locally |

---

## 🌐 API Configuration

API base URL is configured in `src/api/`. To change the backend URL, update the base URL in the API files:

```js
// src/api/
const API_BASE = 'http://localhost:8080/api';
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a **Pull Request**

---

## 📄 License

This project is for educational/internal use. All rights reserved.

---

## 👨‍💻 Author

**AmIhive** — [GitHub Profile](https://github.com/Amihive)
