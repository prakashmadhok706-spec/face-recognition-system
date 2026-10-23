import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  Clock, 
  GraduationCap, 
  Award, 
  Mail, 
  BookOpen, 
  Filter,
  UserPlus,
  Camera,
  Upload,
  Sparkles,
  Trash2,
  AlertTriangle,
  Loader2,
  Edit3,
  Save,
  RotateCcw,
  Play,
  Pause,
  ShieldCheck,
  Sliders,
  Check,
  ChevronRight
} from 'lucide-react';
import { 
  fetchStudents, 
  addStudentApi, 
  captureSampleApi, 
  deleteStudentApi, 
  updateStudentApi,
  resetStudentSamplesApi,
  fetchStudentSamplesCountApi,
  triggerRetrainModelApi,
  fetchRetrainStatusApi
} from '../api';
import { UserProfile } from '../types';
import { WebFaceEnrollmentModal } from './WebFaceEnrollmentModal';
import confetti from 'canvas-confetti';

interface StudentERPViewProps {
  currentUser: UserProfile;
}

// Visual guidance steps based on capture percentage
const GUIDANCE_STEPS = [
  { minPct: 0, maxPct: 25, instruction: '👤 Look directly at the camera with a neutral expression', badge: 'Front Angle' },
  { minPct: 25, maxPct: 45, instruction: '🔄 Turn your head slightly to the left (15°)', badge: 'Left Profile' },
  { minPct: 45, maxPct: 65, instruction: '🔄 Turn your head slightly to the right (15°)', badge: 'Right Profile' },
  { minPct: 65, maxPct: 80, instruction: '⬆️ Tilt your chin slightly upward & downward', badge: 'Vertical Tilt' },
  { minPct: 80, maxPct: 100, instruction: '😊 Keep natural expressions, gentle smile or blink', badge: 'Dynamic Variation' },
];

export const StudentERPView: React.FC<StudentERPViewProps> = ({ currentUser }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // student.py Modal State
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [registerStep, setRegisterStep] = useState<'profile' | 'web_face'>('profile');
  const [newStudentId, setNewStudentId] = useState<string>('');
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newRollNo, setNewRollNo] = useState<string>('');
  const [newGender, setNewGender] = useState<string>('Male');
  const [newDept, setNewDept] = useState<string>('Computer Science & Engineering');
  const [newYear, setNewYear] = useState<string>('3rd Year');
  const [newCourse, setNewCourse] = useState<string>('B.Tech');
  const [newSem, setNewSem] = useState<string>('Sem 5');
  const [newSkills, setNewSkills] = useState<string>('Python, OpenCV, Machine Learning');
  const [sampleCount, setSampleCount] = useState<number>(0);
  const [registerMsg, setRegisterMsg] = useState<string | null>(null);

  // Integrated Web Face Enrollment inside Register Student Modal
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAutoCapturing, setIsAutoCapturing] = useState<boolean>(false);
  const [autoRetrainOnComplete, setAutoRetrainOnComplete] = useState<boolean>(true);
  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const [trainStatus, setTrainStatus] = useState<any>(null);
  const [lastQuality, setLastQuality] = useState<{
    sharpness: number;
    brightness: number;
    facesDetected?: number;
    error?: string;
  } | null>(null);

  const isCapturingRef = useRef<boolean>(false);
  const captureLoopTimer = useRef<any>(null);

  // Edit Tech Stack Modal State for Existing Student Cards
  const [studentToEditSkills, setStudentToEditSkills] = useState<any | null>(null);
  const [editSkillsInput, setEditSkillsInput] = useState<string>('');
  const [isSavingSkills, setIsSavingSkills] = useState<boolean>(false);
  const [skillsSaveSuccess, setSkillsSaveSuccess] = useState<string | null>(null);

  // Delete Student State
  const [studentToDelete, setStudentToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);

  // Standalone Web Face Enrollment Modal State
  const [showEnrollModal, setShowEnrollModal] = useState<boolean>(false);
  const [enrollStudentId, setEnrollStudentId] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await fetchStudents();
      setStudents(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      const targetId = studentToDelete.student_id || String(studentToDelete.id);
      const res = await deleteStudentApi(targetId);
      if (res && res.success !== false) {
        setDeleteSuccessMsg(res.message || `Student ${studentToDelete.name} deleted successfully.`);
        setStudentToDelete(null);
        await loadStudents();
      } else {
        alert(res?.message || 'Failed to delete student.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error deleting student: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Start Camera for Web Face Enrollment
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      } else {
        setCameraError('Webcam API is not supported in this browser.');
      }
    } catch (err: any) {
      setCameraError(`Camera error: ${err.message}`);
    }
  };

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsAutoCapturing(false);
    isCapturingRef.current = false;
    if (captureLoopTimer.current) {
      clearTimeout(captureLoopTimer.current);
      captureLoopTimer.current = null;
    }
  }, []);

  // Capture Single Sample from Video Frame
  const captureFrame = useCallback(async (): Promise<boolean> => {
    if (!videoRef.current || !canvasRef.current || !newStudentId.trim()) return false;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return false;

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const b64 = canvas.toDataURL('image/jpeg', 0.90);

    try {
      const res = await captureSampleApi({
        student_id: newStudentId.trim(),
        student_name: newStudentName.trim() || 'New Student',
        image_base64: b64,
        requester_role: currentUser.role,
        target_samples: 50
      });

      if (res.sharpness !== undefined && res.brightness !== undefined) {
        setLastQuality({
          sharpness: res.sharpness,
          brightness: res.brightness,
          facesDetected: res.faces_detected,
          error: res.error
        });
      }

      if (res.success && res.quality_passed) {
        setSampleCount(res.samples_count);
        if (res.samples_count >= 50) {
          setIsAutoCapturing(false);
          isCapturingRef.current = false;
          confetti({ particleCount: 60, spread: 70 });
          return false;
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [newStudentId, newStudentName, currentUser.role]);

  // Auto-capture burst loop
  const triggerAutoCapture = useCallback(() => {
    if (!cameraActive) {
      startCamera();
    }
    setIsAutoCapturing(true);
    isCapturingRef.current = true;

    const loop = async () => {
      if (!isCapturingRef.current) return;
      await captureFrame();
      if (isCapturingRef.current) {
        captureLoopTimer.current = setTimeout(loop, 130);
      }
    };
    loop();
  }, [cameraActive, captureFrame]);

  const pauseAutoCapture = () => {
    setIsAutoCapturing(false);
    isCapturingRef.current = false;
    if (captureLoopTimer.current) {
      clearTimeout(captureLoopTimer.current);
      captureLoopTimer.current = null;
    }
  };

  const handleResetSamples = async () => {
    if (!newStudentId.trim()) return;
    pauseAutoCapture();
    try {
      await resetStudentSamplesApi(newStudentId.trim(), currentUser.role);
      setSampleCount(0);
      setLastQuality(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Registration + Trigger Retraining in One Step (No Need to Update Face Twice!)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentId.trim() || !newStudentName.trim()) {
      setRegisterMsg('❌ Student ID and Name are required.');
      return;
    }

    try {
      // 1. Save student record to SQLite and students.csv with Tech Stack
      const res = await addStudentApi({
        id: newStudentId.trim(),
        name: newStudentName.trim(),
        roll: newRollNo.trim() || newStudentId.trim(),
        gender: newGender,
        dept: newDept,
        year: newYear,
        course: newCourse,
        sem: newSem,
        skills: newSkills
      });

      if (res.success) {
        confetti({ particleCount: 70, spread: 80 });

        // 2. Trigger retraining if samples collected or auto-retrain checked
        if (autoRetrainOnComplete && sampleCount > 0) {
          setIsRetraining(true);
          triggerRetrainModelApi(currentUser.role)
            .then(() => {
              console.log('Background LBPH retraining triggered');
            })
            .catch(console.error);
        }

        stopCamera();
        setShowRegisterModal(false);
        setRegisterMsg(null);
        setSampleCount(0);
        await loadStudents();
      } else {
        setRegisterMsg(res.message);
      }
    } catch (err: any) {
      setRegisterMsg('Registration error: ' + err.message);
    }
  };

  // Save updated Tech Stack for Existing Student Card (e.g. Prakash Madhok)
  const handleSaveStudentSkills = async () => {
    if (!studentToEditSkills) return;
    setIsSavingSkills(true);
    try {
      const sid = studentToEditSkills.student_id || String(studentToEditSkills.id);
      const skillsToSave = editSkillsInput.trim() || 'Python, OpenCV, Machine Learning';
      await updateStudentApi(sid, { skills: skillsToSave });
      
      // Update local students list immediately
      setStudents(prev => prev.map(s => {
        if ((s.student_id || String(s.id)) === sid) {
          return { ...s, skills: skillsToSave };
        }
        return s;
      }));

      setSkillsSaveSuccess(`Tech stack updated successfully for ${studentToEditSkills.name}!`);
      setTimeout(() => {
        setSkillsSaveSuccess(null);
        setStudentToEditSkills(null);
      }, 1000);
    } catch (err: any) {
      alert('Error updating student skills: ' + err.message);
    } finally {
      setIsSavingSkills(false);
    }
  };

  const getGuidance = (count: number) => {
    const pct = Math.min(100, Math.round((count / 50) * 100));
    return GUIDANCE_STEPS.find(g => pct >= g.minPct && pct <= g.maxPct) || GUIDANCE_STEPS[0];
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.student_id?.includes(searchQuery);
    const matchesDept = selectedDept === 'all' || s.department.includes(selectedDept);
    return matchesSearch && matchesDept;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        borderLeft: '4px solid #10b981'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#f8fafc' }}>
              Student ERP & Capacity Profiles
            </h2>
            <span className="badge badge-emerald">
              <GraduationCap size={12} /> Academic Records
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '750px' }}>
            Unified student roster matching NCCT ERP specifications. Track attendance percentages, 
            skills development, course credits, and verified digital credentials in real time.
          </p>
        </div>

        {/* Search, Filter & Register Student (student.py) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {currentUser.role !== 'student' ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setEnrollStudentId(''); setShowEnrollModal(true); }}
                className="gradient-btn gradient-btn-success"
                style={{ padding: '10px 18px', fontSize: '0.85rem' }}
                title="Open Web Face Biometric Enrollment & Retraining"
              >
                <Camera size={16} /> Web Face Enrollment
              </button>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="gradient-btn"
                style={{ padding: '10px 18px', fontSize: '0.85rem' }}
              >
                <UserPlus size={16} /> Register Student (student.py)
              </button>
            </div>
          ) : (
            <span className="badge badge-indigo" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
              <GraduationCap size={14} /> Student Directory (Read-Only)
            </span>
          )}

          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '4px 12px'
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by name, roll, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                padding: '8px',
                fontSize: '0.85rem',
                outline: 'none',
                width: '180px'
              }}
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{
              background: '#0f1527',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#f8fafc',
              padding: '10px 14px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="all">All Departments</option>
            <option value="Dairy">Dairy Cooperative</option>
            <option value="Computer">Computer Science</option>
            <option value="Agri">Agri-Tech</option>
            <option value="Cooperative">Cooperative Admin</option>
          </select>
        </div>
      </div>

      {/* Deletion Success Banner */}
      {deleteSuccessMsg && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 18px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          borderRadius: '10px',
          color: '#a7f3d0',
          fontSize: '0.85rem'
        }}>
          <span>{deleteSuccessMsg}</span>
          <button
            onClick={() => setDeleteSuccessMsg(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a7f3d0',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '1rem',
              padding: '0 4px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Student Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {filteredStudents.map((student, idx) => (
          <div key={`${student.id}-${student.student_id || ''}-${idx}`} className="glass-card-interactive" style={{ padding: '22px', position: 'relative' }}>
            {/* Status tag */}
            <div style={{ position: 'absolute', top: '18px', right: '18px' }}>
              {student.present_today ? (
                <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                  <CheckCircle2 size={10} /> Present Today
                </span>
              ) : (
                <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>
                  <Clock size={10} /> Not Marked
                </span>
              )}
            </div>

            {/* Profile Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <img
                src={student.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                alt={student.name}
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #6366f1'
                }}
              />
              <div>
                <h4 style={{ fontSize: '1.1rem', color: '#f8fafc' }}>{student.name}</h4>
                <p style={{ fontSize: '0.8rem', color: '#38bdf8' }}>
                  Roll: {student.roll_number || '2400300100305'}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ID: {student.student_id} • {student.semester || 'Sem 5'}
                </p>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              <p><b>Dept:</b> {student.department}</p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <Mail size={12} /> {student.email}
              </p>
            </div>

            {/* Attendance Progress Bar */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Attendance Ratio</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>
                  {student.attendance_rate || 88}%
                </span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${student.attendance_rate || 88}%`,
                  height: '100%',
                  background: (student.attendance_rate || 88) >= 75 ? '#10b981' : '#f59e0b'
                }} />
              </div>
            </div>

            {/* Skills Badges with Edit Tech Stack Button */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tech Stack & Competencies</span>
                {currentUser.role !== 'student' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStudentToEditSkills(student);
                      setEditSkillsInput(student.skills || 'Python, OpenCV, Machine Learning');
                    }}
                    style={{
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.35)',
                      color: '#a5b4fc',
                      padding: '2px 8px',
                      borderRadius: '5px',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                    }}
                    title={`Edit Tech Stack for ${student.name}`}
                  >
                    <Edit3 size={11} /> Edit Tech Stack
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {student.skills?.split(',').map((skill: string, sIdx: number) => (
                  <span
                    key={sIdx}
                    style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: '#c7d2fe',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Bar with Delete Option */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {student.degree || 'B.Tech'} • {student.year || '3rd Year'}
              </span>
              {currentUser.role !== 'student' && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEnrollStudentId(student.student_id);
                      setShowEnrollModal(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    title={`Enroll or update face biometrics for ${student.name}`}
                  >
                    <Camera size={13} />
                    Enroll Face
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStudentToDelete(student);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                    }}
                    title={`Delete ${student.name} from records`}
                  >
                    <Trash2 size={13} />
                    Delete Record
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Register Student & Integrated Web Face Enrollment Modal */}
      {showRegisterModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '780px', padding: '26px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserPlus size={22} color="#10b981" />
                  Student Registration & Web Face Biometrics
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Unified student onboarding: save record, capture 50 biometric face samples & retrain recognition model in one step.
                </p>
              </div>
              <span className="badge badge-emerald">
                <ShieldCheck size={13} /> Biometric Synchronized
              </span>
            </div>

            {/* Step Tab Buttons */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '10px'
            }}>
              <button
                type="button"
                onClick={() => setRegisterStep('profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: registerStep === 'profile' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255, 255, 255, 0.05)',
                  color: registerStep === 'profile' ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: registerStep === 'profile' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                }}
              >
                <span>1. Academic Profile & Tech Stack</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRegisterStep('web_face');
                  if (!cameraActive) startCamera();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: registerStep === 'web_face' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.05)',
                  color: registerStep === 'web_face' ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: registerStep === 'web_face' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                }}
              >
                <Camera size={14} />
                <span>2. Web Face Biometrics ({sampleCount}/50)</span>
                {sampleCount >= 50 && <CheckCircle2 size={14} color="#34d399" />}
              </button>
            </div>

            {registerMsg && (
              <div style={{ padding: '10px 14px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid #6366f1', borderRadius: '8px', color: '#c7d2fe', fontSize: '0.82rem', marginBottom: '14px' }}>
                {registerMsg}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* TAB 1: Profile & Tech Stack */}
              {registerStep === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Student ID *</label>
                      <input
                        type="text"
                        value={newStudentId}
                        onChange={(e) => setNewStudentId(e.target.value)}
                        placeholder="e.g. 568250"
                        required
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '9px 12px', borderRadius: '8px', color: '#f8fafc', marginTop: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Student Full Name *</label>
                      <input
                        type="text"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        placeholder="e.g. Prakash Madhok"
                        required
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '9px 12px', borderRadius: '8px', color: '#f8fafc', marginTop: '4px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Roll Number</label>
                      <input
                        type="text"
                        value={newRollNo}
                        onChange={(e) => setNewRollNo(e.target.value)}
                        placeholder="e.g. 2400300100295"
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '9px 12px', borderRadius: '8px', color: '#f8fafc', marginTop: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Gender</label>
                      <select
                        value={newGender}
                        onChange={(e) => setNewGender(e.target.value)}
                        style={{ width: '100%', background: '#0f1527', border: '1px solid rgba(255,255,255,0.1)', padding: '9px 12px', borderRadius: '8px', color: '#f8fafc', marginTop: '4px' }}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Department</label>
                      <input
                        type="text"
                        value={newDept}
                        onChange={(e) => setNewDept(e.target.value)}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '9px 12px', borderRadius: '8px', color: '#f8fafc', marginTop: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Semester / Batch</label>
                      <input
                        type="text"
                        value={newSem}
                        onChange={(e) => setNewSem(e.target.value)}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '9px 12px', borderRadius: '8px', color: '#f8fafc', marginTop: '4px' }}
                      />
                    </div>
                  </div>

                  {/* Dedicated Tech Stack & Skills Section */}
                  <div style={{
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: '10px',
                    padding: '14px',
                    marginTop: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#c7d2fe', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sliders size={14} color="#818cf8" />
                        Tech Stack & Skills (Comma separated)
                      </label>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Syncs to Student ERP Capacity</span>
                    </div>

                    <input
                      type="text"
                      value={newSkills}
                      onChange={(e) => setNewSkills(e.target.value)}
                      placeholder="e.g. Python, OpenCV, Machine Learning, React, FastAPI"
                      style={{
                        width: '100%',
                        background: '#0a0f1d',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '0.85rem'
                      }}
                    />

                    {/* Quick Preset Tags for Skills */}
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Quick Add:</span>
                      {[
                        'Python', 'OpenCV', 'Machine Learning', 'PyTorch', 
                        'React', 'FastAPI', 'Docker', 'PostgreSQL', 'Computer Vision'
                      ].map((skillTag) => (
                        <button
                          key={skillTag}
                          type="button"
                          onClick={() => {
                            const currentArr = newSkills ? newSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
                            if (!currentArr.includes(skillTag)) {
                              setNewSkills([...currentArr, skillTag].join(', '));
                            }
                          }}
                          style={{
                            background: newSkills.includes(skillTag) ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            color: newSkills.includes(skillTag) ? '#818cf8' : '#cbd5e1',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            fontSize: '0.7rem',
                            cursor: 'pointer'
                          }}
                        >
                          + {skillTag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setShowRegisterModal(false)}
                      style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', padding: '9px 16px', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newStudentId.trim() || !newStudentName.trim()) {
                          setRegisterMsg('⚠️ Please enter Student ID and Name before starting face enrollment.');
                          return;
                        }
                        setRegisterStep('web_face');
                        startCamera();
                      }}
                      className="gradient-btn gradient-btn-cyan"
                      style={{ padding: '9px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>Proceed to Web Face Enrollment</span>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: Integrated Web Face Enrollment & Retrain */}
              {registerStep === 'web_face' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Guidance Banner */}
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem'
                  }}>
                    <span style={{ color: '#6ee7b7', fontWeight: 500 }}>
                      {getGuidance(sampleCount).instruction}
                    </span>
                    <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                      {getGuidance(sampleCount).badge}
                    </span>
                  </div>

                  {/* Camera Frame Container with Oval Guide */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '270px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#020617',
                    border: '2px solid rgba(16, 185, 129, 0.4)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scaleX(-1)'
                      }}
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    {/* Biometric Alignment Oval Frame */}
                    <div style={{
                      position: 'absolute',
                      width: '160px',
                      height: '210px',
                      border: isAutoCapturing ? '2px dashed #10b981' : '2px solid rgba(56, 189, 248, 0.7)',
                      borderRadius: '50%',
                      pointerEvents: 'none',
                      boxShadow: isAutoCapturing ? '0 0 20px rgba(16, 185, 129, 0.5)' : 'none',
                      transition: 'all 0.3s ease'
                    }} />

                    {/* Camera Control Overlay button if camera inactive */}
                    {!cameraActive && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px'
                      }}>
                        <Camera size={44} color="#64748b" />
                        <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Camera feed is currently paused</span>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="gradient-btn gradient-btn-cyan"
                          style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                        >
                          Launch Browser Camera
                        </button>
                      </div>
                    )}

                    {/* Quality Overlay Badges */}
                    {lastQuality && cameraActive && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        display: 'flex',
                        gap: '6px',
                        fontSize: '0.7rem'
                      }}>
                        <span style={{
                          background: 'rgba(0,0,0,0.7)',
                          border: `1px solid ${lastQuality.facesDetected === 1 ? '#10b981' : '#f59e0b'}`,
                          color: lastQuality.facesDetected === 1 ? '#34d399' : '#fbbf24',
                          padding: '3px 8px',
                          borderRadius: '4px'
                        }}>
                          {lastQuality.facesDetected === 1 ? '✓ Face Centered' : 'Searching Face'}
                        </span>
                        <span style={{
                          background: 'rgba(0,0,0,0.7)',
                          border: `1px solid ${lastQuality.sharpness >= 28 ? '#10b981' : '#ef4444'}`,
                          color: lastQuality.sharpness >= 28 ? '#34d399' : '#f87171',
                          padding: '3px 8px',
                          borderRadius: '4px'
                        }}>
                          Sharpness: {Math.round(lastQuality.sharpness)}
                        </span>
                      </div>
                    )}
                  </div>

                  {cameraError && (
                    <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '6px', color: '#fca5a5', fontSize: '0.78rem' }}>
                      {cameraError}
                    </div>
                  )}

                  {/* Progress Bar & Telemetry */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Biometric Samples Captured</span>
                      <span style={{ color: sampleCount >= 50 ? '#10b981' : '#38bdf8', fontWeight: 700 }}>
                        {sampleCount} / 50 Samples ({Math.min(100, Math.round((sampleCount / 50) * 100))}%)
                      </span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, Math.round((sampleCount / 50) * 100))}%`,
                        height: '100%',
                        background: sampleCount >= 50 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #6366f1, #38bdf8)',
                        transition: 'width 0.2s ease'
                      }} />
                    </div>
                  </div>

                  {/* Capture Action Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!isAutoCapturing ? (
                        <button
                          type="button"
                          onClick={triggerAutoCapture}
                          disabled={!cameraActive || sampleCount >= 50}
                          className="gradient-btn gradient-btn-cyan"
                          style={{ padding: '7px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Play size={14} />
                          Auto-Capture 50 Samples
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={pauseAutoCapture}
                          className="gradient-btn gradient-btn-gold"
                          style={{ padding: '7px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Pause size={14} />
                          Pause Auto-Capture
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={captureFrame}
                        disabled={!cameraActive || isAutoCapturing}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#f8fafc',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Camera size={14} />
                        Single Sample
                      </button>

                      {sampleCount > 0 && (
                        <button
                          type="button"
                          onClick={handleResetSamples}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#f87171',
                            padding: '7px 12px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <RotateCcw size={12} />
                          Reset
                        </button>
                      )}
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#c7d2fe', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={autoRetrainOnComplete}
                        onChange={(e) => setAutoRetrainOnComplete(e.target.checked)}
                        style={{ accentColor: '#10b981' }}
                      />
                      Auto-retrain LBPH model on submit
                    </label>
                  </div>

                  {/* Submission Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <button
                      type="button"
                      onClick={() => setRegisterStep('profile')}
                      style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      ← Back to Academic Profile
                    </button>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          stopCamera();
                          setShowRegisterModal(false);
                        }}
                        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="gradient-btn gradient-btn-success"
                        style={{ padding: '8px 22px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Save size={15} />
                        Save Record & Retrain Model
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Tech Stack Modal for Existing Students (e.g. Prakash Madhok) */}
      {studentToEditSkills && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '540px',
            padding: '26px',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8'
              }}>
                <Edit3 size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: '#f8fafc', margin: 0 }}>
                  Edit Tech Stack & Competencies
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  {studentToEditSkills.name} (ID: {studentToEditSkills.student_id})
                </p>
              </div>
            </div>

            {skillsSaveSuccess && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                borderRadius: '8px',
                color: '#a7f3d0',
                fontSize: '0.82rem',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} />
                <span>{skillsSaveSuccess}</span>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                Skills & Tech Stack (Comma separated)
              </label>
              <textarea
                rows={3}
                value={editSkillsInput}
                onChange={(e) => setEditSkillsInput(e.target.value)}
                placeholder="e.g. Python, OpenCV, Machine Learning, PyTorch, React"
                style={{
                  width: '100%',
                  background: '#0a0f1d',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  outline: 'none'
                }}
              />

              {/* Quick Preset Buttons */}
              <div style={{ marginTop: '10px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Click to add trending competencies:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    'Python', 'OpenCV', 'Machine Learning', 'Deep Learning', 
                    'PyTorch', 'TensorFlow', 'React', 'FastAPI', 'Docker', 
                    'PostgreSQL', 'Computer Vision', 'Kubernetes'
                  ].map((skill) => {
                    const exists = editSkillsInput.toLowerCase().includes(skill.toLowerCase());
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => {
                          const currentArr = editSkillsInput ? editSkillsInput.split(',').map(s => s.trim()).filter(Boolean) : [];
                          if (!currentArr.map(s => s.toLowerCase()).includes(skill.toLowerCase())) {
                            setEditSkillsInput([...currentArr, skill].join(', '));
                          }
                        }}
                        style={{
                          background: exists ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          border: exists ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: exists ? '#c7d2fe' : 'var(--text-secondary)',
                          padding: '4px 9px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        + {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                disabled={isSavingSkills}
                onClick={() => setStudentToEditSkills(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#f8fafc',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  cursor: isSavingSkills ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingSkills}
                onClick={handleSaveStudentSkills}
                className="gradient-btn"
                style={{
                  padding: '9px 20px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: isSavingSkills ? 'not-allowed' : 'pointer'
                }}
              >
                {isSavingSkills ? (
                  <>
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    Save Tech Stack
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '520px',
            padding: '26px',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            boxShadow: '0 20px 40px rgba(239, 68, 68, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444'
              }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', margin: 0 }}>Delete Student Record</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Permanent removal from CoopSync ERP system
                </p>
              </div>
            </div>

            {/* Target Student Preview */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginBottom: '16px'
            }}>
              <img
                src={studentToDelete.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                alt={studentToDelete.name}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #ef4444'
                }}
              />
              <div>
                <h4 style={{ fontSize: '1.05rem', color: '#f8fafc', margin: 0 }}>{studentToDelete.name}</h4>
                <p style={{ fontSize: '0.8rem', color: '#38bdf8', margin: '2px 0' }}>
                  Roll: {studentToDelete.roll_number || studentToDelete.student_id} • ID: {studentToDelete.student_id}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Dept: {studentToDelete.department}
                </p>
              </div>
            </div>

            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '0.8rem',
              color: '#fca5a5',
              lineHeight: 1.5,
              marginBottom: '20px'
            }}>
              ⚠️ <b>Warning:</b> This action will permanently remove:
              <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                <li>Academic profile & ERP registry records</li>
                <li>Biometric face photos in <code>dataset/{studentToDelete.student_id}</code></li>
                <li>OpenCV LBPH recognizer cache and <code>students.csv</code></li>
                <li>All attendance history logs</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setStudentToDelete(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#f8fafc',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteStudent}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: 'none',
                  color: 'white',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                }}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Web Face Biometric Enrollment & Retraining Modal */}
      {showEnrollModal && (
        <WebFaceEnrollmentModal
          isOpen={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          currentUser={currentUser}
          studentsList={students}
          initialSelectedStudentId={enrollStudentId}
          onEnrollmentComplete={loadStudents}
        />
      )}
    </div>
  );
};
