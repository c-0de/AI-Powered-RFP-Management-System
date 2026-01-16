# API Documentation - AI-Powered RFP Management System

Base URL: `http://localhost:5000` (Development)

## Table of Contents
1. [RFP Management](#rfp-management)
2. [Vendor Management](#vendor-management)
3. [Proposal Management](#proposal-management)
4. [Webhooks](#webhooks)

---

## RFP Management
Base Path: `/api/rfps`

### 1. Get All RFPs
Retrieves a list of all RFPs, sorted by creation date (newest first).

*   **Endpoint:** `GET /`
*   **Response:**
    *   **Success (200):** Array of RFP objects
    *   **Error (500):** `{ "message": "Failed to fetch RFPs: [error details]" }`

### 2. Get Single RFP
Retrieves details of a specific RFP strictly by ID.

*   **Endpoint:** `GET /:id`
*   **Params:**
    *   `id`: The unique ID of the RFP.
*   **Response:**
    *   **Success (200):** RFP object with populated `selectedVendors`.
    ```json
    {
      "_id": "65ae...",
      "title": "IT Equipment",
      "items": [
        { "itemName": "Laptop", "quantity": 50, "specs": "i7, 16GB RAM" }
      ],
      "selectedVendors": [ ...vendorObjects ],
      ...
    }
    ```
    *   **Error (404):** `{ "message": "RFP with ID [id] not found" }`
    *   **Error (500):** `{ "message": "Error retrieving RFP details: [error details]" }`

### 3. Create New RFP
Creates a new RFP with the provided details.

*   **Endpoint:** `POST /`
*   **Request Body:**
    ```json
    {
      "title": "Office Supplies",
      "description": "Request for monthly stationeries",
      "items": [
        { "itemName": "A4 Paper", "quantity": 100, "specs": "80gsm" }
      ],
      "budget": 2000,
      "deadline": "2024-02-01"
    }
    ```
*   **Response:**
    *   **Success (201):** The created RFP object with success message.
    ```json
    {
      "message": "RFP created successfully",
      "_id": "...",
      "title": "Office Supplies",
      ...
    }
    ```
    *   **Error (400):** `{ "message": "Failed to create RFP: [error details]" }`

### 4. specific RFP Analysis (Preview)
Generates a structured RFP preview from a natural language description using AI. Does NOT save to the database.

*   **Endpoint:** `POST /generate`
*   **Request Body:**
    ```json
    {
      "description": "We need 20 high-end gaming laptops with RTX 4080 graphics cards and 32GB RAM."
    }
    ```
*   **Response:**
    *   **Success (200):** Preview RFP object.
    ```json
    {
      "message": "RFP analysis generated successfully",
      "title": "Gaming Laptops Procurement",
      "items": [
        { "itemName": "Gaming Laptop", "quantity": 20, "specs": "RTX 4080, 32GB RAM" }
      ],
      "description": "We need...",
      "status": "Draft"
    }
    ```

### 5. Send RFP to Vendors
Assigns vendors to an RFP and triggers email invitations.

*   **Endpoint:** `POST /:id/send`
*   **Params:**
    *   `id`: The unique ID of the RFP.
*   **Request Body:**
    ```json
    {
      "vendorIds": ["65ae...vendorId1", "65ae...vendorId2"]
    }
    ```
*   **Response:**
    *   **Success (200):**
    ```json
    {
      "message": "Successfully sent RFP invitations to 2 vendors",
      "vendorCount": 2
    }
    ```
    *   **Error (404):** `{ "message": "RFP with ID [id] not found" }`
    *   **Error (500):** `{ "message": "Failed to send RFP emails: [error details]" }`

### 6. Mark Proposals as Read
Resets the unread proposals count for an RFP.

*   **Endpoint:** `PUT /:id/mark-read`
*   **Params:**
    *   `id`: The unique ID of the RFP.
*   **Response:**
    *   **Success (200):** `{ "message": "All proposals for this RFP marked as read" }`
    *   **Error (500):** `{ "message": "Error marking proposals as read: [error details]" }`

---

## Vendor Management
Base Path: `/api/vendors`

### 1. Get All Vendors
Retrieves a list of all registered vendors.

*   **Endpoint:** `GET /`
*   **Response:**
    *   **Success (200):** Array of Vendor objects.
    *   **Error (500):** `{ "message": "Failed to retrieve vendor list: [error details]" }`

### 2. Create Vendor
Adds a new vendor to the system.

*   **Endpoint:** `POST /`
*   **Request Body:**
    ```json
    {
      "vendorCode": "V100",
      "companyName": "Acme Corp",
      "email": "contact@acme.com",
      "phone": "+123456789",
      "categories": ["Electronics", "Office"],
      "location": "New York"
    }
    ```
*   **Response:**
    *   **Success (201):** Created Vendor object.
    ```json
    {
      "message": "Vendor registered successfully",
      ...vendorData
    }
    ```
    *   **Error (400):** `{ "message": "Failed to register vendor: [error details]" }`

---

## Proposal Management
Base Path: `/api/proposals`

### 1. Get Proposals for an RFP
Retrieves all proposals associated with a specific RFP.

*   **Endpoint:** `GET /rfp/:rfpId`
*   **Params:**
    *   `rfpId`: The unique ID of the RFP.
*   **Response:**
    *   **Success (200):** Array of Proposal objects (with populated vendor details).
    *   **Error (500):** `{ "message": "Failed to fetch proposals: [error details]" }`

### 2. Trigger Check for New Emails
Manually triggers the system to fetch emails from the configured email service, parse them, and create proposals if they match active RFPs.

*   **Endpoint:** `POST /check-emails`
*   **Response:**
    *   **Success (200):**
    ```json
    {
      "message": "Email check completed successfully",
      "newProposals": 1
    }
    ```
    *   **Error (500):** `{ "message": "Failed to check emails: [error details]" }`

### 3. Compare Proposals
Triggers an AI comparison of all proposals received for a specific RFP.

*   **Endpoint:** `GET /rfp/:rfpId/compare`
*   **Params:**
    *   `rfpId`: The unique ID of the RFP.
*   **Query Parameters:**
    *   `force`: (string 'true'/'false') If 'true', ignores cached analysis and re-runs AI comparison.
    *   `checkOnly`: (string 'true'/'false') If 'true', checks for cache but does not generate new analysis.
*   **Response:**
    *   **Success (200):**
    ```json
    {
      "recommendation": "Markdown string containing the AI analysis...",
      "analysisId": "...",
      "analysisDate": "...",
      "cached": false
    }
    ```
    *   **Error (500):** `{ "message": "AI comparison failed: [error details]" }`

---

## Webhooks
Base Path: `/receive-mail`

### 1. Webhook Health Check
Simple GET request to verify the webhook receiver is active.

*   **Endpoint:** `GET /`
*   **Response:** "Webhook endpoint is active and accessible. Please use POST for actual emails."

### 2. Receive Email Webhook
Endpoint for email providers (e.g., Mailgun) to push incoming emails.

*   **Endpoint:** `POST /`
*   **Content-Type:** `multipart/form-data` or `application/x-www-form-urlencoded`
*   **Request Body:** Expected fields depend on the provider (e.g., `sender`, `subject`, `body-plain`).
*   **Logic:**
    1.  Extracts sender email to identify the **Vendor**.
    2.  Identifies the active **RFP** (currently assumes the last 'Sent' RFP).
    3.  Parses email content using AI to extract structured data (price, delivery, etc.).
    4.  Creates a **Proposal** record.
*   **Response:**
    *   **Success (200):** "Webhook processed successfully: Proposal saved"
    *   **Error (200):** "Invalid Sender Email Format" / "Vendor email not recognized in system" / "No active (Sent) RFP found" (Returns 200 to prevent Webhook retries)
    *   **Error (500):** "Internal Server Error: Proposal processing failed"
