# Defense Surveillance System

Real-time object detection surveillance system powered by YOLOv8 with JWT authentication.

## Features

- **Real-Time Object Detection** — YOLOv8-powered live video feed analysis via IP camera
- **User Authentication** — Register, login, logout with JWT (access + refresh tokens)
- **WebSocket Streaming** — Low-latency video frames with detection overlays
- **Defense-Themed UI** — Dark military-styled React frontend

## Tech Stack

- **Backend:** FastAPI, YOLOv8 (Ultralytics), OpenCV, JWT (python-jose), bcrypt
- **Frontend:** React 18, Vite, Tailwind CSS, Axios, React Router v6
- **Communication:** REST API + WebSocket

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### IP Camera

1. Install **IP Webcam** app on Android
2. Start the server in the app
3. Update `IP_CAM_URL` in `backend/.env` with your camera URL
