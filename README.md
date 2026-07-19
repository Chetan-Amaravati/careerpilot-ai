# 🚀 CareerPilot AI — Enterprise AI Career Acceleration Platform

**CareerPilot AI** is a premium, enterprise-grade SaaS platform designed to accelerate candidates' careers. Powered by **FastAPI**, **React (TypeScript)**, and **Google Gemini 3.5 Flash**, the application parses resume text, matches candidate profiles against target job descriptions, maps skill gaps, recommends roadmaps, conducts mock interviews, and runs custom technical quizzes.

---

## 🌟 Key Features

*   **📄 Multi-Version Resume Vault**: Upload and parse PDF resumes. Automatically track version histories, select active profiles, and receive AI-suggested optimization reviews (strengths, weaknesses, action verbs, and layout tips).
*   **⚖️ ATS Compatibility & Gap Analysis**: Match active resumes against job requirements to calculate compatibility scores and identify matched versus missing skills.
*   **📚 Actionable Study Roadmaps**: Receive personalized learning paths containing recommended courses, certifications, project ideas, and track weekly goals.
*   **💬 Conversational Mock Interview Console**: Conduct technical or HR mock interviews. Type responses to context-aware questions, receive instant analysis, and view overall scorecards graded on technical correctness and communication style.
*   **🎯 Timed Quiz Arena**: Test your gap knowledge with AI-generated multiple-choice questions. Select difficulties, beat the visual timer, check answer explanations, and view top scores on the Leaderboard.
*   **🛠️ AI Enhancers**: Tailor cover letters, optimize LinkedIn headers/summaries, and rewrite weak experience bullet points using target ATS keywords.
*   **📈 Rich Visualizations**: Visualize candidate profiles with custom SVG Radar Charts (skill competencies), score histories (line charts), and skill prerequisite trees.
*   **🔐 Administrative Workspace**: Monitor total registered users, resume metrics, high-demand skills, and estimated AI token usage metrics.

---

## 🛠️ Technology Stack

### Backend
*   **Core Framework**: FastAPI (Python 3.13)
*   **ORM / Database**: SQLAlchemy 2.0 & PostgreSQL
*   **Schema Validation**: Pydantic v2 (with email-validator)
*   **Migrations Manager**: Alembic
*   **Text Extraction**: PyMuPDF (fitz)
*   **AI SDK**: Google GenAI (Gemini 3.5 Flash)
*   **Testing Suite**: pytest & HTTPX client

### Frontend
*   **Core UI**: React 19 (TypeScript)
*   **Bundler**: Vite
*   **Styling**: Vanilla CSS (HSL variables, glassmorphic dark/light mode toggle)
*   **Icons**: Lucide React
*   **Charts**: Custom lightweight SVG charts (Radar, Line, Trees) for loading performance.

---

## ⚙️ Getting Started Locally

### 1. Prerequisite Connections
*   Ensure **PostgreSQL** is running locally on port `5432` with a database named `resume_analyzer`.
*   Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).

### 2. Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    .venv\Scripts\pip.exe install -r requirements.txt
    ```
3.  Configure environment variables in `.env`:
    ```env
    DATABASE_URL=postgresql://postgres:root@localhost:5432/resume_analyzer
    JWT_SECRET_KEY=your_super_secret_key_here
    GEMINI_API_KEY=AIzaSy...your_gemini_key...
    ```
4.  Run database migrations:
    ```bash
    .venv\Scripts\alembic upgrade head
    ```
5.  Start the FastAPI server:
    ```bash
    .venv\Scripts\uvicorn app.main:app --reload
    ```

### 3. Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd ../frontend
    ```
2.  Install packages (using legacy peer-deps to support Vite v8):
    ```bash
    npm install --legacy-peer-deps
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open **[http://localhost:5173/](http://localhost:5173/)** in your browser!

---

## 🧪 Running Automated Tests
Run backend unit-test files (testing Auth, PDF parser, Analysis matches, Quiz scoring, Mock interviews, and Admin panel constraints):
```bash
cd backend
.venv\Scripts\pytest
```

---

## 🔑 Unlocking Admin Status
To unlock the secure Admin Panel tab in the Sidebar, run this SQL command on your PostgreSQL database to grant admin privileges to your user record:
```sql
UPDATE users SET is_admin = true WHERE email = 'your_account_email@example.com';
```
*(Once done, log out and log back in on the web client to load the administrative stats!)*
