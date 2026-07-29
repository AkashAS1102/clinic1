# 🏥 Aarogya Hospital Management System

![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white)
![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite&logoColor=white)

A comprehensive, full-stack Hospital & Clinic Management System designed to streamline everything from patient registration and medical consultations to nursing queues, pharmacy inventory, and hospital administration. 

Built with scalability, ease of use, and local deployment in mind, it provides robust reactive UI and a reliable SQLite database.

---

## 📑 Table of Contents
1. [Features & Modules](#-features--modules)
2. [Database Schema](#-database-schema)
3. [Architecture & Tech Stack](#-architecture--tech-stack)
4. [Getting Started (Installation)](#-getting-started)
5. [API Reference](#-api-reference)
6. [Offline Mode Engine](#-offline-mode-engine)

---

## 🌟 Features & Modules

### 🧑‍⚕️ Clinical Management
* **Patient Registration (`/patients`):** Complete onboarding including demographic details, emergency contacts, insurance information, and rich medical history logs.
* **Doctor Portal (`/doctors`):** Dedicated views for doctors to manage their patient queue, record detailed visit notes, and review history.
* **Nurse Station (`/nurse-station`):** The triage hub. Features a real-time Live Queue where nurses collect vital signs (BP, Pulse, SpO2, BMI) before routing the patient to the doctor.
* **Consultations (`/consultation`):** Detailed medical record keeping supporting chief complaints, diagnoses, and digital e-prescriptions.
* **Appointments (`/appointments`):** Schedule, track, and manage all future and daily doctor appointments.

### 💊 Pharmacy & Billing
* **Inventory Dashboard (`/pharmacy`):** Track medication stock levels, pricing, category classifications, and automate stock deduction upon dispensing.
* **Prescription Pipeline:** Automatically fetches medicines prescribed by doctors directly into the pharmacy queue for easy dispensing.
* **Automated Billing:** Generates hospital bills and pharmacy invoices instantly, with integrated GST and taxation features.

### 🏢 Hospital Administration
* **Staff Management (`/staffs`):** Unified employee directory to manage roles, contact information, and licensing.
* **HR & Payroll (`/hr`):** Track staff working hours, calculate monthly salaries, and manage daily shifts.
* **Room Assignments (`/rooms`):** Visualize hospital layout, manage ward capacities, assign patients to beds, and oversee room statuses (Occupied, Available, Cleaning).
* **Manager Dashboard (`/manager`):** High-level bird's-eye view of clinic revenue, footfall, and performance metrics.

---

## 🗄️ Database Schema

The backend uses a robust SQLite relational database structure utilizing `better-sqlite3`. Major tables include:

* `patients`: Stores `id`, `fullName`, `dob`, `bloodGroup`, `insuranceProvider`, `allergies`, etc.
* `doctors`: Stores `id`, `name`, `department`, `fee`, `timeSlot`, and `availableDays`.
* `nurses`: Stores `id`, `name`, `shift`, `licenseNumber`.
* `appointments`: Link table connecting `patientId` to `doctorId` along with a `token`, `date`, and `timeSlot`.
* `nurse_queue`: Tracks the live triage pipeline, holding `bp`, `pulse`, `bmi`, `spo2`, and routing `status`.
* `consultations`: Medical history records including `diagnoses`, `medicines`, `advice`, and `followUp` details.
* *(Plus extensive tables for Pharmacy Inventory, Staffs, HR Payroll, and Rooms)*

---

## 🏗️ Architecture & Tech Stack

This project strictly adheres to a decoupled client-server architecture:

### Frontend (`/frontend`)
* **Framework:** React 18
* **Build Tool:** Vite
* **Routing:** React Router DOM v6
* **Icons:** Lucide-React
* **HTTP Client:** Axios
* **State Management:** React Context API (`AppContext`)
* **Styling:** Modular CSS / Pure CSS

### Backend (`/backend`)
* **Runtime:** Node.js v18+
* **Framework:** Express.js
* **Middleware:** CORS, Express JSON parser
* **Database:** SQLite (via `better-sqlite3`)
* **Optimization:** WAL (Write-Ahead Logging) is enabled for high-concurrency read/write operations without database locking.

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### 1. Boot up the Backend (API & DB)

The backend handles all data persistence. Upon running for the first time, it will automatically generate the `clinic.db` SQLite file and populate it with default demo data if needed.

```bash
cd backend
npm install
npm start
```
*The backend server will begin listening at `http://localhost:8080`.*

### 2. Boot up the Frontend (UI)

Open a **new** terminal window to launch the React frontend.

```bash
cd frontend
npm install
npm run dev
```
*Vite will start the dev server, typically at `http://localhost:5173`. Open this URL in any modern web browser.*

---

## 🔌 API Reference

The Express backend exposes RESTful APIs all prefixed with `/api`. Common endpoints:

* **GET /api/health** - Server heartbeat and status check
* **GET / POST /api/patients** - Patient CRUD operations
* **GET / POST /api/doctors** - Doctor schedules and profiles
* **GET / POST /api/appointments** - Scheduling and conflict checks
* **GET / PUT /api/nurse-queue** - Live triage tracking and status updates
* **POST /api/consultations** - Submit patient visit history and doctor notes
* **GET /api/pharmacy/inventory** - Fetch current medicine stock
* **GET /api/rooms** - Live bed availability and ward status
* **GET /api/hr/payroll** - Salary data and processing

---

## ⚡ Offline Mode Engine

A unique feature of this application is its **Reactive Demo Engine**. 

If the frontend is unable to reach the Node.js backend (`http://localhost:8080`), it will seamlessly fallback to an "Offline Mode". This mode uses hard-coded in-memory arrays and context state to allow users to click through the interface, preview screens, and experience the UI routing without needing a functioning database connection. An orange banner will always be present at the top of the screen when operating in this mode.
