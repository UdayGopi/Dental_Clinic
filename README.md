# Dental Clinic Messaging Agent

An automated Patient Messaging Agent for dental clinics that handles appointment follow-ups, recall reminders, and promotional broadcasts via SMS.

## Features

- **Post-Visit SMS**: Automated thank-you messages after appointments
- **Recall Reminders**: Configurable follow-up reminders for re-checkups
- **Promotional Broadcasts**: Send special offers to targeted patient groups
- **Consent Management**: Handles patient opt-in/opt-out and compliance
- **Reporting**: Message delivery tracking and effectiveness metrics

## Setup

1. Clone the repository
2. Create a virtual environment:
   ```
   python -m venv venv
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # Unix/MacOS
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Set up environment variables in `.env` file:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_number
   DATABASE_URL=postgresql://user:password@localhost/dental_messaging
   REDIS_URL=redis://localhost:6379/0
   ```
5. Initialize the database:
   ```
   alembic upgrade head
   ```
6. Start the application:
   ```
   uvicorn app.main:app --reload
   ```
7. Start Celery worker (in a separate terminal):
   ```
   celery -A app.worker.celery worker --loglevel=info
   ```
8. Start Celery beat for scheduled tasks (in a separate terminal):
   ```
   celery -A app.worker.celery beat --loglevel=info
   ```

## Architecture

The system consists of the following components:

- **API Service**: FastAPI application handling requests and events
- **Message Service**: Core service for template rendering and message sending
- **Scheduler**: Celery-based system for timed and recurring messages
- **SMS Provider**: Twilio integration for message delivery
- **Database**: PostgreSQL for data storage with SQLAlchemy ORM

## Development

To run tests:
```
pytest
```