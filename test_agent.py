import requests
import json
from datetime import datetime, timedelta

# Base URL for API
BASE_URL = "http://localhost:8000/api"

def test_create_patient():
    """Test creating a patient"""
    print("\n=== Testing Patient Creation ===")
    
    # Create patient data
    patient_data = {
        "first_name": "John",
        "last_name": "Doe",
        "phone_number": "+1234567890",
        "email": "john.doe@example.com",
        "consent_sms": True
    }
    
    # Send request
    response = requests.post(f"{BASE_URL}/patients/", json=patient_data)
    
    # Check response
    if response.status_code == 200:
        patient = response.json()
        print(f"Patient created: {patient['first_name']} {patient['last_name']}")
        print(f"Patient ID: {patient['id']}")
        return patient['id']
    else:
        print(f"Failed to create patient: {response.text}")
        return None

def test_create_template():
    """Test creating message templates"""
    print("\n=== Testing Template Creation ===")
    
    # Create post-visit template
    post_visit_data = {
        "name": "Post Visit Follow-up",
        "message_type": "post_visit",
        "content": "Hello {{patient_first_name}}, thank you for visiting our clinic on {{appointment_date}}. If you have any questions, please call us."
    }
    
    # Create recall template
    recall_data = {
        "name": "Recall Reminder",
        "message_type": "recall",
        "content": "Hello {{patient_first_name}}, it's been a while since your last visit on {{last_appointment_date}}. Please call us to schedule your next appointment."
    }
    
    # Send requests
    post_visit_response = requests.post(f"{BASE_URL}/templates/", json=post_visit_data)
    recall_response = requests.post(f"{BASE_URL}/templates/", json=recall_data)
    
    # Check responses
    templates = []
    if post_visit_response.status_code == 200:
        template = post_visit_response.json()
        print(f"Post-visit template created: {template['name']}")
        templates.append(template['id'])
    else:
        print(f"Failed to create post-visit template: {post_visit_response.text}")
    
    if recall_response.status_code == 200:
        template = recall_response.json()
        print(f"Recall template created: {template['name']}")
        templates.append(template['id'])
    else:
        print(f"Failed to create recall template: {recall_response.text}")
    
    return templates

def test_create_appointment(patient_id):
    """Test creating an appointment"""
    print("\n=== Testing Appointment Creation ===")
    
    # Create appointment data (for yesterday)
    yesterday = datetime.now() - timedelta(days=1)
    appointment_data = {
        "patient_id": patient_id,
        "appointment_date": yesterday.isoformat(),
        "followup_required": True,
        "followup_interval_days": 180  # 6 months
    }
    
    # Send request
    response = requests.post(f"{BASE_URL}/appointments/", json=appointment_data)
    
    # Check response
    if response.status_code == 200:
        appointment = response.json()
        print(f"Appointment created for patient {appointment['patient_id']}")
        print(f"Appointment ID: {appointment['id']}")
        return appointment['id']
    else:
        print(f"Failed to create appointment: {response.text}")
        return None

def test_update_appointment_status(appointment_id):
    """Test updating appointment status to trigger post-visit message"""
    print("\n=== Testing Appointment Status Update ===")
    
    # Update status to completed
    status_data = {
        "status": "completed"
    }
    
    # Send request
    response = requests.put(f"{BASE_URL}/appointments/{appointment_id}/status", json=status_data)
    
    # Check response
    if response.status_code == 200:
        print(f"Appointment {appointment_id} marked as completed")
        print("This should trigger a post-visit message")
        return True
    else:
        print(f"Failed to update appointment status: {response.text}")
        return False

def test_send_custom_message(patient_id, template_id):
    """Test sending a custom message"""
    print("\n=== Testing Custom Message Sending ===")
    
    # Create message data
    message_data = {
        "patient_id": patient_id,
        "template_id": template_id,
        "custom_variables": {
            "appointment_date": datetime.now().strftime("%B %d, %Y"),
            "last_appointment_date": (datetime.now() - timedelta(days=180)).strftime("%B %d, %Y")
        }
    }
    
    # Send request
    response = requests.post(f"{BASE_URL}/messages/send", json=message_data)
    
    # Check response
    if response.status_code == 200:
        result = response.json()
        print(f"Message sent with ID: {result['message_id']}")
        return result['message_id']
    else:
        print(f"Failed to send message: {response.text}")
        return None

def test_get_messages(patient_id=None):
    """Test retrieving messages"""
    print("\n=== Testing Message Retrieval ===")
    
    # Build URL
    url = f"{BASE_URL}/messages/"
    if patient_id:
        url += f"?patient_id={patient_id}"
    
    # Send request
    response = requests.get(url)
    
    # Check response
    if response.status_code == 200:
        messages = response.json()
        print(f"Retrieved {len(messages)} messages")
        for msg in messages:
            print(f"Message {msg['id']}: Type={msg['message_type']}, Status={msg['status']}")
        return messages
    else:
        print(f"Failed to retrieve messages: {response.text}")
        return []

def run_tests():
    """Run all tests"""
    print("Starting Dental Clinic Messaging Agent Tests")
    
    # Create patient
    patient_id = test_create_patient()
    if not patient_id:
        print("Cannot continue tests without patient")
        return
    
    # Create templates
    template_ids = test_create_template()
    if not template_ids:
        print("Cannot continue tests without templates")
        return
    
    # Create appointment
    appointment_id = test_create_appointment(patient_id)
    if not appointment_id:
        print("Cannot continue tests without appointment")
        return
    
    # Update appointment status
    if not test_update_appointment_status(appointment_id):
        print("Failed to update appointment status")
    
    # Send custom message
    if template_ids:
        test_send_custom_message(patient_id, template_ids[0])
    
    # Get messages
    test_get_messages(patient_id)
    
    print("\nTests completed!")

if __name__ == "__main__":
    run_tests()