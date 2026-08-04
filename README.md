<div align="center">

<h1>🏥 Aarogya Hospital Management System</h1>

<p>
  <strong>A comprehensive, full-stack Hospital & Clinic Management System designed to streamline patient registration, medical consultations, nursing queues, pharmacy inventory, and hospital administration.</strong>
</p>

<p>
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Backend-Java%20%2B%20Spring%20Boot-ED8B00?style=for-the-badge&logo=java&logoColor=white" alt="Java" />
  <img src="https://img.shields.io/badge/Database-SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
</p>

</div>

<br />

## 📑 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Getting Started](#-getting-started)
  - [1. Starting the Backend](#1-starting-the-backend)
  - [2. Starting the Frontend](#2-starting-the-frontend)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)

---

## 🚀 Overview

Built with scalability, ease of use, and local deployment in mind, Aarogya provides a robust reactive UI and a reliable SQLite database. 

It uniquely features a **decoupled client-server architecture** with a Java/Spring Boot backend implementation running on the same database. Additionally, it ships with a **Reactive Demo Engine** that provides full frontend interactivity even when the backend is offline.

---

## 🌟 Key Features

### 🧑‍⚕️ Clinical Management
| Module | Description |
|--------|-------------|
| **Registration** | Complete onboarding with demographic details, emergency contacts, and insurance data. |
| **Nurse Station** | Real-time Live Queue triage hub for recording patient vitals (BP, Pulse, SpO2, BMI). |
| **Consultations** | Doctor's dashboard for detailed medical records, chief complaints, and e-prescriptions. |
| **Appointments** | Conflict-free scheduling, tracking, and management of future and daily doctor visits. |

### 💊 Pharmacy & Billing
| Module | Description |
|--------|-------------|
| **Inventory** | Track medication stock levels, pricing, category classifications, and auto-deductions. |
| **Prescriptions** | Direct pipeline that fetches doctor's prescribed medicines into the pharmacy queue. |
| **Billing** | Instant hospital invoice generation with integrated GST and taxation features. |

### 🏢 Hospital Administration
| Module | Description |
|--------|-------------|
| **Staff & HR** | Manage employee roles, licensing, shifts, working hours, and generate monthly payroll. |
| **Rooms** | Visualize hospital layout, manage ward capacities, and oversee bed assignments. |
| **Dashboard** | High-level bird's-eye view of clinic revenue, footfall, and performance metrics. |

---

## 🏗️ Architecture & Tech Stack

### Frontend (`/frontend`)
- **Framework:** React 18 (Vite)
- **Routing & State:** React Router DOM v6, React Context API
- **Styling:** CSS Modules
- **Icons:** Lucide-React

### Backend (`/backend`)
The backend handles all data persistence and business logic, running a Java/Spring Boot application using an SQLite database (`clinic.db`) and exposing REST API endpoints on port `8080`.

- **Language:** Java 17+
- **Framework:** Spring Boot 3
- **Data Access:** Spring Data JPA / Hibernate

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Java 17+ (If using the Spring Boot backend)

### 1. Starting the Backend
The backend handles all data persistence. Upon running for the first time, it will automatically generate the `clinic.db` SQLite file.

**To run the Java (Spring Boot) Backend:**
```bash
cd backend
.\start.bat     # (Or use start.ps1 if on PowerShell)
```
> **Note:** The backend server will listen at `http://localhost:8080`.

### 2. Starting the Frontend
Open a **new** terminal window to launch the React frontend.
```bash
cd frontend
npm install
npm run dev
```
> **Note:** Vite will start the dev server, typically at `http://localhost:5173`. Open this URL in any modern web browser.

---

## 🗄️ Database Schema

The backend uses a robust SQLite relational database structure. Major tables include:
- `patients`: Demographics, insurance, and allergies.
- `doctors` & `nurses`: Staff profiles, available days, and shifts.
- `appointments`: Patient-to-Doctor scheduling links.
- `nurse_queue`: Live triage pipeline holding vitals (bp, pulse, bmi, spo2).
- `consultations`: Medical history records (diagnoses, medicines, advice).
- *(Plus extensive tables for Pharmacy Inventory, Staffs, HR Payroll, and Rooms)*

---

## 🔌 API Reference
The backend exposes RESTful APIs all prefixed with `/api`. Common endpoints include:
- `GET /api/health` - Server heartbeat
- `GET /api/patients` - Patient CRUD operations
- `GET /api/doctors` - Doctor schedules and profiles
- `GET /api/appointments` - Scheduling and conflict checks
- `GET /api/nurse-queue` - Live triage tracking
- `POST /api/consultations` - Submit patient visit history
- `GET /api/pharmacy/inventory` - Fetch current medicine stock
- `GET /api/rooms` - Live bed availability
