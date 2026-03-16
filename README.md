# Breach Monitoring System

## Internship Project Documentation

---

# 1. Project Overview

This project is a **Breach Monitoring System**.

The system allows users to:

* Sign up and logedin git status
* Enter their email address
* View all known data breaches related to that email
* Enable monitoring for that email
* Receive alerts if new breaches are found in the future

The system will:

* Store previously detected breaches in a database
* Run a scheduled cron job daily
* Compare new breach data with old stored data
* Send email alerts if new breaches are discovered

---

# 2. System Architecture Overview

## High Level Flow

1. User signs up / logs in
2. User submits an email for breach check
3. Backend calls breach API
4. Results displayed to user
5. User clicks "Enable Monitoring"
6. System stores breach snapshot in database
7. Daily cron job runs
8. Cron job checks new breach data
9. Compare old vs new
10. If new breach found → send email alert

---

# 3. Tech Stack

## Backend

* Node.js
* Express.js
* PostgreSQL or MySQL
* Sequelize or Prisma ORM
* node-cron
* Nodemailer
* bcrypt
* JWT authentication

## Frontend

* React.js or Next.js
* Tailwind CSS or Bootstrap
* Axios for API calls

## External Services

* Breach API (example: Have I Been Pwned API or similar)
* SMTP email service (Gmail / SendGrid / Mailgun)

---

# 4. Task Breakdown for Interns

---

# Phase 1: Environment Setup

## Task 1: Install Required Tools

* Install Node.js (latest LTS)
* Install npm
* Install Git
* Setup VS Code
* Install Postman

Deliverable:

* Node server running successfully

---

## Task 2: Initialize Backend Project

* Create new Node project
* Install dependencies:

  * express
  * cors
  * dotenv
  * bcrypt
  * jsonwebtoken
  * sequelize or prisma
  * mysql2 or pg
  * node-cron
  * nodemailer
  * axios

Deliverable:

* Basic Express server running on localhost

---

# Phase 2: Database Design

## Tables Required

### 1. Users Table

* id
* name
* email
* password (hashed)
* created_at

### 2. MonitoredEmails Table

* id
* user_id
* monitored_email
* created_at

### 3. BreachRecords Table

* id
* monitored_email_id
* breach_name
* breach_date
* breach_description
* breach_source
* created_at

---

# Phase 3: Authentication System

## Task 3: Signup API

* Hash password using bcrypt
* Store user in database

## Task 4: Login API

* Validate password
* Generate JWT token
* Return token

## Task 5: Protected Routes

* Middleware to verify JWT
* Only authenticated users can access breach routes

---

# Phase 4: Breach Checking System

## Task 6: Create Breach Check API

Route:
POST /check-breach

Input:

* email

Process:

* Call breach API using axios
* Get breach data
* Return structured response

Output:

* List of breaches
* Count of breaches
* Breach details

---

# Phase 5: Monitoring System

## Task 7: Enable Monitoring

Route:
POST /enable-monitoring

Process:

* Save monitored email in MonitoredEmails table
* Save all current breaches in BreachRecords table

Important:
This acts as the baseline snapshot.

---

# Phase 6: Cron Job System

## Task 8: Setup Cron Job

Use node-cron.

Schedule:

* Every day at 2 AM

Cron Process:

1. Fetch all monitored emails
2. For each email:

   * Call breach API
   * Get latest breach data
   * Compare with existing records in BreachRecords table
3. If new breach found:

   * Insert into BreachRecords
   * Send alert email

---

# Phase 7: Comparison Logic

Comparison Algorithm:

1. Get old breaches from database
2. Get new breaches from API
3. Compare based on breach_name
4. If breach_name not found in old list
   → It is a new breach
   → Trigger email alert

---

# Phase 8: Email Alert System

## Task 9: Setup Nodemailer

Email Content:
Subject:
New Breach Detected

Body:

* Email monitored
* Breach name
* Breach date
* Description
* Recommended actions

---

# Phase 9: Frontend Development

## Pages Required

1. Signup Page
2. Login Page
3. Dashboard Page
4. Breach Result Page

---

## Dashboard Features

* Input field for email
* Check Breach button
* Enable Monitoring button
* List of monitored emails
* View past breaches

---

# Frontend Flow

1. User logs in
2. Dashboard loads
3. User enters email
4. Calls /check-breach
5. Shows results
6. User clicks Enable Monitoring
7. Calls /enable-monitoring

---

# Security Requirements

* Password hashing mandatory
* JWT authentication
* Input validation
* Rate limiting
* API key stored in .env file
* No sensitive data exposed in frontend

---

# Folder Structure Suggestion

backend
controllers
models
routes
middleware
cron
config
utils
server.js

frontend
components
pages
services
context

---

# Advanced Features (Optional)

* Dark mode UI
* Email verification on signup
* Two factor authentication
* Export breach history as PDF
* Admin dashboard
* Telegram alert integration
* AI based risk scoring

---

# Final Deliverables

Each intern should submit:

* Working backend APIs
* Database schema
* Functional frontend
* Cron job implementation
* Email alert working
* Proper README documentation
* Clean Git commits

---

# Learning Outcomes

Interns will learn:

* Authentication systems
* Secure password handling
* Database design
* API integration
* Scheduled background jobs
* Data comparison logic
* Email automation
* Real world security product architecture

---

End of Documentation
