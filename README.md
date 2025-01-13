# 🎯 AI Voice Chat Application

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/flask-3.0.0-green.svg)](https://flask.palletsprojects.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Overview

Real-time AI voice chat application using OpenAI's GPT-4, Flask, and WebRTC. Have natural conversations with AI and receive call summaries via email.

## ⭐ Key Features

- Real-time voice communication with AI
- Call duration tracking and summaries
- Email notifications for call records
- WebRTC for high-quality audio
- Responsive web interface

## 🏗️ Project Structure

```
ai-voice-chat/
├── src/
│   ├── static/
│   │   ├── css/
│   │   └── js/
|   |   └── assets/
│   ├── templates/
│   ├── app.py
│   └── .env.example
├── requirements.txt
└── README.md
```

## 📋 Prerequisites

- Python 3.8+
- OpenAI API key
- SMTP server access

## ⚡ Quick Start

```bash
# Clone repository
git clone https://github.com/muhammadusman93333/openai_realtime_api.git
cd openai_realtime_api
```
# Configure environment
copy .env.example .env
# Edit .env with your credentials
Example .env file
```
SMTP_HOST=your-smtp-host
SMTP_PORT=465
SMTP_USERNAME=your-email
SMTP_PASSWORD=your-password
RECEIVING_EMAIL=recipient-email
OPENAI_API_KEY=your-openai-key
```
# Setup virtual environment (Windows)
```
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
# Run application
python src/app.py
```



The application will be available at `http://127.0.0.1:5000/`.

Access: http://localhost:5000
📝 License
MIT License - See LICENSE

🤝 Contributing
Fork repository
Create feature branch
Commit changes
Push to branch
Open pull request
📞 Support
Issues: GitHub Issues
Email: info@uvisionpk.com
Documentation: Wiki
🌟 Keywords
ai voice chat, openai gpt-4, flask application, webrtc, real-time communication, python web app, voice assistant

Made with ❤️ by uvisionpk.com ```
