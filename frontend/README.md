# Dental Clinic Frontend

Production-ready React frontend for the Dental Clinic Messaging System.

## Features

- 🏠 Beautiful landing page with dental images and scrolling text
- 🔐 Authentication system (Login/Register)
- 👥 Patient management
- 📅 Appointment management
- 📝 Message templates
- 📢 Broadcast campaigns
- 📊 Analytics dashboard

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Environment

The frontend expects the backend API to be running on `http://localhost:8000`. The Vite proxy is configured to forward `/api` requests to the backend.

## Tech Stack

- React 18
- TypeScript
- Chakra UI
- React Router
- Axios
- Recharts (for analytics)
- Vite

