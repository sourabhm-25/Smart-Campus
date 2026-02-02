# 🏫 Smart Campus


The primary aim of the **Smart Campus** project is to design and implement an AI-powered educational platform that enhances academic and administrative efficiency while providing personalized learning experiences. The system focuses on adaptive course recommendations, skill-aligned assessments, productivity enhancement, and real-time analytics to support students, faculty, and administrators in a data-driven and intelligent environment.

---
Install this before RUNNING your Project
```bash
#install in Frontend Folder
npm install lottie-react
#install in Backend Folder 
pip install -U langchain langchain-classic
```
---


## 🚀 How to Run the Project (CMD Instructions)

### 1️⃣ Install Backend Dependencies Globally

Open **Command Prompt (CMD)** and run:

```bash
pip install langchain langchain-community
```

```bash
pip install fastapi uvicorn chromadb sentence-transformers google-generativeai pickle5
```
---

### 2️⃣ Start the Backend

Run this command from anywhere (as long as you reference the correct path to your `main_backend_hybrid_cloud.py`):

```bash
uvicorn main:app --reload
```

The backend will be live at: [http://127.0.0.1:8000](http://127.0.0.1:8000)

---
## 🧠 AI Answer Evaluation System
This is a full-stack application designed to automate the grading of handwritten student answers. A teacher can select a question from a database, and a student can upload a photo of their handwritten answer. The system uses a powerful multimodal AI model (LLaVA) to read, transcribe, and grade the answer against the correct solution.

This project uniquely runs the expensive AI model locally for free, while the web application can be deployed to any cloud service.


## How It Works: The Hybrid AI Architecture
This project uses a hybrid architecture to provide powerful AI evaluation for free, bypassing expensive cloud GPU costs.

### Frontend (React):
The user interface (UI) that runs in the browser.

### Backend (FastAPI):
A lightweight server (can be deployed on Vercel/Render) that connects to the database and the AI.

### AI Model (Ollama + LLaVA):
The "brain" (LLaVA) is a large multimodal model that runs on your local computer using Ollama.

### Tunnel (Ngrok/Cloudflared):
A secure "tunnel" that connects your deployed backend to the AI model running on your local PC.

### Data Flow:
React App → FastAPI Backend → Ngrok Tunnel URL → Your Local PC → Ollama/LLaVA AI → (Response flows back)

### 💻 Tech Stack
Frontend: React, Vite, Axios

Backend: Python 3, FastAPI, Uvicorn

Database: MongoDB (using pymongo)

AI Engine (Local): Ollama

AI Model (Local): LLaVA (llava:latest)

Tunneling: Ngrok (or Cloudflared)

Async Requests: httpx (Python)

### ⚙️ Project Setup (Prerequisites)
Before you can run the project, you need to set up the four main components.

1. Backend (Python)
Navigate to the backend folder:

```bash
cd Backend
```
2. Install the required Python packages:
```bash
pip install "uvicorn[standard]" fastapi pymongo python-dotenv httpx
```
3.Local AI (Ollama)
Install Ollama: Download and install the application from ollama.com.

Run Ollama: Launch the Ollama application. It will run in the background.

Pull the AI Model: Open your terminal and pull the LLaVA model.
```bash
ollama pull llava
```
(This is a large, one-time download).

🚀 How to Run (Development Workflow)
To run this project, you must have 4 services running at the same time. We recommend using four separate terminal windows.


Terminal 1: Start the AI Tunnel (Ngrok)
This creates a public URL for your local AI server.
```bash
ngrok http 11434
```
Look at the output and copy the https URL. It will look something like: Forwarding https://9a1b-c3d4-e5f6.ngrok-free.app -> http://localhost:11434


Terminal 2: Update & Start the Backend (FastAPI)
1.Update the URL: Open the Backend/evaluation_service.py file.
2.Paste your ngrok URL from Terminal 1 into the OLLAMA_URL variable. Remember to add /api/chat at the end.

```Python

# Backend/evaluation_service.py

# ... (other code) ...

# Ollama server is running here (via ngrok Tunnel)
OLLAMA_URL = "https://9a1b-c3d4-e5f6.ngrok-free.app/api/chat"

# ... (rest of the file) ...
```


3.Save the file and run the backend server:
```bash
# Make sure you are in the Backend folder
uvicorn main:app --reload
```
Terminal 3: Start the Frontend (React)
```bash
# Make sure you are in the Frontend folder
npm run dev
```


Terminal 4: Check the AI Server (Ollama)
You don't need a terminal for this, just make sure the Ollama application is running in your background (in your menu bar or system tray).

You're all set! Open your browser to the http://localhost:5173 (or similar) URL shown in your frontend terminal to use the app.

### 3️⃣ Start the Frontend

1. Open a **new Command Prompt window**.
2. Go to your React folder:

   ```bash
   cd path\to\your\react\folder
   ```
3. Install dependencies:

   ```bash
   npm install
   ```
4. Run the app:

   ```bash
   npm run dev
   ```

   The frontend will be available at: [http://localhost:5173](http://localhost:5173)

---

### 4️⃣ Fix CORS (if needed)

If you see a CORS error in your browser, add this to your backend file **after importing FastAPI**:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🖥️ Access

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🙌 Contributing

Pull requests welcome! If you have ideas for improvements, feel free to open an issue or PR.

---
