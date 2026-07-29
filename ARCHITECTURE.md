# 🏥 Aarogya Clinic ERP — System Architecture & Block Diagram

This document illustrates the complete architectural design, component hierarchy, state flow, and functional modules of the **Aarogya Clinic Management System** frontend application.

---

## 1. 🏗️ High-Level System Architecture Block Diagram

The application is engineered as a modern, responsive Single Page Application (SPA) using **React**, **Vite**, **Vanilla CSS Modules**, and **React Router DOM**. It implements a dual-mode data architecture that automatically falls back to an in-memory reactive demo engine when the backend API is offline.

```mermaid
graph TB
    subgraph Client ["🖥️ Client Layer (Browser)"]
        UI["✨ UI / Presentation Layer<br/>(React Components + CSS Modules)"]
        Router["🧭 Router Layer<br/>(React Router DOM v6)"]
    end

    subgraph StateLayer ["🧠 Global State Layer (Context API)"]
        AppContext["📦 AppContext / AppProvider<br/>(Single Source of Truth)"]
        
        subgraph Stores ["Domain Data Stores"]
          PatientsStore["👥 Patients & EMR Store"]
          DoctorsStore["👨‍⚕️ Doctors Store"]
          NursesStore["👩‍⚕️ Nurses & Triage Store"]
          StaffStore["🧑‍💼 HR & Support Staffs Store"]
          RoomStore["🛏️ Wards, Rooms & Beds Store"]
          ConsultStore["🩺 Consultations & Queue Store"]
          PharmacyStore["💊 Pharmacy, Inventory & Billing Store"]
        end
    end

    subgraph DataLayer ["🔌 Data & Network Layer"]
        API["🌐 REST API Service<br/>(/api/api.js)"]
        Fallback["⚡ Offline Demo Engine<br/>(/mockData.js)"]
        Backend["☁️ MedCore Backend Server<br/>(Node.js / Express / Java API)"]
    end

    UI --> Router
    Router --> AppContext
    AppContext --> PatientsStore & DoctorsStore & NursesStore & StaffStore & RoomStore & ConsultStore & PharmacyStore
    
    PatientsStore & DoctorsStore & NursesStore & StaffStore & RoomStore & ConsultStore & PharmacyStore <--> API
    API -- "Online (200 OK)" --> Backend
    API -- "Offline / Timeout (Fallback)" --> Fallback
```

---

## 2. 🧩 Component & Layout Hierarchy

The UI layout is structured around an enterprise ERP container that divides navigation, system notifications, and dynamic workspace pages.

```mermaid
graph TD
    App["🏁 App.jsx<br/>(Root Application Wrapper)"] --> Provider["🧠 AppProvider<br/>(Global Context Injection)"]
    Provider --> Layout["🖥️ ERP App Layout Container"]
    
    Layout --> Sidebar["📂 Sidebar.jsx<br/>(Role-Based Navigation & Portals)"]
    Layout --> Main["🗂️ Main Content Area"]
    
    Main --> TopBar["⚡ TopBar.jsx<br/>(Quick Search, Date/Time & Notifications)"]
    Main --> Banner["⚠️ OfflineBanner<br/>(Demo Mode Status Notice)"]
    Main --> Content["📜 Dynamic Route View Container"]
    
    subgraph NavigationSections ["Sidebar Navigation Sections"]
      Sidebar --> HeadPortal["🏢 Head Portal Dropdown"]
      Sidebar --> ManagerPortal["💼 Manager Dropdown (Salary & Shifts)"]
      Sidebar --> PharmPortal["💊 Pharmacy Dropdown"]
      Sidebar --> ClinOps["🏥 Clinical Operations"]
    </subgraph>
    
    subgraph Pages ["Page Modules (Rendered in Content)"]
      Content --> Reg["📝 Registration Module"]
      Content --> Pat["👥 Patients Directory Module"]
      Content --> Doc["👨‍⚕️ Doctors Roster Module"]
      Content --> Nur["👩‍⚕️ Nurses & Triage Module"]
      Content --> Appt["📅 Appointments Module"]
      Content --> Cons["🩺 Consultation & EMR Module"]
      Content --> Head["🏢 Executive Head Hub"]
      Content --> HRSal["💰 Salary & Payroll Module"]
      Content --> HRShf["⏱️ Working Hours & Shifts Module"]
      Content --> Pharm["💊 Pharmacy Inventory, Prescriptions & Billing Suite"]
    </subgraph>
```

---

## 3. 🏢 Functional Workspace Modules

The system is organized into **5 primary domain modules**, each providing specialized workflows for different hospital roles:

```mermaid
graph LR
    subgraph FrontDesk ["1️⃣ Front Desk & Reception"]
        R1["Register Patient<br/>(Demographics, KYC & Insurance)"]
        R2["Patient Directory<br/>(Search, History & Cards)"]
        R3["Appointment Scheduling<br/>(Token & Time Slot Allocation)"]
    end

    subgraph Nursing ["2️⃣ Nursing & Triage Station"]
        N1["Triage Vitals Capture<br/>(BP, Pulse, Temp, SpO2, BMI)"]
        N2["Nurse Queue Management<br/>(Mark Patient Ready for Doc)"]
        N3["Nurses Directory<br/>(Shift & Roster Management)"]
    end

    subgraph DoctorsMod ["3️⃣ Medical & Consultation"]
        D1["Live Consultation Queue<br/>(Token-based Patient Calling)"]
        D2["EMR Prescription Writing<br/>(Diagnosis, Medicines & Lab Tests)"]
        D3["Patient Medical History<br/>(Past Visits, Vitals & Notes)"]
    end

    subgraph HeadMod ["4️⃣ Executive Head Portal"]
        M1["Head Overview Dashboard<br/>(KPIs, Revenue & Live Occupancy)"]
        M2["Staffs & HR Roster<br/>(Receptionists, Techs, Janitors)"]
        M3["Ward & Bed Allocation Board<br/>(Assign Beds, Transfer & Discharge)"]
        M4["Hospital Inventory<br/>(+ Add Ward, + Add Bed / Suite)"]
    end

    subgraph HRMod ["5️⃣ HR, Salary & Shifts"]
        H1["Staff Salary & Payroll<br/>(Base Salary, Overtime, Deductions & Disbursement)"]
        H2["Working Hours & Shift Rosters<br/>(Morning, General, Evening & Night Shifts)"]
        H3["Attendance & Overtime Tracking<br/>(Check-In Logs & Standard vs Logged Hours)"]
    end

    FrontDesk --> Nursing
    Nursing --> DoctorsMod
    HeadMod --> FrontDesk & Nursing & DoctorsMod & HRMod
```

---

## 4. 🛏️ Ward & Room Allocation Architecture

The **Room & Bed Allocation** subsystem enables dynamic hospital capacity management and live inpatient tracking:

```mermaid
stateDiagram-v2
    [*] --> Available: Create New Bed / Room (+ Add Bed)
    
    Available --> Occupied: Assign Patient Bed<br/>(Select Patient, Doctor & Nurse)
    Occupied --> Occupied: Transfer Bed / Edit Instructions
    Occupied --> Available: Discharge Patient<br/>(Sanitize & Clear Notes)
    
    state Available {
      [*] --> Vacant
      note right of Vacant: Ready for new patient admission
    }
    
    state Occupied {
      [*] --> ActiveInpatient
      note right of ActiveInpatient: Tracks Patient ID, Attending Physician,<br/>Assigned Nurse & Clinical Notes
    }
```

---

## 5. 🔄 Patient EMR Lifecycle & Data Flow

When a patient interacts with the clinic, their data seamlessly transitions through the functional layers without requiring page reloads:

```mermaid
sequenceDiagram
    autonumber
    actor Reception as 🏥 Front Desk
    actor Nurse as 👩‍⚕️ Nurse Station
    actor Doctor as 👨‍⚕️ Doctor
    actor Head as 🏢 Clinic Head
    participant Store as 🧠 Global AppContext

    Reception->>Store: 1. Register New Patient / Book Appointment
    Store-->>Nurse: 2. Token appears in Triage Queue
    Nurse->>Store: 3. Record Vitals (BP, SpO2, BMI) & Mark "Ready"
    Store-->>Doctor: 4. Patient appears in Doctor Consultation Queue
    Doctor->>Store: 5. Perform Consultation, Issue Prescription & Lab Orders
    Store-->>Reception: 6. Visit stored in Patient History EMR
    
    opt Inpatient Admission Required
      Doctor->>Head: 7. Request Ward Bed Admission
      Head->>Store: 8. Assign Bed in Ward Allocation Board
      Store-->>Head: 9. Room Status marked "Occupied"
    end
```

---

## 6. 🛠️ Technology Stack & Design Specifications

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 (SPA) | Component-based UI rendering with declarative state views |
| **Build Tooling** | Vite v5 | High-performance bundling, HMR, and optimized production builds |
| **Routing** | React Router DOM v6 | Role-based layout transitions and deep linking (`/head/dashboard`, `/hr/salary`, `/rooms/assign`, etc.) |
| **Styling Architecture** | Vanilla CSS Modules | Scoped component styling, zero-collision class names, and rich modern aesthetics |
| **Icons & UI Graphics** | Lucide React | Clean, scalable vector iconography for medical and administrative workflows |
| **State Management** | React Context API | Single-source-of-truth global provider managing asynchronous data sync |
| **Offline Resilience** | Fallback Interceptor | Automatically switches to in-memory reactive mock databases when API is offline |
