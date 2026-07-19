import React, { useState, useEffect } from 'react'
import { 
  BarChart2, FileText, CheckCircle, AlertTriangle, Play, BookOpen, 
  GraduationCap, Code, LogOut, Loader, Award, RefreshCw, Layers, 
  User as UserIcon, Settings, MessageSquare, Bell, Moon, Sun, Shield, 
  Briefcase, Plus, Trash2, Calendar, Target, Clock, ArrowRight, Star, ExternalLink
} from 'lucide-react'

// Custom Visualizations
import RadarChart from './components/visualization/RadarChart'
import HistoryChart from './components/visualization/HistoryChart'
import SkillTree from './components/visualization/SkillTree'

const API_URL = '/api'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning'
}

export default function App() {
  // Authentication & Theme
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [user, setUser] = useState<any>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  
  // Navigation
  const [activeView, setActiveView] = useState<string>('dashboard')
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login')
  
  // Core Business Data
  const [resumes, setResumes] = useState<any[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null)
  const [savedJobs, setSavedJobs] = useState<any[]>([])
  const [analyses, setAnalyses] = useState<any[]>([])
  const [learningProgress, setLearningProgress] = useState<any[]>([])
  const [learningStats, setLearningStats] = useState<any>({ total_items: 0, completed_items: 0, completion_rate: 0 })
  const [notifications, setNotifications] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [weakTopics, setWeakTopics] = useState<any>({ weak_topics: [] })
  
  // Interactive Flows
  // 1. Uploading
  const [uploading, setUploading] = useState(false)
  // 2. Matching
  const [matching, setMatching] = useState(false)
  const [jobTitle, setJobTitle] = useState('')
  const [jobCompany, setJobCompany] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [activeAnalysis, setActiveAnalysis] = useState<any>(null)
  
  // 3. Cover Letter & LinkedIn
  const [generatingLetter, setGeneratingLetter] = useState(false)
  const [coverLetter, setCoverLetter] = useState<any>(null)
  const [generatingLinkedIn, setGeneratingLinkedIn] = useState(false)
  const [linkedInTips, setLinkedInTips] = useState<any>(null)
  const [selectedBullet, setSelectedBullet] = useState('')
  const [targetRewriteJD, setTargetRewriteJD] = useState('')
  const [rewritingBullet, setRewritingBullet] = useState(false)
  const [rewrittenBulletResult, setRewrittenBulletResult] = useState<any>(null)
  
  // 4. Timed Quiz Arena
  const [quizDifficulty, setQuizDifficulty] = useState('Medium')
  const [quizTimeLimit, setQuizTimeLimit] = useState(600)
  const [activeAssessment, setActiveAssessment] = useState<any>(null)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({})
  const [activeAttempt, setActiveAttempt] = useState<any>(null)
  const [submittingQuiz, setSubmittingQuiz] = useState(false)
  const [generatingQuiz, setGeneratingQuiz] = useState(false)
  
  // 5. Mock Interview Preparation
  const [interviewJobTitle, setInterviewJobTitle] = useState('')
  const [interviewType, setInterviewType] = useState('Technical')
  const [startingInterview, setStartingInterview] = useState(false)
  const [activeInterview, setActiveInterview] = useState<any>(null)
  const [activeQuestion, setActiveQuestion] = useState<any>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [submittingAnswer, setSubmittingAnswer] = useState(false)
  const [finalizingInterview, setFinalizingInterview] = useState(false)
  const [interviewResult, setInterviewResult] = useState<any>(null)
  const [interviewHistory, setInterviewHistory] = useState<any[]>([])
  
  // 6. Profile Form
  const [profileName, setProfileName] = useState('')
  const [profileGoals, setProfileGoals] = useState('Build a strong portfolio and land a Senior backend role')
  const [profileTargetSalary, setProfileTargetSalary] = useState('120,000')
  const [profileRoles, setProfileRoles] = useState('Backend Developer, DevOps')
  const [profileLocations, setProfileLocations] = useState('Remote, London')
  const [profileLevel, setProfileLevel] = useState('Mid')
  const [updatingProfile, setUpdatingProfile] = useState(false)

  // 7. Custom Learning Item
  const [customItemTitle, setCustomItemTitle] = useState('')
  const [customItemType, setCustomItemType] = useState('Course')
  const [customItemLink, setCustomItemLink] = useState('')
  const [customItemWeekly, setCustomItemWeekly] = useState(false)
  
  // 8. Admin metrics
  const [adminStats, setAdminStats] = useState<any>(null)

  // System UI States
  const [toasts, setToasts] = useState<Toast[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    const doc = document.documentElement
    if (nextTheme === 'light') {
      doc.classList.add('light-theme')
    } else {
      doc.classList.remove('light-theme')
    }
  }

  // Helper: Trigger Toast
  const triggerToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const newToast: Toast = { id: Math.random().toString(), message, type }
    setToasts(prev => [...prev, newToast])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id))
    }, 4000)
  }

  // 1. Fetch profile & seed database data on load
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
      fetchUserProfile()
    } else {
      localStorage.removeItem('token')
      setUser(null)
      setActiveView('auth')
    }
  }, [token])

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const userData = await res.json()
        setUser(userData)
        setProfileName(userData.full_name || '')
        if (userData.career_goals) {
          setProfileGoals(userData.career_goals.goals || '')
          setProfileTargetSalary(userData.career_goals.target_salary || '')
        }
        if (userData.preferred_roles) {
          setProfileRoles(userData.preferred_roles.join(', '))
        }
        if (userData.preferred_locations) {
          setProfileLocations(userData.preferred_locations.join(', '))
        }
        setProfileLevel(userData.experience_level || 'Mid')

        // Fetch core content
        fetchResumes()
        fetchSavedJobs()
        fetchMatchHistory()
        fetchLearningProgress()
        fetchNotifications()
        fetchLeaderboard()
        fetchWeakTopics()
        fetchInterviewHistory()
        
        // Trigger smart reminders
        fetch(`${API_URL}/notifications/trigger-reminders`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        })

        if (userData.is_admin) {
          fetchAdminStats()
        }
      } else {
        setToken(null)
      }
    } catch (err) {
      setToken(null)
    }
  }

  // Fetch Lists
  const fetchResumes = async () => {
    try {
      const res = await fetch(`${API_URL}/resumes/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setResumes(data)
        const active = data.find((r: any) => r.is_active)
        if (active) {
          setSelectedResumeId(active.id)
        } else if (data.length > 0) {
          setSelectedResumeId(data[0].id)
        }
      }
    } catch (err) {}
  }

  const fetchSavedJobs = async () => {
    try {
      const res = await fetch(`${API_URL}/analysis/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setSavedJobs(await res.json())
    } catch (err) {}
  }

  const fetchMatchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/analysis/history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setAnalyses(await res.json())
    } catch (err) {}
  }

  const fetchLearningProgress = async () => {
    try {
      const res = await fetch(`${API_URL}/learning/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const progress = await res.json()
        setLearningProgress(progress)
      }
      const statsRes = await fetch(`${API_URL}/learning/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (statsRes.ok) setLearningStats(await statsRes.json())
    } catch (err) {}
  }

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/notifications/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setNotifications(await res.json())
    } catch (err) {}
  }

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_URL}/assessments/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setLeaderboard(await res.json())
    } catch (err) {}
  }

  const fetchWeakTopics = async () => {
    try {
      const res = await fetch(`${API_URL}/assessments/weak-topics`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setWeakTopics(await res.json())
    } catch (err) {}
  }

  const fetchInterviewHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/interviews/history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setInterviewHistory(await res.json())
    } catch (err) {}
  }

  const fetchAdminStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setAdminStats(await res.json())
    } catch (err) {}
  }

  // Handle Authentication
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      })
      if (res.ok) {
        const data = await res.json()
        setToken(data.access_token)
        triggerToast('Welcome back to CareerPilot AI!', 'success')
      } else {
        triggerToast('Invalid email or password.', 'error')
      }
    } catch (err) {
      triggerToast('Connection to server failed.', 'error')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName })
      })
      if (res.ok) {
        triggerToast('Account created successfully! Please log in.', 'success')
        setAuthTab('login')
        setPassword('')
      } else {
        const data = await res.json()
        triggerToast(data.detail || 'Registration failed.', 'error')
      }
    } catch (err) {
      triggerToast('Connection to server failed.', 'error')
    }
  }

  // Handle Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_URL}/resumes/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      if (res.ok) {
        const data = await res.json()
        triggerToast('Resume uploaded, versioned, and optimized!', 'success')
        fetchResumes()
        fetchNotifications()
      } else {
        triggerToast('Failed to parse resume. Check Gemini key config.', 'error')
      }
    } catch (err) {
      triggerToast('Error during upload.', 'error')
    } finally {
      setUploading(false)
    }
  }

  // Handle Set Active Resume Version
  const handleSetActiveVersion = async (resumeId: number) => {
    try {
      const res = await fetch(`${API_URL}/resumes/${resumeId}/set-active`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        triggerToast('Active resume version updated.', 'success')
        fetchResumes()
      }
    } catch (err) {}
  }

  // Handle Gap Matching
  const handleMatchAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedResumeId) {
      triggerToast('Please upload a resume first.', 'warning')
      return
    }
    setMatching(true)

    try {
      const res = await fetch(`${API_URL}/analysis/match`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          resume_id: selectedResumeId,
          job_title: jobTitle,
          job_description_text: jobDescription
        })
      })

      if (res.ok) {
        const data = await res.json()
        setActiveAnalysis(data)
        triggerToast('Skill gap match completed!', 'success')
        fetchSavedJobs()
        fetchMatchHistory()
        fetchLearningProgress()
        setActiveView('matcher') // switch view or show modal
      } else {
        triggerToast('Matching analysis failed.', 'error')
      }
    } catch (err) {
      triggerToast('Connection error during matching.', 'error')
    } finally {
      setMatching(false)
    }
  }

  // Saved Jobs Removal
  const handleDeleteJob = async (jobId: number) => {
    try {
      const res = await fetch(`${API_URL}/analysis/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        triggerToast('Job removed from saved listings.', 'success')
        fetchSavedJobs()
      }
    } catch (err) {}
  }

  // Generate Tailored Cover Letter
  const handleGenerateCoverLetter = async () => {
    if (!selectedResumeId || !activeAnalysis) return
    setGeneratingLetter(true)
    setCoverLetter(null)

    try {
      const res = await fetch(`${API_URL}/resumes/${selectedResumeId}/cover-letter?company=${encodeURIComponent(jobCompany || '')}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(jobDescription)
      })

      if (res.ok) {
        setCoverLetter(await res.json())
        triggerToast('Personalized cover letter generated!', 'success')
      } else {
        triggerToast('Cover letter generation failed.', 'error')
      }
    } catch (err) {
      triggerToast('Connection error.', 'error')
    } finally {
      setGeneratingLetter(false)
    }
  }

  // Tailor LinkedIn
  const handleOptimizeLinkedIn = async () => {
    if (!selectedResumeId) return
    setGeneratingLinkedIn(true)
    setLinkedInTips(null)

    try {
      const res = await fetch(`${API_URL}/resumes/${selectedResumeId}/linkedin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        setLinkedInTips(await res.json())
        triggerToast('LinkedIn suggestions compiled!', 'success')
      } else {
        triggerToast('LinkedIn optimization failed.', 'error')
      }
    } catch (err) {
      triggerToast('Connection error.', 'error')
    } finally {
      setGeneratingLinkedIn(false)
    }
  }

  // Rewrite bullet points
  const handleRewriteBullet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedResumeId || !selectedBullet || !targetRewriteJD) return
    setRewritingBullet(true)
    setRewrittenBulletResult(null)

    try {
      const res = await fetch(`${API_URL}/resumes/${selectedResumeId}/rewrite-bullet?bullet_text=${encodeURIComponent(selectedBullet)}&target_jd=${encodeURIComponent(targetRewriteJD)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        setRewrittenBulletResult(await res.json())
        triggerToast('Resume bullet point optimized!', 'success')
      } else {
        triggerToast('Bullet rewrite failed.', 'error')
      }
    } catch (err) {
      triggerToast('Connection error.', 'error')
    } finally {
      setRewritingBullet(false)
    }
  }

  // Quiz Generation
  const handleStartQuiz = async (analysisId: number) => {
    setGeneratingQuiz(true)
    setActiveAssessment(null)
    setActiveAttempt(null)

    try {
      const res = await fetch(`${API_URL}/assessments/generate/${analysisId}?difficulty=${quizDifficulty}&time_limit=${quizTimeLimit}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        setActiveAssessment(await res.json())
        setQuizAnswers({})
        triggerToast('Quiz generated. Start when ready!', 'success')
      } else {
        triggerToast('Failed to build quiz.', 'error')
      }
    } catch (err) {
      triggerToast('Connection error.', 'error')
    } finally {
      setGeneratingQuiz(false)
    }
  }

  // Submit Quiz Answers
  const handleSubmitQuiz = async () => {
    if (!activeAssessment) return
    const unanswered = activeAssessment.questions.filter((q: any) => !quizAnswers[q.id])
    if (unanswered.length > 0) {
      triggerToast(`Answer all questions. (${unanswered.length} left)`, 'warning')
      return
    }
    setSubmittingQuiz(true)

    const answersPayload = Object.entries(quizAnswers).map(([qId, ans]) => ({
      question_id: parseInt(qId),
      selected_option: ans
    }))

    try {
      const res = await fetch(`${API_URL}/assessments/${activeAssessment.id}/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answers: answersPayload })
      })

      if (res.ok) {
        setActiveAttempt(await res.json())
        triggerToast('Quiz graded!', 'success')
        fetchLeaderboard()
        fetchWeakTopics()
      } else {
        triggerToast('Quiz submission failed.', 'error')
      }
    } catch (err) {
      triggerToast('Connection error.', 'error')
    } finally {
      setSubmittingQuiz(false)
    }
  }

  // Mock Interview Start
  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!interviewJobTitle) {
      triggerToast('Please provide a job title.', 'warning')
      return
    }
    setStartingInterview(true)
    setActiveInterview(null)
    setInterviewResult(null)

    try {
      const res = await fetch(`${API_URL}/interviews/start`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          job_title: interviewJobTitle,
          type: interviewType
        })
      })

      if (res.ok) {
        const attempt = await res.json()
        setActiveInterview(attempt)
        if (attempt.questions && attempt.questions.length > 0) {
          setActiveQuestion(attempt.questions[0])
        }
        setUserAnswer('')
        triggerToast('Interview started. Here is question #1!', 'success')
      } else {
        triggerToast('Failed to start interview.', 'error')
      }
    } catch (err) {
      triggerToast('Connection error.', 'error')
    } finally {
      setStartingInterview(false)
    }
  }

  // Mock Interview Submit Question Answer
  const handleSendInterviewAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userAnswer || !activeQuestion || !activeInterview) return
    setSubmittingAnswer(true)

    try {
      const res = await fetch(`${API_URL}/interviews/${activeInterview.id}/submit-answer`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          question_id: activeQuestion.id,
          user_answer: userAnswer
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.completed) {
          // Trigger final grading
          handleFinalizeInterview(activeInterview.id)
        } else {
          setActiveQuestion(data.next_question)
          setUserAnswer('')
          triggerToast('Answer saved. Loading next question...', 'success')
        }
      } else {
        triggerToast('Answer submission failed.', 'error')
      }
    } catch (err) {
      triggerToast('Connection error.', 'error')
    } finally {
      setSubmittingAnswer(false)
    }
  }

  // Interview Final Evaluation
  const handleFinalizeInterview = async (interviewId: number) => {
    setFinalizingInterview(true)
    try {
      const res = await fetch(`${API_URL}/interviews/${interviewId}/finalize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setInterviewResult(await res.json())
        triggerToast('Mock interview finalized & graded!', 'success')
        fetchInterviewHistory()
      } else {
        triggerToast('Evaluation failed.', 'error')
      }
    } catch (err) {
      triggerToast('Connection error.', 'error')
    } finally {
      setFinalizingInterview(false)
      setActiveInterview(null)
      setActiveQuestion(null)
    }
  }

  // Profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingProfile(true)

    const payload = {
      full_name: profileName,
      experience_level: profileLevel,
      preferred_roles: profileRoles.split(',').map(s => s.trim()),
      preferred_locations: profileLocations.split(',').map(s => s.trim()),
      career_goals: { goals: profileGoals, target_salary: profileTargetSalary }
    }

    try {
      const res = await fetch(`${API_URL}/profile/`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        triggerToast('Career profile updated!', 'success')
        fetchUserProfile()
      } else {
        triggerToast('Failed to update profile.', 'error')
      }
    } catch (err) {
      triggerToast('Connection error.', 'error')
    } finally {
      setUpdatingProfile(false)
    }
  }

  // Add Custom Learning path milestone
  const handleAddLearningItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customItemTitle) return

    try {
      const res = await fetch(`${API_URL}/learning/items`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          item_type: customItemType,
          item_title: customItemTitle,
          item_link: customItemLink || null,
          weekly_goal: customItemWeekly
        })
      })

      if (res.ok) {
        triggerToast('Milestone added!', 'success')
        setCustomItemTitle('')
        setCustomItemLink('')
        setCustomItemWeekly(false)
        fetchLearningProgress()
      }
    } catch (err) {}
  }

  // Complete / Progress learning item
  const handleToggleLearningStatus = async (itemId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'Completed' ? 'Pending' : currentStatus === 'Pending' ? 'In_Progress' : 'Completed'
    try {
      const res = await fetch(`${API_URL}/learning/items/${itemId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      })
      if (res.ok) {
        triggerToast(`Milestone marked as ${nextStatus}!`, 'success')
        fetchLearningProgress()
      }
    } catch (err) {}
  }

  // Handle Mark Notifications as Read
  const handleMarkNotificationRead = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        fetchNotifications()
      }
    } catch (err) {}
  }

  // Logout
  const handleLogout = () => {
    setToken(null)
    localStorage.removeItem('token')
    triggerToast('Logged out successfully.', 'info')
  }

  // Compute Career Readiness score
  const avgATS = analyses.length > 0 ? analyses.reduce((sum, a) => sum + a.matching_score, 0) / analyses.length : 70
  const avgQuiz = leaderboard.find(l => l.name === (user?.full_name || user?.email))?.score || 50
  const readinessScore = Math.min(100, Math.round((avgATS * 0.6) + (avgQuiz * 0.4)))

  return (
    <div className="app-layout">
      {/* Toast Popups */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast" style={{
            borderLeft: t.type === 'error' ? '4px solid var(--danger)' : t.type === 'warning' ? '4px solid var(--warning)' : '4px solid var(--success)'
          }}>
            {t.type === 'error' ? <AlertTriangle size={16} color="var(--danger)" /> : <CheckCircle size={16} color="var(--success)" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* ------------------- SIDEBAR NAVIGATION ------------------- */}
      {token && user && (
        <aside className="sidebar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', padding: '0 8px' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Briefcase size={18} color="#fff" />
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }} className="gradient-text">
              CareerPilot AI
            </h2>
          </div>

          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div className={`sidebar-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
              <BarChart2 size={18} /> Dashboard
            </div>
            <div className={`sidebar-item ${activeView === 'resumes' ? 'active' : ''}`} onClick={() => setActiveView('resumes')}>
              <FileText size={18} /> Resume Vault
            </div>
            <div className={`sidebar-item ${activeView === 'matcher' ? 'active' : ''}`} onClick={() => setActiveView('matcher')}>
              <Target size={18} /> Job Matcher
            </div>
            <div className={`sidebar-item ${activeView === 'skills' ? 'active' : ''}`} onClick={() => setActiveView('skills')}>
              <Layers size={18} /> Skill Analytics
            </div>
            <div className={`sidebar-item ${activeView === 'learning' ? 'active' : ''}`} onClick={() => setActiveView('learning')}>
              <BookOpen size={18} /> Study Roadmap
            </div>
            <div className={`sidebar-item ${activeView === 'interview' ? 'active' : ''}`} onClick={() => setActiveView('interview')}>
              <MessageSquare size={18} /> Mock Interviews
            </div>
            <div className={`sidebar-item ${activeView === 'quiz' ? 'active' : ''}`} onClick={() => setActiveView('quiz')}>
              <Award size={18} /> Quiz Arena
            </div>
            <div className={`sidebar-item ${activeView === 'profile' ? 'active' : ''}`} onClick={() => setActiveView('profile')}>
              <UserIcon size={18} /> Profile
            </div>
            {user.is_admin && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <div className={`sidebar-item ${activeView === 'admin' ? 'active' : ''}`} onClick={() => setActiveView('admin')}>
                  <Shield size={18} color="var(--secondary)" /> Admin Panel
                </div>
              </div>
            )}
          </nav>

          {/* Theme & Logout Footer */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={toggleTheme} style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px' }}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
            </button>
            <button className="btn btn-secondary" onClick={handleLogout} style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px', color: 'var(--danger)' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </aside>
      )}

      {/* ------------------- MAIN CONTAINER ------------------- */}
      <main className="main-content-area" style={{ marginLeft: token ? '250px' : '0' }}>
        
        {/* Header alert indicator */}
        {token && user && notifications.filter(n => !n.is_read).length > 0 && (
          <div className="glass-panel" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', background: 'rgba(99, 102, 241, 0.06)', borderColor: 'rgba(99,102,241,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
              <Bell size={16} color="var(--primary)" className="spin" />
              <span>You have <strong>{notifications.filter(n => !n.is_read).length}</strong> unread smart notifications.</span>
            </div>
            <button className="btn btn-secondary" onClick={() => setActiveView('profile')} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
              View Alerts
            </button>
          </div>
        )}

        {/* -------------------- VIEW: AUTHENTICATION -------------------- */}
        {!token && (
          <div style={{ maxWidth: '420px', margin: '80px auto' }}>
            <div className="glass-panel" style={{ padding: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}>
                <Briefcase size={28} color="var(--primary)" />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }} className="gradient-text">CareerPilot AI</h2>
              </div>

              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
                <button 
                  style={{
                    flex: 1, padding: '12px', border: 'none', background: 'none', cursor: 'pointer',
                    color: authTab === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 700, borderBottom: authTab === 'login' ? '2px solid var(--primary)' : 'none'
                  }}
                  onClick={() => setAuthTab('login')}
                >
                  Sign In
                </button>
                <button 
                  style={{
                    flex: 1, padding: '12px', border: 'none', background: 'none', cursor: 'pointer',
                    color: authTab === 'signup' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 700, borderBottom: authTab === 'signup' ? '2px solid var(--primary)' : 'none'
                  }}
                  onClick={() => setAuthTab('signup')}
                >
                  Create Account
                </button>
              </div>

              {authTab === 'login' ? (
                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
                  </div>
                  <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '10px' }}>
                    Sign In to Platform
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Doe" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" />
                  </div>
                  <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '10px' }}>
                    Start For Free
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* -------------------- VIEW: DASHBOARD -------------------- */}
        {token && user && activeView === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Welcome back, {user.full_name || 'Pilot'} 👋</h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Track your ATS readiness and skill growth pathways.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={fetchUserProfile}>
                  <RefreshCw size={16} /> Sync Profile
                </button>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Readiness Score</span>
                  <Target size={18} color="var(--primary)" />
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: readinessScore > 75 ? 'var(--success)' : 'var(--warning)' }}>{readinessScore}%</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weighted ATS + Quiz</span>
              </div>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Active Resumes</span>
                  <FileText size={18} color="var(--secondary)" />
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{resumes.length} versions</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{resumes.filter(r => r.is_active).length} Active marker</span>
              </div>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Roadmap Progress</span>
                  <BookOpen size={18} color="var(--accent)" />
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{Math.round(learningStats.completion_rate)}%</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{learningStats.completed_items}/{learningStats.total_items} Complete</span>
              </div>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Mock Interviews</span>
                  <MessageSquare size={18} color="var(--success)" />
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{interviewHistory.length} completed</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average score: {interviewHistory.length > 0 ? Math.round(interviewHistory.reduce((s,i)=>s+i.score,0)/interviewHistory.length) : 0}%</span>
              </div>
            </div>

            {/* Visual Analytics Rows */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginBottom: '32px' }}>
              <div className="glass-panel" style={{ padding: '28px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>ATS Match Score History</h3>
                <HistoryChart history={analyses.slice(0, 5).reverse().map(a => ({
                  date: new Date(a.created_at).toLocaleDateString(undefined, {month:'short', day:'numeric'}),
                  score: a.matching_score,
                  role: 'Score'
                }))} />
              </div>

              {/* Weekly Goals Tracker */}
              <div className="glass-panel" style={{ padding: '28px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Weekly Learning Goals</h3>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '160px' }}>
                  <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '12px' }}>
                    {/* SVG Progress Ring */}
                    <svg width="100" height="100">
                      <circle cx="50" cy="50" r="40" stroke="var(--border-color)" strokeWidth="8" fill="none" />
                      <circle cx="50" cy="50" r="40" stroke="var(--accent)" strokeWidth="8" fill="none"
                        strokeDasharray="251"
                        strokeDashoffset={251 - (251 * (learningStats.weekly_goals_completed || 0)) / Math.max(1, learningStats.weekly_goals_total || 1)}
                        transform="rotate(-90 50 50)"
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{learningStats.weekly_goals_completed || 0}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>/ {learningStats.weekly_goals_total || 0}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Completed this week</p>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="glass-panel" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Recent Performance Activities</h3>
              {analyses.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent activities. Upload your resume and match a job to begin!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {analyses.slice(0, 3).map((a: any) => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                      <div>
                        <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>ATS Match assessment executed</p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Score: {a.matching_score}% • {new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                      <button className="btn btn-secondary" onClick={() => { setActiveAnalysis(a); setActiveView('matcher'); }} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------- VIEW: RESUME VAULT -------------------- */}
        {token && user && activeView === 'resumes' && (
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '24px' }}>Resume Vault & Versioning</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
              
              {/* Left Column: Version list */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>Upload & Versions</h3>
                
                {/* Upload drag-n-drop */}
                <div style={{
                  border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '24px',
                  cursor: 'pointer', background: 'rgba(0,0,0,0.1)', position: 'relative'
                }}>
                  <input type="file" accept=".pdf" onChange={handleFileUpload} disabled={uploading} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                  <Plus size={24} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
                  <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{uploading ? 'Analyzing Resume...' : 'Upload new version (PDF)'}</p>
                </div>

                {/* List versions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {resumes.map(r => (
                    <div key={r.id} style={{
                      padding: '12px', borderRadius: '8px', border: '1px solid',
                      borderColor: r.is_active ? 'var(--primary)' : 'var(--border-color)',
                      background: r.is_active ? 'rgba(99,102,241,0.06)' : 'none',
                      cursor: 'pointer'
                    }} onClick={() => handleSetActiveVersion(r.id)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Version {r.version}</span>
                        {r.is_active && <span style={{ fontSize: '0.65rem', background: 'var(--primary)', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>Active</span>}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace:'nowrap', marginTop: '4px' }}>{r.filename}</p>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Parsed on: {new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: AI Suggestions and optimizations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* AI Resume Review Cards */}
                {resumes.length > 0 ? (
                  (() => {
                    const activeResume = resumes.find(r => r.is_active) || resumes[0]
                    const suggestions = activeResume.optimization_suggestions || { strengths: [], weaknesses: [], formatting_tips: [], action_verb_suggestions: [] }
                    
                    return (
                      <div className="glass-panel" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                          <div>
                            <h3 style={{ fontSize: '1.2rem' }}>AI Optimization Review</h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reviewing: {activeResume.filename} (v{activeResume.version})</span>
                          </div>
                          <Award size={24} style={{ color: 'var(--secondary)' }} />
                        </div>

                        {/* Strengths & Weaknesses side-by-side */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                          <div>
                            <h4 style={{ fontSize: '0.9rem', color: 'var(--success)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <CheckCircle size={16} /> Resume Strengths
                            </h4>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {suggestions.strengths?.map((s: string, idx: number) => (
                                <li key={idx}>{s}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 style={{ fontSize: '0.9rem', color: 'var(--danger)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <AlertTriangle size={16} /> Resume Weaknesses
                            </h4>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {suggestions.weaknesses?.map((w: string, idx: number) => (
                                <li key={idx}>{w}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Formatting & Verbs */}
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                          <div>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Layout & Format Tips</h4>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {suggestions.formatting_tips?.map((f: string, idx: number) => (
                                <li key={idx}>{f}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Strong Action Verbs</h4>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {suggestions.action_verb_suggestions?.map((av: string, idx: number) => (
                                <li key={idx}>{av}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* LinkedIn Optimizations Trigger */}
                        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '24px', paddingTop: '20px', display: 'flex', gap: '16px' }}>
                          <button className="btn btn-accent" onClick={handleOptimizeLinkedIn} disabled={generatingLinkedIn} style={{ flex: 1 }}>
                            {generatingLinkedIn ? 'Optimizing LinkedIn...' : 'Tailor LinkedIn Profile'}
                          </button>
                        </div>

                        {/* LinkedIn Suggestions Area */}
                        {linkedInTips && (
                          <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(0,0,0,0.15)', borderRadius: '10px', borderLeft: '4px solid var(--secondary)' }}>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Suggested LinkedIn Headline:</h4>
                            <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#fff', marginBottom: '16px' }}>"{linkedInTips.headline}"</p>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Suggested About Summary:</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{linkedInTips.about_summary}</p>
                          </div>
                        )}
                      </div>
                    )
                  })()
                ) : (
                  <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No resumes uploaded. Upload a PDF version to see AI suggestions.
                  </div>
                )}

                {/* Bullet point rewriter widget */}
                {resumes.length > 0 && (
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '16px' }}>AI Resume Bullet Rewriter</h3>
                    <form onSubmit={handleRewriteBullet}>
                      <div className="form-group">
                        <label className="form-label">Original bullet point</label>
                        <input className="form-input" type="text" value={selectedBullet} onChange={e => setSelectedBullet(e.target.value)} required placeholder="e.g. Worked on database optimization and python coding." />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Target Job Requirements Keywords</label>
                        <input className="form-input" type="text" value={targetRewriteJD} onChange={e => setTargetRewriteJD(e.target.value)} required placeholder="e.g. FastAPI, SQLAlchemy ORM, database indexing, pytest" />
                      </div>
                      <button className="btn btn-primary" type="submit" disabled={rewritingBullet}>
                        {rewritingBullet ? 'Rewriting with AI...' : 'Optimize Bullet'}
                      </button>
                    </form>

                    {rewrittenBulletResult && (
                      <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}><strong>Original:</strong> {rewrittenBulletResult.original_bullet}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--success)', marginTop: '8px' }}><strong>Rewritten Bullet:</strong> {rewrittenBulletResult.rewritten_bullet}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>{rewrittenBulletResult.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* -------------------- VIEW: JOB MATCHER -------------------- */}
        {token && user && activeView === 'matcher' && (
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '24px' }}>Target Job Matcher & Gap Analysis</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
              
              {/* Left Column: Form to match */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>Match New Role</h3>
                <form onSubmit={handleMatchAnalyze}>
                  <div className="form-group">
                    <label className="form-label">Job Title</label>
                    <input className="form-input" type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required placeholder="e.g. Lead API Engineer" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company Name (Optional)</label>
                    <input className="form-input" type="text" value={jobCompany} onChange={e => setJobCompany(e.target.value)} placeholder="e.g. Google" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Job Description requirements</label>
                    <textarea className="form-input form-textarea" value={jobDescription} onChange={e => setJobDescription(e.target.value)} required placeholder="Paste the job requirements and details here..." />
                  </div>
                  <button className="btn btn-primary" type="submit" style={{ width: '100%' }} disabled={matching || !selectedResumeId}>
                    {matching ? 'Matching skills...' : 'Match compatibility'}
                  </button>
                </form>
              </div>

              {/* Right Column: active matching score or saved jobs history */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {activeAnalysis ? (
                  <div className="glass-panel" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem' }}>Skill Match Results</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Score & recommendations</span>
                      </div>
                      <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent)' }}>{activeAnalysis.matching_score}%</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                      <div style={{ padding: '16px', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: '10px' }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--success)', marginBottom: '8px' }}>Matched Skills</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {activeAnalysis.matched_skills.map((s: string, i: number) => (
                            <span key={i} style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.08)', padding: '3px 8px', borderRadius: '12px', color: 'var(--success)', fontWeight: 600 }}>{s}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ padding: '16px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: '10px' }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--danger)', marginBottom: '8px' }}>Missing Skills</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {activeAnalysis.missing_skills.map((s: string, i: number) => (
                            <span key={i} style={{ fontSize: '0.75rem', background: 'rgba(239,68,68,0.08)', padding: '3px 8px', borderRadius: '12px', color: '#f87171', fontWeight: 600 }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Cover letter generator */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>AI Cover Letter Tool</h4>
                      <button className="btn btn-accent" onClick={handleGenerateCoverLetter} disabled={generatingLetter}>
                        {generatingLetter ? 'Generating Letter...' : 'Tailor Cover Letter'}
                      </button>

                      {coverLetter && (
                        <div style={{ marginTop: '16px', padding: '20px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                          <p><strong>Subject:</strong> {coverLetter.subject}</p>
                          <p style={{ marginTop: '12px' }}>{coverLetter.salutation},</p>
                          <p style={{ marginTop: '10px' }}>{coverLetter.introduction}</p>
                          <p style={{ marginTop: '10px' }}>{coverLetter.body}</p>
                          <p style={{ marginTop: '10px' }}>{coverLetter.closing}</p>
                          <p style={{ marginTop: '12px' }}>{coverLetter.sign_off}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="glass-panel" style={{ padding: '32px' }}>
                    <h3>Saved Job Descriptions</h3>
                    {savedJobs.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '12px' }}>No saved jobs. Run a match analysis to save.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                        {savedJobs.map(j => (
                          <div key={j.id} style={{ padding: '14px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>{j.title}</p>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{j.company || 'Unknown Company'} • {j.salary_estimate || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className="btn btn-secondary" onClick={() => handleDeleteJob(j.id)} style={{ padding: '6px' }}>
                                <Trash2 size={14} color="var(--danger)" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* -------------------- VIEW: SKILL ANALYTICS -------------------- */}
        {token && user && activeView === 'skills' && (
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '24px' }}>Skill Intelligence</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
              
              {/* Radar Chart */}
              <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ marginBottom: '20px' }}>Skill Competency Radar</h3>
                <RadarChart skills={[
                  { label: 'Backend', value: 85 },
                  { label: 'Frontend', value: 60 },
                  { label: 'Database', value: 80 },
                  { label: 'DevOps', value: 70 },
                  { label: 'Architecture', value: 75 }
                ]} />
              </div>

              {/* Skill dependency Tree */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <SkillTree />
                
                {/* Industry demand */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '12px' }}>Market Demand Insights</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ padding: '12px', background: 'rgba(16,185,129,0.03)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: '8px' }}>
                      <h4 style={{ fontSize: '0.8rem', color: 'var(--success)' }}>High Demand Skills</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>FastAPI, SQLAlchemy, Docker, Kubernetes, AWS Lambdas</p>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(192,132,252,0.03)', border: '1px solid rgba(192,132,252,0.1)', borderRadius: '8px' }}>
                      <h4 style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Future Gaps to Study</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Machine Learning, PyTorch, PySpark, LangChain, vector search</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* -------------------- VIEW: STUDY ROADMAP -------------------- */}
        {token && user && activeView === 'learning' && (
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '24px' }}>Study Roadmap & Milestones</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
              
              {/* Learning Roadmap items */}
              <div className="glass-panel" style={{ padding: '28px' }}>
                <h3 style={{ marginBottom: '16px' }}>Recommended Milestones</h3>
                
                {learningProgress.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No study milestones. Complete a resume match analysis to get AI suggestions.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {learningProgress.map(item => (
                      <div key={item.id} style={{
                        padding: '14px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '10px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderLeft: item.status === 'Completed' ? '4px solid var(--success)' : item.status === 'In_Progress' ? '4px solid var(--warning)' : '4px solid var(--text-muted)'
                      }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', textTransform:'uppercase' }}>{item.item_type}</span>
                          <p style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '4px' }}>{item.item_title}</p>
                          {item.item_link && (
                            <a href={item.item_link} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration:'none', marginTop: '4px' }}>
                              View Resource <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status: <strong>{item.status}</strong></span>
                          <button className="btn btn-secondary" onClick={() => handleToggleLearningStatus(item.id, item.status)} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                            Update
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Custom milestones */}
              <div className="glass-panel" style={{ padding: '28px' }}>
                <h3 style={{ marginBottom: '16px' }}>Add Custom Target</h3>
                <form onSubmit={handleAddLearningItem}>
                  <div className="form-group">
                    <label className="form-label">Milestone Title</label>
                    <input className="form-input" type="text" value={customItemTitle} onChange={e => setCustomItemTitle(e.target.value)} required placeholder="e.g. Complete Docker Course" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Item Type</label>
                    <select className="form-input" value={customItemType} onChange={e => setCustomItemType(e.target.value)}>
                      <option value="Course">Course</option>
                      <option value="Project">Project</option>
                      <option value="Certification">Certification</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Resource Link (Optional)</label>
                    <input className="form-input" type="url" value={customItemLink} onChange={e => setCustomItemLink(e.target.value)} placeholder="https://youtube.com..." />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={customItemWeekly} onChange={e => setCustomItemWeekly(e.target.checked)} id="weekly-goal-check" />
                    <label htmlFor="weekly-goal-check" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor:'pointer' }}>Set as Weekly Target Goal</label>
                  </div>
                  <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                    Add Goal
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* -------------------- VIEW: MOCK INTERVIEW PREP -------------------- */}
        {token && user && activeView === 'interview' && (
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '24px' }}>AI Interview Simulator</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
              
              {/* Interview Screen */}
              <div className="glass-panel" style={{ padding: '28px' }}>
                {!activeInterview && !interviewResult ? (
                  <div>
                    <h3 style={{ marginBottom: '16px' }}>Configure Mock Session</h3>
                    <form onSubmit={handleStartInterview}>
                      <div className="form-group">
                        <label className="form-label">Target Job Title</label>
                        <input className="form-input" type="text" value={interviewJobTitle} onChange={e => setInterviewJobTitle(e.target.value)} required placeholder="e.g. Junior Python Dev" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Interview Category</label>
                        <select className="form-input" value={interviewType} onChange={e => setInterviewType(e.target.value)}>
                          <option value="Technical">Technical Competency</option>
                          <option value="HR">HR & Behavioral (STAR format)</option>
                        </select>
                      </div>
                      <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                        {startingInterview ? 'Simulating Interview...' : 'Start Interview'}
                      </button>
                    </form>
                  </div>
                ) : activeInterview && activeQuestion ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>Interactive session running</span>
                      <Clock size={16} />
                    </div>

                    <p style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>{activeQuestion.question_text}</p>
                    
                    <form onSubmit={handleSendInterviewAnswer}>
                      <div className="form-group">
                        <label className="form-label">Your Response</label>
                        <textarea className="form-input form-textarea" value={userAnswer} onChange={e => setUserAnswer(e.target.value)} required placeholder="Type your answer clearly. Elaborate on details..." />
                      </div>
                      <button className="btn btn-primary" type="submit" disabled={submittingAnswer}>
                        {submittingAnswer ? 'Evaluating response...' : 'Submit Answer'}
                      </button>
                    </form>
                  </div>
                ) : finalizingInterview ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader size={36} className="spin" style={{ color: 'var(--primary)', marginBottom: '16px' }} />
                    <p style={{ fontWeight: 700 }}>AI is evaluating your interview session transcript...</p>
                  </div>
                ) : interviewResult ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <h3>Session Assessment Report</h3>
                      <button className="btn btn-secondary" onClick={() => setInterviewResult(null)}>
                        Restart
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                      <div style={{ padding: '16px', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)', borderRadius: '8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem', textTransform:'uppercase' }}>Technical accuracy score</span>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginTop: '8px' }}>{interviewResult.score}%</h2>
                      </div>
                      <div style={{ padding: '16px', background: 'rgba(20,184,166,0.04)', border: '1px solid rgba(20,184,166,0.1)', borderRadius: '8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem', textTransform:'uppercase' }}>Communication quality</span>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)', marginTop: '8px' }}>{interviewResult.communication_score}%</h2>
                      </div>
                    </div>

                    <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Recruiter Feedback Summary</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', whiteSpace:'pre-wrap' }}>{interviewResult.overall_feedback}</p>

                    <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Improvement Suggestions</h4>
                    <ul style={{ paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {interviewResult.improvement_suggestions?.suggestions?.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              {/* Mock Interview History */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>Interview History</h3>
                {interviewHistory.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No past session history.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {interviewHistory.map(h => (
                      <div key={h.id} style={{ padding: '12px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{h.job_title} ({h.type})</p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Score: {h.score}% • Comm: {h.communication_score}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* -------------------- VIEW: QUIZ ARENA -------------------- */}
        {token && user && activeView === 'quiz' && (
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '24px' }}>AI Quiz Arena</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
              
              {/* Quiz Arena Screen */}
              <div className="glass-panel" style={{ padding: '28px' }}>
                {!activeAssessment && !activeAttempt ? (
                  <div>
                    <h3 style={{ marginBottom: '16px' }}>Choose Target Matching Job to Screen</h3>
                    {analyses.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Run a compatibility gap match first to generate quiz topics!</p>
                    ) : (
                      <div>
                        <div className="form-group">
                          <label className="form-label">Quiz Difficulty</label>
                          <select className="form-input" value={quizDifficulty} onChange={e => setQuizDifficulty(e.target.value)}>
                            <option value="Easy">Easy Concepts</option>
                            <option value="Medium">Medium Technical</option>
                            <option value="Hard">Advanced Architecture</option>
                          </select>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {analyses.map(a => (
                            <div key={a.id} style={{ padding: '14px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>Test missing skills from: {a.missing_skills?.slice(0,3).join(', ')}</p>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Based on match analysis of {new Date(a.created_at).toLocaleDateString()}</span>
                              </div>
                              <button className="btn btn-primary" onClick={() => handleStartQuiz(a.id)} disabled={generatingQuiz} style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                                {generatingQuiz ? 'Generating...' : 'Start Quiz'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : activeAssessment && !activeAttempt ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', textTransform:'uppercase', color: 'var(--primary)', fontWeight:700 }}>Arena Session</span>
                        <h3 style={{ fontSize: '1.2rem' }}>{activeAssessment.title}</h3>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Difficulty: {activeAssessment.difficulty}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                      {activeAssessment.questions.map((q: any, idx: number) => (
                        <div key={q.id}>
                          <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '12px' }}>Q{idx + 1}: {q.question_text}</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {q.options.map((opt: string, oIdx: number) => {
                              const isSelected = quizAnswers[q.id] === opt
                              return (
                                <div 
                                  key={oIdx} 
                                  onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                  style={{
                                    padding: '12px 14px', borderRadius: '8px', border: '1px solid',
                                    borderColor: isSelected ? 'var(--primary)' : 'var(--border-color)',
                                    background: isSelected ? 'rgba(99,102,241,0.06)' : 'rgba(0,0,0,0.1)',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'
                                  }}
                                >
                                  <div style={{
                                    width: '14px', height: '14px', borderRadius: '50%', border: '2px solid',
                                    borderColor: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                  }}>
                                    {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }}></div>}
                                  </div>
                                  <span style={{ fontSize: '0.85rem' }}>{opt}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                      <button className="btn btn-secondary" onClick={() => setActiveAssessment(null)} style={{ flex: 1 }}>
                        Cancel
                      </button>
                      <button className="btn btn-primary" onClick={handleSubmitQuiz} disabled={submittingQuiz} style={{ flex: 1 }}>
                        {submittingQuiz ? 'Grading quiz...' : 'Submit Answers'}
                      </button>
                    </div>
                  </div>
                ) : activeAttempt ? (
                  <div>
                    <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Assessment Score</h3>
                      <h1 style={{ fontSize: '3rem', color: activeAttempt.score >= 70 ? 'var(--success)' : 'var(--warning)', fontWeight: 800 }}>
                        {Math.round(activeAttempt.score)}%
                      </h1>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                        {activeAttempt.score >= 70 ? '🎉 Exceptional score! Gaps successfully bridged.' : '💼 Study recommendations and try again to improve.'}
                      </p>
                    </div>

                    {/* Explanations listing */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {activeAssessment.questions.map((q: any, idx: number) => {
                        const selected = activeAttempt.answers[q.id]
                        return (
                          <div key={q.id} style={{ padding: '16px', background: 'rgba(0,0,0,0.15)', borderRadius: '10px', borderLeft: '4px solid var(--primary)' }}>
                            <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Q{idx + 1}: {q.question_text}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}><strong>Your Choice:</strong> {selected}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '4px' }}>{q.explanation}</p>
                          </div>
                        )
                      })}
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                      <button className="btn btn-secondary" onClick={() => { setActiveAttempt(null); setActiveAssessment(null); }} style={{ flex: 1 }}>
                        New Assessment
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Leaderboard and Weak topics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Weak topics detection */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Weak Topic Detection</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {weakTopics.weak_topics?.length > 0 ? (
                      weakTopics.weak_topics.map((wt: string, idx: number) => (
                        <span key={idx} style={{ fontSize: '0.75rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', padding: '4px 10px', borderRadius: '12px', color: '#f87171' }}>{wt}</span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{weakTopics.message || 'No weak topics detected.'}</span>
                    )}
                  </div>
                </div>

                {/* Leaderboard */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Quiz Leaderboard</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {leaderboard.map((l, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '6px 8px', background: l.name === (user.full_name || user.email) ? 'rgba(99,102,241,0.06)' : 'none', borderRadius: '4px' }}>
                        <span>{index + 1}. <strong>{l.name}</strong></span>
                        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{l.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* -------------------- VIEW: PROFILE -------------------- */}
        {token && user && activeView === 'profile' && (
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '24px' }}>Profile & Career Targets</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
              
              {/* Edit form */}
              <div className="glass-panel" style={{ padding: '28px' }}>
                <h3 style={{ marginBottom: '20px' }}>Profile Information</h3>
                <form onSubmit={handleUpdateProfile}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" type="text" value={profileName} onChange={e => setProfileName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Career Target Goals</label>
                    <input className="form-input" type="text" value={profileGoals} onChange={e => setProfileGoals(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Salary ($)</label>
                    <input className="form-input" type="text" value={profileTargetSalary} onChange={e => setProfileTargetSalary(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preferred Roles (comma separated)</label>
                    <input className="form-input" type="text" value={profileRoles} onChange={e => setProfileRoles(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preferred Locations (comma separated)</label>
                    <input className="form-input" type="text" value={profileLocations} onChange={e => setProfileLocations(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Experience Level</label>
                    <select className="form-input" value={profileLevel} onChange={e => setProfileLevel(e.target.value)}>
                      <option value="Junior">Junior (0-2 years)</option>
                      <option value="Mid">Mid Level (3-5 years)</option>
                      <option value="Senior">Senior (6+ years)</option>
                    </select>
                  </div>
                  <button className="btn btn-primary" type="submit" disabled={updatingProfile} style={{ width: '100%' }}>
                    {updatingProfile ? 'Saving profile details...' : 'Save Configuration'}
                  </button>
                </form>
              </div>

              {/* Alerts & Notifications log */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>Smart Notification Logs</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{
                      padding: '10px 12px', background: n.is_read ? 'rgba(0,0,0,0.06)' : 'rgba(99,102,241,0.04)',
                      border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer',
                      borderLeft: n.is_read ? 'none' : '3px solid var(--primary)'
                    }} onClick={() => handleMarkNotificationRead(n.id)}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>{n.title}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{n.message}</p>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* -------------------- VIEW: ADMIN PANEL -------------------- */}
        {token && user && activeView === 'admin' && adminStats && (
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '24px' }}>Platform Administration</h1>
            
            {/* Counts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
              <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color:'var(--text-secondary)' }}>Total Users</span>
                <h2 style={{ fontSize: '1.6rem', marginTop: '6px' }}>{adminStats.total_users}</h2>
              </div>
              <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color:'var(--text-secondary)' }}>Resumes Parsed</span>
                <h2 style={{ fontSize: '1.6rem', marginTop: '6px' }}>{adminStats.total_resumes}</h2>
              </div>
              <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color:'var(--text-secondary)' }}>Match Analyses</span>
                <h2 style={{ fontSize: '1.6rem', marginTop: '6px' }}>{adminStats.total_matches}</h2>
              </div>
              <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color:'var(--text-secondary)' }}>Quizzes Attempted</span>
                <h2 style={{ fontSize: '1.6rem', marginTop: '6px' }}>{adminStats.total_quizzes_taken}</h2>
              </div>
              <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color:'var(--text-secondary)' }}>Interviews Run</span>
                <h2 style={{ fontSize: '1.6rem', marginTop: '6px' }}>{adminStats.total_interviews_taken}</h2>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              {/* Skill stats */}
              <div className="glass-panel" style={{ padding: '28px' }}>
                <h3 style={{ marginBottom: '16px' }}>Top Missing Skills Across Candidates</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {adminStats.skill_stats?.top_missing_skills?.map((skill: string, i: number) => (
                    <div key={i} style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: '6px', fontSize: '0.85rem', color: '#f87171' }}>
                      {i + 1}. {skill}
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Token estimates */}
              <div className="glass-panel" style={{ padding: '28px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                <h3>Gemini Token Usage Estimator</h3>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '12px' }}>
                  {adminStats.ai_token_usage_estimate.toLocaleString()}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>Estimated input/output tokens processed during resume parsing, matching gap reviews, quiz constructions, and conversational mock evaluations.</p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
