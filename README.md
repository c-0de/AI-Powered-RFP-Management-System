# AI-Powered RFP Management System


A comprehensive system for managing Requests for Proposals (RFPs), automating vendor interactions, and leveraging AI for comparing proposals.

## Scopes and Limitations

### Current Scope & Limitations
*   **Email Attachments**: Currently, the system only processes the **text content** of vendor emails. Attachments such as PDFs or Word documents are not parsed or analyzed.
*   **Sequential Processing**: Vendor responses are processed one by one. Concurrent processing for high volumes of emails is not yet implemented.
*   **User Authentication**: The system is designed as an internal tool and currently does not implement user authentication (Login/Signup) or Role-Based Access Control (RBAC).

### Future Roadmap
*   **Scalability (LangGraph)**: Integration of LangGraph to create more scalable and stateful agentic workflows.
*   **AI Guardrails**: Implementing robust guardrails to ensure consistent and safe AI outputs.
*   **Enhanced Error Handling**: Improving exception handling capabilities, particularly for chat and AI interaction flows.
*   **Concurrent Processing**: Upgrading the email handling pipeline to support concurrent processing of vendor responses.
*   **Domain-Specific Fine-tuning**: Adopting Model Context Protocol (MCP) or adapter-style fine-tuning to specialize the AI for specific industry domains.


## Project Structure

*   **`RFP-System-Frontend/`**: React-based user interface for creating RFPs and viewing analyses.
*   **`RFP-System-Backend/`**: Node.js/Express backend handling API requests, emails, and AI processing.

## Tech Stack

*   **Frontend**: React (Vite), TailwindCSS, React Router, Axios.
*   **Backend**: Node.js, Express.js, Mongoose.
*   **Database**: MongoDB.
*   **AI Providers**: Groq SDK (groq/compound)
*   **Email Solution**: Mailgun (sending/receiving).
*   **Key Libraries**:
    *   *Frontend*: `react-hot-toast` (Notifications), `react-markdown` (Rendering).
    *   *Backend*: `nunjucks` (Prompt templating), `multer` (Webhooks), `mailparser` (Email parsing).

---

## Prerequisites

Before you begin, ensure you have the following installed:
*   **Node.js**: v18.0.0 or higher.
*   **MongoDB**: Local installation or MongoDB Atlas connection string.
*   **npm**: Configured and working.

You will also need API keys/credentials for:
*   **AI Providers**: Groq (groq/compound)
*   **Email Service**: Mailgun (or compatible SMTP/IMAP provider).
*   **Ngrok**: For exposing your local server to receive email webhooks.

---

## Installation

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd RFP-System-Backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### 2. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd RFP-System-Frontend
    ```
2.  Install dependencies:
     ```bash
    npm install
    ```
---

### Database Setup
*   Visit MongoDB Website (Atlas).
*   Create a Project -> Cluster -> Free Tier.
*   Get the Connection String, User, and Password, and set it in the `.env` file.


## Configuration

### Backend Configuration

1.  Create a `.env` file in `RFP-System-Backend/` based on `.env.example`.
2.  Fill in the required variables:

### Frontend Configuration

1.  Create a `.env` file in `RFP-System-Frontend/`.
2.  Specify the backend API URL:

    ```env
    VITE_BASE_API_URL=http://localhost:5000/api
    ```

---

### LLM API Setup
*   Visit Groq Website.
*   Create an account.
*   Get your free API Key.
*   Set it in the `.env` file.
*   You can choose your models like `groq/compound`, `llama-3.3-70b-versatile`, etc.
*   *We have used `groq/compound` for this project.*

## Running the Application

**Terminals**: You will need two separate terminal instances.

### 1. Start Backend Server
In the first terminal:
```bash
cd RFP-System-Backend
npm run dev
```
*   Server runs on `http://localhost:5000`.
*   API Documentation defined at `http://localhost:5000/api`.

### 2. Start Frontend Client
In the second terminal:
```bash
cd RFP-System-Frontend
npm run dev
```
*   Application opens at `http://localhost:5173`.

### 3. Expose Backend with Ngrok (Required for Webhooks)

To receive real-time email webhooks from Mailgun, your local backend must be accessible from the internet.

1.  **Install Ngrok**:
    *   **Option A (Recommended for Node.js users):**
        ```bash
        npm install -g ngrok
        ```
    *   **Option B (Manual):** Download from [ngrok.com/download](https://ngrok.com/download).

2.  **Configure & Authenticate**:
    *   Sign up for a free account at [dashboard.ngrok.com](https://dashboard.ngrok.com/signup).
    *   Copy your Authtoken from the dashboard.
    *   Run the command:
        ```bash
        ngrok config add-authtoken YOUR_NGROK_AUTH_TOKEN
        ```

3.  **Start Ngrok**:
    Run the following command in a **third terminal** to expose the backend port (default: 5000). 
    > **Note:** Ensure this matches the `PORT` defined in your backend `.env` file.
    ```bash
    ngrok http 5000
    ```
4.  **Copy URL**: Copy the HTTPS URL provided by ngrok (e.g., `https://a1b2-c3d4.ngrok-free.app`).
5.  **Configure Mailgun**: Go to your Mailgun Webhook settings and set the "Store and Notify" or "Routes" URL to:
    `YOUR_NGROK_URL/receive-mail`


### 4. 📧 Mailgun Email Inbound & Outbound Setup Guide

This guide explains how to configure Mailgun Sandbox to:
*   ✅ Send emails (Outbound)
*   ✅ Receive replies / inbound emails via webhook
*   ✅ Test locally using ngrok

#### Prerequisites
Before starting, make sure you have:
*   Mailgun account (Free Sandbox)
*   Node.js installed
*   Express server running
*   ngrok installed
*   Public internet connection

#### 🔹 Step 1 — Create Mailgun Account
*   Sign up at [mailgun.com](https://www.mailgun.com) and verify your email.
*   Login to the dashboard.

#### **Outbound Configuration (Sending Emails)**

#### 🔹 Step 2 — Get Sandbox Domain & API Key
*   In the dashboard, click **"Add Domain"**. (Or use the pre-created test sandbox domain).
*   Create your **API Key**.

*   **Create your API KEY and Sending API KEY**.
*   Click on your sandbox domain. You can set the sending API Key beside the setup button.
*   Copy the **domain name** (e.g., `sandbox...mailgun.org`).
*   Copy your **API Key**.

#### 🔹 Step 3 — Authorize Recipient Email (Sandbox Limitation)
*   *Note: Free sandbox only allows sending to authorized emails.*
*   In the domain setup page, find the **"Authorized Recipients"** section (or `Add test email recipient`).
*   Add your email address and **verify** it via the email sent to you.
*   *This email will simulate the "Vendor" receiving proposals.*

#### **Inbound Configuration (Receiving Emails)**

#### 🔹 Step 4 — Receiving Emails via Routes
1.  In the dashboard, navigate to **RECEIVING** -> **Routes**.
2.  Click **"Create Route"**.
3.  **Expression Type**: Select `Match Recipient`.
4.  **Recipient**: Enter your sandbox domain pattern:
    *   `.*@sandbox<your-sandbox-id>.mailgun.org`
    *   (It should start with `.*@` followed by your sandbox domain name).
5.  **Actions**:
    *   Enable **Forward**.
    *   **Destination**: Enter your ngrok URL endpoint: `YOUR_NGROK_URL/receive-mail`.
    *   Enable **Stop** (to prevent further processing).
6.  Click **Create Route**.

> **Success:** Now every reply or email sent to your sandbox domain will be forwarded to your backend for processing.

---

## Key Features

*   **RFP Creation**: AI-assisted generation of detailed RFPs from natural language descriptions.
*   **Vendor Management**: Registry of vendors with capabilities and contact info.
*   **Automated Emails**: Sends invites to vendors and processes their email replies automatically.
*   **AI Comparison**: Intelligently extracts structured data from proposal emails and compares them side-by-side to generate a recommendation.

---

## Decisions & Assumptions

### Design Decisions
*   **Hybrid Data Formatting**: We adopted a hybrid schema approach. Core entities (RFP, Vendor) are strictly typed with Mongoose for reliability, while the `Proposal` extracted data uses looser typing to accommodate the variability of AI outputs.
*   **Prompt Externalization**: We externalized prompts into `.jinja` templates to decouple AI logic from application code. This allows for easier iteration on prompts (e.g., tweaking the "persona" or "JSON rules") without modifying the core JavaScript logic.
*   **Manual Triggers**: We deliberately chose manual triggers for "Check Emails" and "Compare Proposals" (vs. Cron jobs). This gives the user control over when to consume API credits and ensures they are ready to review the data.

### Assumptions
*   **Email Context**: The system assumes that an incoming email from a vendor corresponds to the **most recently 'Sent' RFP**. (In a full production scale, we would track specific unique IDs in email subjects or headers).
*   **Currency & Units**: The system assumes all monetary values are compatible (defaults to USD) and does not currently perform currency conversion during comparison.

---

## AI Tools Usage

**Tools Used**: **Antigravity** powered by Google Gemini Models.

### Uses & Contributions
*   **Boilerplate & Architecture**: Generated the initial project structure, including the split between Frontend (Vite) and Backend (Express), and the folder organization.
*   **Debugging**: Quickly identified and fixed syntax errors (e.g., the duplicate `catch` block issue) and resolved 500 errors by adding detailed logging.
*   **Documentation**: Auto-generated the `API_DOCUMENTATION.md` and `ARCHITECTURE.md` (Mermaid diagram) by analyzing the existing codebase.
*   **Refactoring**: Helped refactor the AI service to support multiple providers (Groq/Gemini) and to use Nunjucks templates for prompts.
