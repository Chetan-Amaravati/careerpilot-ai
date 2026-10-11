# 🚀 CareerPilot AI — Enterprise AI Career Acceleration Platform

[![Live Demo](https://img.shields.io/badge/Vercel-Live%20Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://careerpilot-ai-wine-xi.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-careerpilot--ai-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Chetan-Amaravati/careerpilot-ai)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB.svg?logo=python&logoColor=white)](https://www.python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%203.5%20Flash-4285F4.svg?logo=google&logoColor=white)](https://ai.google.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tests](https://img.shields.io/badge/Tests-18%20Passed-10B981.svg)](https://pytest.org)

> 🌐 **Live Web Application**: **[https://careerpilot-ai-wine-xi.vercel.app/](https://careerpilot-ai-wine-xi.vercel.app/)**
>
> **CareerPilot AI** is a production-ready, enterprise-grade SaaS career acceleration platform. Engineered with **FastAPI**, **React 19 (TypeScript)**, **PostgreSQL (SQLAlchemy 2.0)**, and **Google Gemini 3.5 Flash**, the system parses PDF resumes, conducts ATS gap analyses, builds structured study roadmaps, runs adaptive mock interviews, administers timed skill quizzes, and provides a full-featured AI Career Studio.

---

## 📑 Table of Contents

- [Key Capabilities](#-key-capabilities)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Platform Modules](#-platform-modules)
- [Quick Start Guide](#-quick-start-guide)
  - [Prerequisites](#1-prerequisites)
  - [Backend Setup](#2-backend-setup)
  - [Frontend Setup](#3-frontend-setup)
- [Automated Testing](#-automated-testing)
- [Administrative Workspace](#-administrative-workspace)
- [Production Deployment](#-production-deployment)
- [License](#-license)

---

## 🌟 Key Capabilities

* **📄 Multi-Version Resume Vault**: Upload PDF resumes parsed via PyMuPDF (`fitz`). Retain comprehensive version history, toggle active candidate profiles, and receive AI-curated optimization reviews (strengths, weaknesses, layout tips, and interactive click-to-copy action verbs).
* **⚖️ ATS Compatibility & Gap Analysis**: Match resumes against job titles and descriptions. Receive a 0–100% compatibility score alongside categorized matched vs. missing skills, plus 1-click test presets for industry leaders (*Stripe, Netflix, OpenAI*).
* **✨ Dedicated AI Career Studio**:
  * **⚡ ATS Bullet Rewriter**: Side-by-side Before/After diff cards that inject target ATS keywords into weak experience statements.
  * **✉️ Cover Letter Architect**: Generate professional, role-aligned cover letters with 1-click clipboard export.
  * **💼 LinkedIn Profile Optimizer**: Generate high-visibility headlines and narrative 'About' sections tailored to your skillset.
* **📚 Actionable Study Roadmaps**: Convert missing skills into actionable milestones (Courses, Projects, Certifications) and monitor completion statuses (`Pending` ➔ `In_Progress` ➔ `Completed`).
* **💬 Conversational Mock Interview Console**: Dynamic technical and behavioral interviews where follow-up questions adapt to previous candidate answers, completed with dual-axis scorecards (technical correctness and communication style).
* **🎯 Timed Quiz Arena**: 5-question technical quizzes targeting detected skill gaps with configurable difficulty, real-time timer countdown, answer explanations, and a global leaderboard.
* **📈 Rich Visualizations**: Zero-dependency SVG charts including competency Radar Charts, match history Line Charts, and prerequisite Trees.
* **🔐 Administrative Workspace**: Real-time aggregation of registered users, parsed resumes, match counts, quiz attempts, top missing skills across the candidate pool, and Gemini token usage estimation.

---

## 🏛️ System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CareerPilot AI Platform                         │
└────────────────────────────────────────────────────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
     ┌───────────────────────┐               ┌───────────────────────┐
     │   React 19 Frontend   │               │    FastAPI Backend    │
     │  (TypeScript + Vite)  │ ──[/api proxy]──►  (Python 3.13)      │
     │  Obsidian Dark System │               │  SQLAlchemy 2.0 + JWT │
     └───────────────────────┘               └───────────────────────┘
                 │                                       │
                 │                               ┌───────┴───────┐
                 ▼                               ▼               ▼
     ┌───────────────────────┐       ┌───────────────┐   ┌───────────────┐
     │  SVG Visualizations   │       │  PostgreSQL   │   │ Google Gemini │
     │  Radar / Line / Tree  │       │  (Port 5432)  │   │  3.5 Flash    │
     └───────────────────────┘       └───────────────┘   └───────────────┘
```

---

## 🛠️ Technology Stack

### Backend
| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | FastAPI (Python 3.13) | Asynchronous, high-performance web framework |
| **ORM & Database** | SQLAlchemy 2.0 & PostgreSQL | Declarative models, connection pooling, Alembic migrations |
| **Validation** | Pydantic v2 | Strict request/response schemas with email validation |
| **PDF Extraction** | PyMuPDF (`fitz`) | Fast, local PDF text and structural extraction |
| **Intelligence** | Google GenAI SDK | `gemini-3.5-flash` structured JSON schema generation |
| **Security** | PyJWT & bcrypt | RFC 7519 Bearer tokens with salted hash security |
| **Testing** | pytest & HTTPX | 18 automated unit and enterprise integration tests |

### Frontend
| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | React 19 (TypeScript) | Modern concurrent React architecture |
| **Tooling** | Vite 5.4 | Fast HMR development server & production bundler |
| **Design System** | Minimalist Obsidian Dark | Vanilla CSS with HSL variables, frosted glassmorphism |
| **Icons** | Lucide React | Clean, scalable icon system |
| **Charts** | Custom SVG Components | Lightweight Radar, Score Line, and Tree visualizations |

---

## ⚙️ Quick Start Guide

### 1. Prerequisites
* **Python**: 3.13+ installed.
* **Node.js**: v18+ with `npm`.
* **PostgreSQL**: Running locally on port `5432` with a database named `resume_analyzer`:
  ```sql
  CREATE DATABASE resume_analyzer;
  ```
* **Gemini API Key**: Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).

---

### 2. Backend Setup

1. Open your terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   * **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   * **macOS / Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables in `backend/.env`:
   ```env
   DATABASE_URL=postgresql://postgres:root@localhost:5432/resume_analyzer
   JWT_SECRET_KEY=supersecretjwtkeythatshouldbechangedinproduction12345!
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. Run database migrations:
   * **Windows**: `.\.venv\Scripts\alembic.exe upgrade head`
   * **macOS / Linux**: `alembic upgrade head`

6. Start the FastAPI development server:
   * **Windows**: `.\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000`
   * **macOS / Linux**: `uvicorn app.main:app --reload --port 8000`

FastAPI will be available at **[http://127.0.0.1:8000/](http://127.0.0.1:8000/)** and Swagger UI at **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**.

---

### 3. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser at **[http://localhost:5173/](http://localhost:5173/)**!

> **💡 Quick Demo Sign In**: On the login page, click the **"⚡ Autofill Demo Credentials"** button to immediately enter the platform without typing credentials.

---

## 🧪 Automated Testing

Execute the test suite verifying authentication, PDF parsing, skill matching, quiz scoring, and admin security:

### Windows (PowerShell)
```powershell
cd backend
.\.venv\Scripts\pytest.exe
```

### macOS / Linux
```bash
cd backend
pytest
```

**Results**: All **18 test cases** pass cleanly in ~11 seconds:
```text
tests/test_auth.py ......                     [ 33%]
tests/test_endpoints.py ....                  [ 55%]
tests/test_enterprise.py .....                [ 83%]
tests/test_pdf_parser.py ...                  [100%]
======================= 18 passed in 11.36s =======================
```

---

## 🔑 Administrative Workspace

To grant admin privileges to any user record and unlock the **Admin Panel** tab in the sidebar:

### Option A: Using the Seed Script
From the `backend` folder, run:
```powershell
.\.venv\Scripts\python.exe create_admin.py
```
This automatically provisions `admin@careerpilot.ai` with password `Admin123!` and `is_admin = True`.

### Option B: Using SQL
Execute this command on your PostgreSQL database:
```sql
UPDATE users SET is_admin = true WHERE email = 'your_account_email@example.com';
```

Log out and back in on the web client to view platform analytics, top missing skills, and estimated Gemini token usage!

---

## ☁️ Production Deployment

### 🌐 Live Production Web Application
* **Live Web App**: **[https://careerpilot-ai-wine-xi.vercel.app/](https://careerpilot-ai-wine-xi.vercel.app/)**
* **Deployment URL**: `https://careerpilot-rn97p9k82-chetan-portfolio.vercel.app/`
* **Hosting Platform**: Vercel (Edge Network)
* **Status**: 🟢 **Live & Production Ready**

### Frontend Setup on Vercel
The repository includes [vercel.json](frontend/vercel.json) and [public/_redirects](frontend/public/_redirects) for Single Page Application client-side routing.
1. Connect your repository to Vercel.
2. Set the Root Directory to `frontend`.
3. Configure optional environment variables:
   ```env
   VITE_API_URL=https://your-backend-api.onrender.com/api
   ```
4. Deploy!

### Backend (Render / Railway / Cloud Run)
The repository includes a ready-to-use [render.yaml](render.yaml) blueprint:
1. Connect the repository to [Render](https://render.com/).
2. Render will automatically configure the Python web service and managed PostgreSQL database.
3. Supply your `GEMINI_API_KEY` in the Environment tab.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
