from flask import Flask, jsonify, request, render_template
import requests
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('call.html')

@app.route('/session', methods=['GET'])
def get_session():
    try:
        url = "https://api.openai.com/v1/realtime/sessions"
        
        payload = {
            "model": "gpt-4o-realtime-preview-2024-12-17",
            "modalities": ["audio", "text"],
            "instructions": "You are a friendly assistant."
        }
        
        headers = {
            'Authorization': 'Bearer ' + os.getenv('OPENAI_API_KEY'),
            'Content-Type': 'application/json'
        }

        response = requests.post(url, json=payload, headers=headers)
        return response.json()

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/send-email', methods=['POST'])
def send_email():
    try:
        data = request.json
        msg = MIMEText(data['message'])
        msg['Subject'] = 'Call Summary'
        msg['From'] = os.getenv('SMTP_USERNAME')
        msg['To'] = os.getenv('RECEIVING_EMAIL')

        with smtplib.SMTP_SSL(
            host=os.getenv('SMTP_HOST'),
            port=int(os.getenv('SMTP_PORT')),
            timeout=10
        ) as server:
            server.login(
                os.getenv('SMTP_USERNAME'),
                os.getenv('SMTP_PASSWORD')
            )
            server.send_message(msg)
            
        return jsonify({
            'success': True, 
            'message': 'Email sent successfully'
        })

    except smtplib.SMTPConnectError:
        return jsonify({
            'error': 'Failed to connect to email server'
        }), 503
    except smtplib.SMTPAuthenticationError:
        return jsonify({
            'error': 'Email authentication failed'
        }), 401
    except Exception as e:
        return jsonify({
            'error': f"Email error: {str(e)}"
        }), 500


if __name__ == '__main__':
    app.run(debug=True)