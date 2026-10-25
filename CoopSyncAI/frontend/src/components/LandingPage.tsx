import React, { useState } from 'react';
import { 
  ShieldCheck, 
  GraduationCap, 
  ArrowRight, 
  Lock, 
  User, 
  CheckCircle2, 
  X, 
  Loader2, 
  Wifi, 
  WifiOff,
  Building2,
  FileCheck2,
  ScanFace,
  Briefcase
} from 'lucide-react';
import { UserProfile } from '../types';
import { loginUserApi, registerUserApi } from '../api';

interface LandingPageProps {
  allUsers: UserProfile[];
  isOnline: boolean;
  onLoginSuccess: (user: UserProfile, targetTab?: string) => void;
}

type PortalType = 'admin' | 'student';

export const LandingPage: React.FC<LandingPageProps> = ({
  allUsers,
  isOnline,
  onLoginSuccess,
}) => {
  const [selectedPortal, setSelectedPortal] = useState<PortalType | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Sign-up specific fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupStudentId, setSignupStudentId] = useState('');
  const [signupRole, setSignupRole] = useState<'student' | 'admin' | 'trainer'>('student');

  // Filter available accounts by portal for quick demo selection
  const adminUsers = allUsers.filter(u => 
    u.role === 'admin' || 
    u.role === 'ncct_admin' || 
    u.role === 'institution_admin' || 
    u.role === 'trainer'
  );

  const studentUsers = allUsers.filter(u => 
    u.role === 'student'
  );

  const handleOpenLogin = (portal: PortalType) => {
    setSelectedPortal(portal);
    setAuthMode('signin');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIdentifier('');
    setPassword('');
  };

  const handleCloseLogin = () => {
    setSelectedPortal(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setAuthMode('signin');
    setIdentifier('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage(selectedPortal === 'admin' ? 'Please enter your official email or staff ID.' : 'Please enter your Student ID or email.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await loginUserApi(identifier.trim(), password.trim());
      
      if (res && res.user) {
        const matchedUser: UserProfile = {
          id: res.user.id,
          student_id: res.user.student_id,
          roll_number: res.user.roll_number || '',
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          department: res.user.department || 'Cooperative Education',
          semester: res.user.semester || '',
          degree: res.user.degree || '',
          skills: res.user.skills || '',
          avatar: res.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
        };

        // Portal restriction check
        if (selectedPortal === 'student' && matchedUser.role !== 'student') {
          setErrorMessage('This account is registered with administrative/faculty role. Please sign in via Admin Portal.');
          return;
        }
        if (selectedPortal === 'admin' && matchedUser.role === 'student') {
          setErrorMessage('Students cannot access the Admin Portal. Please use the Student Portal.');
          return;
        }

        const targetTab = selectedPortal === 'admin' ? 'dashboard' : 'courses';
        onLoginSuccess(matchedUser, targetTab);
        return;
      } else {
        setErrorMessage(
          res?.detail || 
          (selectedPortal === 'student' 
            ? 'Invalid student ID or password. Student accounts must be registered by an administrator.' 
            : 'Invalid credentials. Please verify your official email/staff ID and password.')
        );
      }
    } catch {
      setErrorMessage('Unable to connect to the authentication server. Please ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (signupPassword !== signupConfirm) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    // Only admin or trainer allowed for registration
    const role: 'admin' | 'trainer' = signupRole === 'trainer' ? 'trainer' : 'admin';

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await registerUserApi({
        name: signupName.trim(),
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword,
        role: role,
        student_id: signupStudentId.trim() || undefined,
      });

      if (res && res.success && res.user) {
        const newUser: UserProfile = {
          id: res.user.id,
          student_id: res.user.student_id,
          roll_number: '',
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          department: res.user.department || 'Cooperative Administration',
          semester: res.user.semester || '',
          degree: res.user.degree || '',
          skills: res.user.skills || '',
          avatar: res.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
        };
        onLoginSuccess(newUser, 'dashboard');
      } else {
        setErrorMessage(res?.detail || res?.message || 'Registration failed. Please try again.');
      }
    } catch {
      setErrorMessage('Unable to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#070b18',
      color: '#f8fafc',
      fontFamily: 'var(--font-body)',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background subtle illumination */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '1200px',
        height: '480px',
        background: 'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Top Institutional Header */}
      <header style={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        backgroundColor: 'rgba(7, 11, 24, 0.92)',
        backdropFilter: 'blur(12px)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Institutional Title & Logos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#0f1d36',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
            }}>
              <Building2 size={22} color="#10b981" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: '#ffffff'
                }}>
                  CoopSync <span style={{ color: '#10b981' }}>AI</span>
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  letterSpacing: '0.04em'
                }}>
                  SIH 2024 • SIH26087
                </span>
              </div>
              <p style={{
                fontSize: '0.72rem',
                color: '#94a3b8',
                fontWeight: 500,
                letterSpacing: '0.01em'
              }}>
                National Council for Cooperative Training (NCCT) • Ministry of Cooperation
              </p>
            </div>
          </div>

          {/* Right Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: isOnline ? '#34d399' : '#fbbf24',
              backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              padding: '5px 12px',
              borderRadius: '9999px',
              border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
            }}>
              {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
              <span>{isOnline ? 'Institutional Core Online' : 'Offline Mode (Local Fallback)'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Landing Area */}
      <main style={{
        flex: 1,
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: '56px 24px 64px 24px',
        position: 'relative',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Hero Section */}
        <div style={{
          textAlign: 'center',
          maxWidth: '820px',
          marginBottom: '52px'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '20px'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#10b981'
            }} />
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#e2e8f0',
              letterSpacing: '0.03em',
              textTransform: 'uppercase'
            }}>
              Apex National Cooperative Education Platform
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 5vw, 3.5rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: '#ffffff',
            marginBottom: '16px'
          }}>
            CoopSync <span style={{ color: '#10b981' }}>AI</span>
          </h1>

          <p style={{
            fontSize: 'clamp(1.1rem, 2.2vw, 1.35rem)',
            fontWeight: 600,
            color: '#f1efe7',
            marginBottom: '14px',
            letterSpacing: '-0.01em'
          }}>
            Integrated Cooperative Training, Learning & Employment Ecosystem
          </p>

          <p style={{
            fontSize: '0.96rem',
            color: '#94a3b8',
            lineHeight: 1.6,
            maxWidth: '680px',
            margin: '0 auto'
          }}>
            Empowering cooperative institutions, state councils, and affiliated trainees through 
            AI-driven biometric attendance, verifiable certifications, accredited training curricula, 
            and dedicated industry placements.
          </p>
        </div>

        {/* Two Portal Cards (Admin Portal & Student Portal) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '28px',
          width: '100%',
          maxWidth: '960px',
          marginBottom: '64px'
        }}>
          {/* Card 1: Admin Portal */}
          <div
            onClick={() => handleOpenLogin('admin')}
            style={{
              backgroundColor: '#0e162b',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: '18px',
              padding: '36px 32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
              transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 18px 40px rgba(0, 0, 0, 0.55), 0 0 25px rgba(16, 185, 129, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.09)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.45)';
            }}
          >
            {/* Top Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981'
              }}>
                <ShieldCheck size={28} />
              </div>

              <span style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#34d399',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                Governance & Staff
              </span>
            </div>

            {/* Portal Content */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: '10px',
                letterSpacing: '-0.02em'
              }}>
                Admin Portal
              </h2>

              <p style={{
                fontSize: '0.92rem',
                color: '#94a3b8',
                lineHeight: 1.6,
                marginBottom: '20px'
              }}>
                Manage courses, training programmes, students, attendance, certifications, and institutional analytics.
              </p>

              {/* Functional Pills */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.8rem',
                color: '#cbd5e1'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <span>Institutional Attendance & Anti-Spoof Logs</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <span>Multi-Campus Training Programmes & Student ERP</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <span>Course LMS & Verifiable Digital Certificates</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenLogin('admin');
              }}
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: '10px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#059669';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#10b981';
              }}
            >
              <span>Login as Admin</span>
              <ArrowRight size={17} />
            </button>
          </div>

          {/* Card 2: Student Portal */}
          <div
            onClick={() => handleOpenLogin('student')}
            style={{
              backgroundColor: '#0e162b',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: '18px',
              padding: '36px 32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
              transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 18px 40px rgba(0, 0, 0, 0.55), 0 0 25px rgba(56, 189, 248, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.09)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.45)';
            }}
          >
            {/* Top Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}>
                <GraduationCap size={28} />
              </div>

              <span style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(56, 189, 248, 0.2)'
              }}>
                Candidates & Trainees
              </span>
            </div>

            {/* Portal Content */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: '10px',
                letterSpacing: '-0.02em'
              }}>
                Student Portal
              </h2>

              <p style={{
                fontSize: '0.92rem',
                color: '#94a3b8',
                lineHeight: 1.6,
                marginBottom: '20px'
              }}>
                Access enrolled courses, learning materials, face recognition attendance, QR attendance, certificates, and employment opportunities.
              </p>

              {/* Functional Pills */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.8rem',
                color: '#cbd5e1'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} color="#38bdf8" />
                  <span>One-Touch Face Biometric & QR Attendance</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} color="#38bdf8" />
                  <span>Curated Cooperative LMS Modules & Progress Tracking</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} color="#38bdf8" />
                  <span>Verified Credentials & Cooperative Job Placement</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenLogin('student');
              }}
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: '10px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0369a1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0284c7';
              }}
            >
              <span>Login as Student</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </div>

        {/* Institutional Pillars / Key Infrastructure Highlights */}
        <div style={{
          width: '100%',
          maxWidth: '960px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '36px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <ScanFace size={22} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
                Face Biometrics & Anti-Spoof
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.45 }}>
                Local LBPH model with liveness validation prevents proxy attendance across training centers.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Building2 size={22} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
                NCCT Cooperative ERP
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.45 }}>
                Full lifecycle management for RICMs, ICMs, university cooperative chairs, and staff.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <FileCheck2 size={22} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
                Verifiable Certificates
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.45 }}>
                Tamper-proof digital credentials with dynamic QR codes for instant employer validation.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Briefcase size={22} color="#a855f7" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
                Cooperative Placement
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.45 }}>
                Skill-match scoring connects certified trainees directly to dairy, banking & agricultural co-ops.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Institutional Authentication Modal */}
      {selectedPortal && (
        <div 
          onClick={handleCloseLogin}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.82)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#0d1527',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '460px',
              padding: '32px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  backgroundColor: selectedPortal === 'admin' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                  border: `1px solid ${selectedPortal === 'admin' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: selectedPortal === 'admin' ? '#10b981' : '#38bdf8'
                }}>
                  {selectedPortal === 'admin' ? <ShieldCheck size={24} /> : <GraduationCap size={24} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
                    {selectedPortal === 'admin' ? 'Admin Portal' : 'Student Portal'}
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    {selectedPortal === 'admin' ? 'National & Institutional Authorities' : 'Enrolled Candidates & Trainees'}
                  </span>
                </div>
              </div>
              <button type="button" onClick={handleCloseLogin}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Portal Mode Tabs — Only show for Admin Portal */}
            {selectedPortal === 'admin' && (
              <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
                {(['signin', 'signup'] as const).map((mode) => (
                  <button key={mode} type="button"
                    onClick={() => { setAuthMode(mode); setErrorMessage(null); setSuccessMessage(null); }}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                      fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s ease',
                      backgroundColor: authMode === mode ? '#10b981' : 'transparent',
                      color: authMode === mode ? '#ffffff' : '#94a3b8',
                    }}
                  >
                    {mode === 'signin' ? '🔑 Sign In' : '✨ Sign Up'}
                  </button>
                ))}
              </div>
            )}

            {/* Student Portal Info Notice */}
            {selectedPortal === 'student' && (
              <div style={{
                backgroundColor: 'rgba(2, 132, 199, 0.08)',
                border: '1px solid rgba(2, 132, 199, 0.25)',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.8rem',
                color: '#7dd3fc',
                lineHeight: 1.4
              }}>
                <GraduationCap size={22} color="#38bdf8" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#ffffff' }}>Authorized Student Sign In</strong>
                  <div style={{ color: '#94a3b8', fontSize: '0.73rem', marginTop: '2px' }}>
                    Student IDs are issued exclusively by Institutional Administrators. Self-registration is disabled.
                  </div>
                </div>
              </div>
            )}

            {/* Error / Success Messages */}
            {errorMessage && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '0.82rem', marginBottom: '16px' }}>
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', fontSize: '0.82rem', marginBottom: '16px' }}>
                {successMessage}
              </div>
            )}

            {/* ── SIGN IN FORM ── */}
            {authMode === 'signin' && (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    {selectedPortal === 'admin' ? 'Official Email / Staff ID' : 'Student ID / Enrolled Email'}
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px' }} />
                    <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={selectedPortal === 'admin' ? 'e.g. admin@coopsync.edu or ADMIN001' : 'e.g. 5025088 or student@coopsync.edu'}
                      style={{ width: '100%', padding: '11px 12px 11px 38px', backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#ffffff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px' }} />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      style={{ width: '100%', padding: '11px 12px 11px 38px', backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#ffffff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                </div>
                <button type="submit" disabled={isLoading}
                  style={{ width: '100%', padding: '13px', borderRadius: '8px', backgroundColor: selectedPortal === 'admin' ? '#10b981' : '#0284c7', color: '#ffffff', border: 'none', fontSize: '0.95rem', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px', transition: 'opacity 0.2s', opacity: isLoading ? 0.75 : 1 }}
                >
                  {isLoading ? <><Loader2 size={18} className="animate-spin" /><span>Verifying...</span></> : <><span>Sign In to {selectedPortal === 'admin' ? 'Admin' : 'Student'} Portal</span><ArrowRight size={17} /></>}
                </button>
                {selectedPortal === 'admin' ? (
                  <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                    Need an administrator account?{' '}
                    <button type="button" onClick={() => { setAuthMode('signup'); setErrorMessage(null); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', fontWeight: 600, fontSize: '0.78rem', padding: 0 }}>
                      Register here
                    </button>
                  </p>
                ) : (
                  <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#64748b', margin: '4px 0 0 0' }}>
                    Not registered yet? Please contact your institution administrator to receive your Student ID.
                  </p>
                )}
              </form>
            )}

            {/* ── SIGN UP FORM (Admin Portal Only) ── */}
            {authMode === 'signup' && selectedPortal === 'admin' && (
              <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Full Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Full Name *</label>
                  <input type="text" value={signupName} onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Dr. Priya Sharma"
                    style={{ width: '100%', padding: '11px 14px', backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#ffffff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Official Email Address *</label>
                  <input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="e.g. admin@coopsync.edu"
                    style={{ width: '100%', padding: '11px 14px', backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#ffffff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                {/* Role + Staff ID row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                      Administrative Role *
                    </label>
                    <select value={signupRole} onChange={(e) => setSignupRole(e.target.value as any)}
                      style={{ width: '100%', padding: '11px 12px', backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#ffffff', fontSize: '0.88rem', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="admin">Institutional Admin</option>
                      <option value="trainer">Faculty / Trainer</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                      Staff / Employee ID <span style={{ color: '#64748b' }}>(optional)</span>
                    </label>
                    <input type="text" value={signupStudentId} onChange={(e) => setSignupStudentId(e.target.value)}
                      placeholder="e.g. ADM001"
                      style={{ width: '100%', padding: '11px 12px', backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#ffffff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                {/* Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Password * <span style={{ color: '#64748b', fontWeight: 400 }}>(min. 6 characters)</span></label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px' }} />
                    <input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Create admin password"
                      style={{ width: '100%', padding: '11px 12px 11px 38px', backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#ffffff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                </div>
                {/* Confirm Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Confirm Password *</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={16} color={signupConfirm && signupConfirm !== signupPassword ? '#ef4444' : '#94a3b8'} style={{ position: 'absolute', left: '12px' }} />
                    <input type="password" value={signupConfirm} onChange={(e) => setSignupConfirm(e.target.value)}
                      placeholder="Re-enter password"
                      style={{ width: '100%', padding: '11px 12px 11px 38px', backgroundColor: 'rgba(15,23,42,0.8)', border: `1px solid ${signupConfirm && signupConfirm !== signupPassword ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)'}`, borderRadius: '8px', color: '#ffffff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                </div>

                <button type="submit" disabled={isLoading}
                  style={{ width: '100%', padding: '13px', borderRadius: '8px', backgroundColor: '#10b981', color: '#ffffff', border: 'none', fontSize: '0.95rem', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '2px', transition: 'opacity 0.2s', opacity: isLoading ? 0.75 : 1 }}
                >
                  {isLoading ? <><Loader2 size={18} className="animate-spin" /><span>Registering Admin...</span></> : <><span>Register Admin Account</span><ArrowRight size={17} /></>}
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  Already have an account?{' '}
                  <button type="button" onClick={() => { setAuthMode('signin'); setErrorMessage(null); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', fontWeight: 600, fontSize: '0.78rem', padding: 0 }}>
                    Sign in here
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Institutional Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: '#050812',
        padding: '24px',
        fontSize: '0.8rem',
        color: '#64748b'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <strong style={{ color: '#e2e8f0' }}>CoopSync AI Ecosystem</strong> – National Council for Cooperative Training (NCCT)
            <span style={{ margin: '0 8px' }}>•</span>
            <span>Ministry of Cooperation, Government of India</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>Smart India Hackathon PS: <strong>SIH26087</strong></span>
            <span style={{ color: '#10b981' }}>Secure Institutional Portal</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
