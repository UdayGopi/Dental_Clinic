# 🦷 Dental Clinic Automated Patient Messaging Agent

ఒక automated SMS messaging system dental clinic కోసం, patient communication, appointment reminders, మరియు promotional broadcasts ని manage చేయడానికి.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Testing the Agent](#testing-the-agent)
- [User Roles & Access](#user-roles--access)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

### Core Features

1. **Automated Post-Visit SMS**
   - Appointment completion తర్వాత automatic thank-you message
   - Immediate follow-up after checkout

2. **Smart Reminder System**
   - Configurable recall reminders for re-checkups
   - Multiple reminder levels (3 days before, 1 day before, 3 hours before)
   - Custom recurrence per patient/treatment

3. **Promotional Broadcasts**
   - Holiday specials మరియు promotional campaigns
   - Targeted patient groups
   - Scheduled broadcasts

4. **Role-Based Access Control**
   - **Patient Portal**: View appointments, messages, book appointments
   - **Staff Portal**: Manage patients, appointments, messages, templates
   - **Admin Portal**: Full access + admin management

5. **Message Management**
   - Template system with Jinja2
   - Message status tracking
   - Audit logs
   - Analytics dashboard

6. **Compliance & Security**
   - Opt-in/opt-out support
   - Do Not Disturb (DND) hours (9 PM - 8 AM)
   - Patient consent tracking
   - Secure data handling

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │  React + TypeScript + Chakra UI
│   (Port 5173)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend API   │  FastAPI (Port 8000)
│   (FastAPI)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────────┐
│ SQLite │ │   Twilio     │
│   DB   │ │   SMS API    │
└────────┘ └──────────────┘
    │
    ▼
┌─────────────────┐
│  APScheduler    │  Background tasks
│  (Automation)   │
└─────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Local database (open-source, no server needed)
- **Twilio** - SMS gateway
- **APScheduler** - Background job scheduling
- **Jinja2** - Template engine for personalized messages

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Chakra UI** - Component library
- **React Router** - Navigation
- **Vite** - Build tool

---

## 📦 Prerequisites

- **Python 3.11+**
- **Node.js 18+** and npm
- **Twilio Account** (free trial available)
- **Git** (optional)

---

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Digital_clinic_Agent
```

### Step 2: Backend Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows CMD:
venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Frontend Setup

```bash
cd frontend
npm install
```

### Step 4: Configure Environment Variables

Create a `.env` file in the project root by copying the example file:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Windows CMD
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Then edit `.env` and add your actual Twilio credentials and other configuration values. See `.env.example` for all available configuration options.

### Step 5: Get Twilio Credentials

1. Sign up at https://www.twilio.com/try-twilio (free trial)
2. Get Account SID and Auth Token from dashboard
3. Get a phone number (free trial number available)
4. Add credentials to `.env` file

---

## ⚙️ Configuration

### Database

The application uses **SQLite** by default - a lightweight, file-based database perfect for local development. No server setup required!

- Database file: `dental_messaging.db` (created automatically)
- Location: Project root directory
- Backup: Simply copy the `.db` file

### SMS Provider

Currently configured for **Twilio**:
- Free trial: $15.50 credit
- Pricing: ~$0.0075 per SMS
- Supports international numbers

### Scheduling

- **Reminder Timing**: Configurable via `.env`
- **DND Hours**: 9 PM - 8 AM (configurable)
- **Background Jobs**: Runs every 5 minutes

---

## 🏃 Running the Application

### Start Backend

```bash
# Make sure virtual environment is activated
uvicorn app.main:app --reload
```

Backend will run on: `http://localhost:8000`

### Start Frontend

```bash
# In a new terminal
cd frontend
npm run dev
```

Frontend will run on: `http://localhost:5173`

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🧪 Testing the Agent

### Quick Test Flow

1. **Create a Patient**
   - Login as Admin/Staff
   - Go to "Patients" tab
   - Add new patient with phone number and consent

2. **Create an Appointment**
   - Go to "Appointments" tab
   - Create appointment for the patient
   - Mark appointment as "completed"

3. **Verify Automated Message**
   - Check "Messages" tab
   - Should see thank-you message sent automatically
   - Status should be "SENT"

4. **Test Reminders**
   - Create appointment 3+ days in future
   - Wait for scheduler (runs every 5 min)
   - Check messages for reminder

5. **Test Broadcast**
   - Go to "Broadcasts" tab
   - Create promotional broadcast
   - Select target patients
   - Send broadcast

### Detailed Testing Guide

See `TESTING_GUIDE.md` for comprehensive testing instructions.

---

## 👥 User Roles & Access

### Patient Role

**Tabs Available:**
- My Dashboard
- My Appointments (view & book)
- My Messages

**Features:**
- View own appointments
- Book new appointments
- View own messages
- Update profile

### Staff Role

**Tabs Available:**
- Dashboard
- Patients
- Appointments
- Messages
- Templates
- Broadcasts
- Analytics
- Audit Logs

**Features:**
- All patient features
- Manage patients
- Manage appointments
- Send messages
- Create templates
- Create broadcasts
- View analytics

### Admin Role

**Tabs Available:**
- All Staff tabs +
- Admin Management

**Features:**
- All staff features
- Manage admin accounts
- View admin timings
- System configuration

---

## 📡 API Documentation

### Main Endpoints

- `GET /api/patients` - List patients
- `POST /api/patients` - Create patient
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `GET /api/messages` - List messages
- `POST /api/templates` - Create template
- `POST /api/broadcasts` - Create broadcast
- `GET /api/analytics` - Get analytics
- `POST /api/webhooks/twilio` - Twilio webhook

### Interactive API Docs

Visit `http://localhost:8000/docs` for Swagger UI with interactive testing.

---

## 💾 Database

### SQLite (Default)

**Advantages:**
- ✅ No server setup required
- ✅ File-based (easy backup)
- ✅ Perfect for local development
- ✅ Open-source and free
- ✅ Lightweight and fast

**Database Schema:**
- `patients` - Patient information
- `appointments` - Appointment records
- `messages` - SMS message history
- `message_templates` - Message templates
- `broadcasts` - Broadcast campaigns
- `audit_logs` - System audit trail

### Switching to PostgreSQL (Production)

To use PostgreSQL in production, update `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost/dental_clinic
```

Install PostgreSQL adapter (already in requirements.txt):
```bash
pip install psycopg2-binary
```

---

## 🐛 Troubleshooting

### Backend Issues

**Error: "Twilio client not initialized"**
- Check `.env` file has correct Twilio credentials
- Verify credentials at https://console.twilio.com/

**Error: "Database locked"**
- Close any database viewers
- Restart backend server

**Error: "Module not found"**
- Activate virtual environment
- Run `pip install -r requirements.txt`

### Frontend Issues

**Blank screen**
- Check browser console for errors
- Verify backend is running on port 8000
- Check `frontend/src/services/api.ts` for correct API URL

**Login not working**
- Check backend logs
- Verify database is initialized
- Check network tab in browser DevTools

### SMS Not Sending

1. **Check Twilio Account**
   - Verify account is active
   - Check phone number is verified
   - Verify account balance

2. **Check Logs**
   - Backend logs show SMS status
   - Check "Messages" tab in UI

3. **Check DND Hours**
   - Messages won't send during DND (9 PM - 8 AM)
   - Wait or adjust DND hours in `.env`

4. **Check Patient Consent**
   - Patient must have `consent_sms = true`
   - Update in "Patients" tab

---

## 📊 Project Structure

```
Digital_clinic_Agent/
├── app/
│   ├── api.py              # API endpoints
│   ├── config.py           # Configuration
│   ├── database.py         # Database setup
│   ├── main.py             # FastAPI app
│   ├── models.py           # Database models
│   ├── scheduler.py        # Background scheduler
│   ├── services/
│   │   ├── messaging.py    # SMS service
│   │   ├── broadcast.py    # Broadcast service
│   │   ├── metrics.py      # Analytics
│   │   └── consent.py      # Consent management
│   └── templates/
│       └── default_templates.py
├── frontend/
│   ├── src/
│   │   ├── pages/          # React pages
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── services/       # API client
│   └── package.json
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables
└── README.md              # This file
```

---

## 🔐 Security Notes

- Never commit `.env` file to git
- Use environment variables for sensitive data
- Implement proper authentication in production
- Use HTTPS in production
- Regularly backup database

---

## 📈 Business Outcomes

- ✅ **Improved Patient Retention**: Automated follow-ups
- ✅ **Better Appointment Adherence**: Smart reminders
- ✅ **Increased Revenue**: Promotional broadcasts
- ✅ **Reduced No-Shows**: Multiple reminder levels
- ✅ **Time Savings**: Fully automated system

---

## 🚀 Deployment

For production deployment, see `AWS_DEPLOYMENT_COST.md` for AWS deployment guide and cost estimates.

---

## 📝 License

This project is for dental clinic use.

---

## 🤝 Support

For issues or questions:
1. Check `TROUBLESHOOTING.md`
2. Review backend logs
3. Check browser console for frontend errors

---

**🎉 Happy Messaging! Your automated patient communication system is ready!**

