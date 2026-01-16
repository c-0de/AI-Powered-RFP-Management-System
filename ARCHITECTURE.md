# System Architecture - AI-Powered RFP Management System

This document provides a high-level overview of the system architecture, illustrating the data flow between components.

```mermaid
graph TD
    subgraph "Frontend Layer"
        UI["React Frontend (Vite)"]
        Components["UI Components"]
        Services["API Service (Axios)"]
        UI --> Components
        Components --> Services
    end

    subgraph "Backend Layer"
        API["Express.js Server"]
        Router["API Routes"]
        Controllers["Controllers/Handlers"]
        API --> Router
        Router --> Controllers
    end

    subgraph "Data Layer"
        DB[("MongoDB")]
        Models["Mongoose Models"]
        Controllers --> Models
        Models --> DB
    end

    subgraph "External Services"
        AI["AI Service (Groq)"]
        Email["Mailgun (Email Service)"]
        Webhook["Webhook Receiver"]
    end

    Services -- "HTTP Requests (JSON)" --> API
    Controllers -- "Prompt Engineering" --> AI
    AI -- "Structured Data" --> Controllers
    
    Controllers -- "Send Email" --> Email
    Email -- "Incoming Email Webhook" --> Webhook
    Webhook -- "Process Proposal" --> Controllers

    %% Styling
    classDef frontend fill:#e3f2fd,stroke:#1565c0,stroke-width:2px;
    classDef backend fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    classDef data fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef external fill:#fff3e0,stroke:#ef6c00,stroke-width:2px;

    class UI,Components,Services frontend;
    class API,Router,Controllers backend;
    class DB,Models data;
    class AI,Email,Webhook external;
```

## Component Description

### 1. Frontend (Client)
*   **Tech Stack:** React, Vite, TailwindCSS.
*   **Role:** User interface for managing RFPs, vendors, and viewing proposals.
*   **Interaction:** Communicates with the backend via RESTful API calls using Axios.

### 2. Backend (Server)
*   **Tech Stack:** Node.js, Express.js.
*   **Role:** core logic, API endpoints, data validation, and orchestration of services.
*   **Key Modules:**
    *   **RFP Management:** CRUD operations for RFPs.
    *   **Vendor Management:** Handling vendor registry.
    *   **Proposal Processing:** Ingesting and analyzing vendor proposals.

### 3. Database
*   **System:** MongoDB (Atlas/Local).
*   **Role:** Persistent storage for:
    *   RFPs (Requests)
    *   Vendors (Profiles)
    *   Proposals (Received responses)
    *   Analyses (AI Comparisons)

### 4. AI Service
*   **Providers:** Groq (groq/compound)
*   **Functions:**
    *   **RFP Extraction:** structured specs from natural language.
    *   **Proposal Parsing:** Extracting price, delivery, and specs from email text.
    *   **Comparison:** Analyzing and ranking multiple proposals against the RFP.

### 5. Email System
*   **Provider:** Mailgun.
*   **Functions:**
    *   **Sending:** Dispatching RFP invitations to vendors.
    *   **Receiving:** Webhooks capture incoming reply emails from vendors.
