import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  Sparkles, 
  UserCheck, 
  Eye, 
  Sliders, 
  Cpu, 
  Lock,
  ChevronRight,
  Info,
  Layers
} from 'lucide-react';
import { 
  captureSampleApi, 
  resetStudentSamplesApi, 
  fetchStudentSamplesCountApi, 
  triggerRetrainModelApi, 
  fetchRetrainStatusApi 
} from '../api';
import { UserProfile } from '../types';
import confetti from 'canvas-confetti';

interface StudentOption {
  id?: number;
  student_id: string;
  name: string;
  department?: string;
  roll_number?: string;
}

interface WebFaceEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  studentsList: StudentOption[];
  initialSelectedStudentId?: string;
  onEnrollmentComplete?: () => void;
}

// Visual guidance steps based on capture percentage
const GUIDANCE_STEPS = [
  { minPct: 0, maxPct: 25, instruction: '👤 Look directly at the camera with a neutral expression', badge: 'Front Angle' },
  { minPct: 25, maxPct: 45, instruction: '🔄 Turn your head slightly to the left (15°)', badge: 'Left Profile' },
  { minPct: 45, maxPct: 65, instruction: '🔄 Turn your head slightly to the right (15°)', badge: 'Right Profile' },
  { minPct: 65, maxPct: 80, instruction: '⬆️ Tilt your chin slightly upward & downward', badge: 'Vertical Tilt' },
  { minPct: 80, maxPct: 100, instruction: '😊 Keep natural expressions, gentle smile or blink', badge: 'Dynamic Variation' },
];

export const WebFaceEnrollmentModal: React.FC<WebFaceEnrollmentModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  studentsList,
  initialSelectedStudentId,
  onEnrollmentComplete
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialSelectedStudentId || '');
  const [consentGiven, setConsentGiven] = useState<boolean>(false);
  const [targetSamples, setTargetSamples] = useState<number>(50);
  const [sampleCount, setSampleCount] = useState<number>(0);
  
  // Camera & Stream states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Capture states
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const isCapturingRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const captureLoopTimer = useRef<any>(null);

  // Live Biometric Quality telemetry
  const [lastQuality, setLastQuality] = useState<{
    sharpness: number;
    brightness: number;
    error?: string;
    facesDetected?: number;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Select student and accept consent to start.');
  const [feedbackType, setFeedbackType] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  // Retraining state
  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const [trainStatus, setTrainStatus] = useState<any>(null);
  const [trainPollingTimer, setTrainPollingTimer] = useState<any>(null);

  // Sync ref with states for interval loops
  useEffect(() => {
    isCapturingRef.current = isCapturing;
    isPausedRef.current = isPaused;
  }, [isCapturing, isPaused]);

  // Preselect student if provided
  useEffect(() => {
    if (initialSelectedStudentId) {
      setSelectedStudentId(initialSelectedStudentId);
    } else if (studentsList.length > 0 && !selectedStudentId) {
      setSelectedStudentId(studentsList[0].student_id);
    }
  }, [initialSelectedStudentId, studentsList]);

  // Query existing samples when selected student changes
  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentSamplesCountApi(selectedStudentId).then((res) => {
        if (res.success) {
          setSampleCount(res.samples_count || 0);
        }
      });
    }
  }, [selectedStudentId]);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
        setCameraPermission('granted');
        setStatusMessage('Camera active. Ready for biometric sample enrollment.');
        setFeedbackType('info');
      } else {
        setCameraPermission('denied');
        setCameraError('Webcam API is not supported in this browser environment.');
      }
    } catch (err: any) {
      setCameraPermission('denied');
      setCameraError(`Camera permission denied or camera device in use: ${err.message}`);
      setFeedbackType('error');
    }
  };

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Lifecycle camera control
  useEffect(() => {
    if (isOpen && consentGiven) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
      if (captureLoopTimer.current) clearInterval(captureLoopTimer.current);
      if (trainPollingTimer) clearInterval(trainPollingTimer);
    };
  }, [isOpen, consentGiven, stopCamera]);

  const selectedStudent = studentsList.find((s) => s.student_id === selectedStudentId);

  // Single Frame Capture & Quality Verification
  const captureSingleFrame = async (): Promise<boolean> => {
    if (!videoRef.current || !canvasRef.current || !selectedStudentId) return false;
    const video = videoRef.current;
    if (video.readyState < 2) return false;

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // Draw frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const b64 = canvas.toDataURL('image/jpeg', 0.88);

    const res = await captureSampleApi({
      student_id: selectedStudentId,
      student_name: selectedStudent?.name || 'Student',
      image_base64: b64,
      requester_role: currentUser.role,
      target_samples: targetSamples
    });

    if (res.success) {
      setSampleCount(res.samples_count);
      setLastQuality({
        sharpness: res.quality?.sharpness || 50,
        brightness: res.quality?.brightness || 120
      });
      setStatusMessage(res.message);
      setFeedbackType('success');

      if (res.samples_count >= targetSamples) {
        setIsCapturing(false);
        setIsPaused(false);
        if (captureLoopTimer.current) clearInterval(captureLoopTimer.current);
        setStatusMessage(`🎉 Target reached! ${res.samples_count} quality samples captured for ${selectedStudent?.name}. Ready to retrain model.`);
        setFeedbackType('success');
        confetti({ particleCount: 70, spread: 60 });
        if (onEnrollmentComplete) onEnrollmentComplete();
        return true;
      }
      return true;
    } else {
      setLastQuality({
        sharpness: res.quality?.sharpness || 0,
        brightness: res.quality?.brightness || 0,
        error: res.error || res.message
      });
      setStatusMessage(res.error || res.message || 'Sample rejected by quality validator.');
      setFeedbackType('warning');
      return false;
    }
  };

  // Start continuous burst capture loop
  const handleStartCapture = () => {
    if (!selectedStudentId) {
      setStatusMessage('Please select a student before starting enrollment.');
      setFeedbackType('error');
      return;
    }
    if (!consentGiven) {
      setStatusMessage('Please check and confirm student biometric consent.');
      setFeedbackType('warning');
      return;
    }

    setIsCapturing(true);
    setIsPaused(false);
    setStatusMessage('Enrolling face samples... Please follow visual instructions.');
    setFeedbackType('info');

    // Burst loop: capture every 280ms
    if (captureLoopTimer.current) clearInterval(captureLoopTimer.current);
    captureLoopTimer.current = setInterval(async () => {
      if (!isCapturingRef.current || isPausedRef.current) return;
      await captureSingleFrame();
    }, 300);
  };

  const handlePauseCapture = () => {
    setIsPaused(true);
    setStatusMessage('Capture paused. Click Resume when ready.');
    setFeedbackType('info');
  };

  const handleResumeCapture = () => {
    setIsPaused(false);
    setStatusMessage('Resuming enrollment capture...');
    setFeedbackType('info');
  };

  const handleResetSamples = async () => {
    if (!selectedStudentId) return;
    if (window.confirm(`Are you sure you want to delete all face samples for student ID ${selectedStudentId}? This cannot be undone.`)) {
      if (captureLoopTimer.current) clearInterval(captureLoopTimer.current);
      setIsCapturing(false);
      setIsPaused(false);
      const res = await resetStudentSamplesApi(selectedStudentId, currentUser.role);
      if (res.success) {
        setSampleCount(0);
        setStatusMessage(res.message);
        setFeedbackType('info');
      } else {
        setStatusMessage(res.error || 'Failed to reset samples.');
        setFeedbackType('error');
      }
    }
  };

  // Model Retraining Handler
  const handleTriggerRetrain = async () => {
    setIsRetraining(true);
    const triggerRes = await triggerRetrainModelApi(currentUser.role);
    if (!triggerRes.success) {
      setIsRetraining(false);
      setStatusMessage(triggerRes.message || 'Failed to trigger training.');
      setFeedbackType('error');
      return;
    }

    setStatusMessage('Retraining model asynchronously in background...');
    setFeedbackType('info');

    // Poll status every 800ms
    const timer = setInterval(async () => {
      const statusRes = await fetchRetrainStatusApi();
      setTrainStatus(statusRes);
      if (statusRes.status === 'completed') {
        clearInterval(timer);
        setIsRetraining(false);
        setStatusMessage(statusRes.message || 'Retraining completed successfully!');
        setFeedbackType('success');
        confetti({ particleCount: 90, spread: 80 });
      } else if (statusRes.status === 'failed') {
        clearInterval(timer);
        setIsRetraining(false);
        setStatusMessage(statusRes.message || 'Retraining failed.');
        setFeedbackType('error');
      }
    }, 800);
    setTrainPollingTimer(timer);
  };

  if (!isOpen) return null;

  // Role validation check
  const isAuthorized = currentUser.role !== 'student';
  const progressPct = Math.min(100, Math.round((sampleCount / targetSamples) * 100));
  const activeGuidance = GUIDANCE_STEPS.find(
    (step) => progressPct >= step.minPct && progressPct < step.maxPct
  ) || GUIDANCE_STEPS[0];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 7, 15, 0.88)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
      overflowY: 'auto'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '880px',
        maxHeight: '92vh',
        overflowY: 'auto',
        borderRadius: '16px',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '24px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-emerald">
                <Sparkles size={12} /> Web Biometric Engine
              </span>
              <span className="badge badge-indigo">
                <Cpu size={12} /> LBPH Face Classifier
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={22} className="text-emerald-400" /> Web-Based Face Enrollment & Retraining
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Capture high-fidelity facial geometry samples directly via browser webcam with real-time biometric quality validation.
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '6px',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Security / RBAC Banner */}
        {!isAuthorized ? (
          <div style={{
            padding: '16px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: '10px',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Lock size={20} />
            <div>
              <div style={{ fontWeight: 600 }}>Access Restricted</div>
              <div style={{ fontSize: '0.82rem' }}>Only authorized trainers and institution administrators can enroll student biometrics or replace face classifiers.</div>
            </div>
          </div>
        ) : (
          <>
            {/* Step 1: Student Selection & Target Samples */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr',
              gap: '16px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '16px',
              borderRadius: '12px'
            }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  SELECT STUDENT RECORD <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  disabled={isCapturing}
                  style={{
                    width: '100%',
                    background: '#090d1a',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: '#f8fafc',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Choose Student to Enroll --</option>
                  {studentsList.map((s) => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.name} (ID: {s.student_id} | {s.department || 'CSE'})
                    </option>
                  ))}
                </select>
                {selectedStudent && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <span>Roll: <strong style={{ color: '#e2e8f0' }}>{selectedStudent.roll_number || '2400300100305'}</strong></span>
                    <span>•</span>
                    <span>Dept: <strong style={{ color: '#e2e8f0' }}>{selectedStudent.department || 'CSE'}</strong></span>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  TARGET SAMPLE COUNT
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[50, 75, 100].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setTargetSamples(count)}
                      disabled={isCapturing}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: targetSamples === count ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                        background: targetSamples === count ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                        color: targetSamples === count ? '#34d399' : '#94a3b8',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {count} samples
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Consent Notice */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '10px'
            }}>
              <input
                type="checkbox"
                id="enrollConsent"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
              />
              <label htmlFor="enrollConsent" style={{ fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                <strong style={{ color: '#f8fafc' }}>Biometric Notice & Institutional Consent:</strong> I certify that authorized student consent has been obtained. Biometric samples are transformed into 200×200 normalized face feature maps solely for institutional attendance verification under institutional security policy.
              </label>
            </div>

            {/* Main Stage: Live Preview & Quality Controls */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr',
              gap: '20px',
              alignItems: 'start'
            }}>
              {/* Left Column: Live Webcam View with Target Oval Overlay */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4/3',
                  background: '#040711',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: isCapturing ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: 'scaleX(-1)' // Mirror for natural look
                    }}
                  />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />

                  {/* Face Guide Target Box / Oval */}
                  <div style={{
                    position: 'absolute',
                    width: '52%',
                    height: '66%',
                    borderRadius: '50%',
                    border: `2px dashed ${lastQuality?.error ? '#f87171' : isCapturing ? '#34d399' : 'rgba(255, 255, 255, 0.35)'}`,
                    boxShadow: isCapturing ? '0 0 20px rgba(16, 185, 129, 0.25)' : 'none',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.4)'
                    }} />
                  </div>

                  {/* Top-left Live Camera Status Tag */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(4px)',
                    fontSize: '0.72rem',
                    color: cameraActive ? '#34d399' : '#f87171',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: cameraActive ? '#10b981' : '#ef4444',
                      boxShadow: cameraActive ? '0 0 8px #10b981' : 'none'
                    }} />
                    {cameraActive ? 'Camera Live' : 'Camera Inactive'}
                  </div>

                  {/* Top-right Current Guidance Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: 'rgba(99, 102, 241, 0.85)',
                    fontSize: '0.72rem',
                    color: '#ffffff',
                    fontWeight: 600
                  }}>
                    {activeGuidance.badge}
                  </div>

                  {/* Camera Not Active or Error Placeholder */}
                  {!cameraActive && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: '#070b19',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '20px',
                      textAlign: 'center',
                      gap: '10px'
                    }}>
                      <Camera size={44} style={{ color: '#475569' }} />
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        {cameraError || 'Consent required to activate webcam stream.'}
                      </div>
                      {consentGiven && (
                        <button
                          type="button"
                          onClick={startCamera}
                          style={{
                            background: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Allow Camera Access
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Dynamic On-Screen Direction Banner */}
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  color: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <Eye size={18} className="text-cyan-400" />
                  <span>{activeGuidance.instruction}</span>
                </div>
              </div>

              {/* Right Column: Progress, Quality Telemetry & Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Progress Bar Card */}
                <div style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      SAMPLE ACQUISITION PROGRESS
                    </span>
                    <span style={{ fontSize: '0.88rem', color: '#10b981', fontWeight: 700 }}>
                      {sampleCount} / {targetSamples} ({progressPct}%)
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div style={{
                    width: '100%',
                    height: '10px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    borderRadius: '5px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${progressPct}%`,
                      height: '100%',
                      background: progressPct >= 100 
                        ? 'linear-gradient(90deg, #10b981, #06b6d4)' 
                        : 'linear-gradient(90deg, #6366f1, #10b981)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
                    <span>Min for training: 20</span>
                    <span>Optimal: {targetSamples} samples</span>
                  </div>
                </div>

                {/* Quality Telemetry Feedback */}
                <div style={{
                  padding: '14px',
                  background: feedbackType === 'error' ? 'rgba(239, 68, 68, 0.1)'
                    : feedbackType === 'warning' ? 'rgba(245, 158, 11, 0.1)'
                    : feedbackType === 'success' ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(99, 102, 241, 0.08)',
                  border: `1px solid ${
                    feedbackType === 'error' ? '#ef4444'
                    : feedbackType === 'warning' ? '#f59e0b'
                    : feedbackType === 'success' ? '#10b981'
                    : 'rgba(99, 102, 241, 0.3)'
                  }`,
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#f8fafc' }}>
                    {feedbackType === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
                    {feedbackType === 'warning' && <AlertCircle size={16} className="text-amber-400" />}
                    {feedbackType === 'error' && <AlertCircle size={16} className="text-red-400" />}
                    {feedbackType === 'info' && <Info size={16} className="text-indigo-400" />}
                    <span>Quality Status & Feedback</span>
                  </div>
                  <div style={{ color: '#cbd5e1' }}>{statusMessage}</div>

                  {lastQuality && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '0.72rem', color: '#94a3b8' }}>
                      <span>Sharpness: <strong style={{ color: lastQuality.sharpness >= 28 ? '#34d399' : '#f87171' }}>{lastQuality.sharpness}</strong> (≥28 required)</span>
                      <span>•</span>
                      <span>Lighting: <strong style={{ color: lastQuality.brightness >= 40 && lastQuality.brightness <= 225 ? '#34d399' : '#f87171' }}>{lastQuality.brightness}</strong> (40–225)</span>
                    </div>
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {!isCapturing ? (
                    <button
                      type="button"
                      onClick={handleStartCapture}
                      disabled={!cameraActive || !selectedStudentId || !consentGiven}
                      style={{
                        padding: '12px 18px',
                        background: (!cameraActive || !selectedStudentId || !consentGiven) 
                          ? 'rgba(255,255,255,0.08)' 
                          : 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        cursor: (!cameraActive || !selectedStudentId || !consentGiven) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <Play size={16} /> Start Automatic Burst Enrollment
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {isPaused ? (
                        <button
                          type="button"
                          onClick={handleResumeCapture}
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            background: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <Play size={16} /> Resume
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handlePauseCapture}
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            background: 'rgba(245, 158, 11, 0.2)',
                            color: '#fbbf24',
                            border: '1px solid #f59e0b',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <Pause size={16} /> Pause
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setIsCapturing(false);
                          setIsPaused(false);
                          if (captureLoopTimer.current) clearInterval(captureLoopTimer.current);
                        }}
                        style={{
                          padding: '10px 14px',
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          border: '1px solid #ef4444',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Stop
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleResetSamples}
                      disabled={sampleCount === 0 || isCapturing}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        color: sampleCount > 0 ? '#fca5a5' : '#64748b',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: sampleCount > 0 ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <RotateCcw size={14} /> Clear / Retake Samples
                    </button>
                  </div>
                </div>

                {/* Retrain Action Card */}
                <div style={{
                  padding: '14px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Cpu size={16} className="text-indigo-400" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>
                        Retrain LBPH Face Classifier
                      </span>
                    </div>
                    {trainStatus?.status && (
                      <span className={`badge ${
                        trainStatus.status === 'completed' ? 'badge-emerald' : 
                        trainStatus.status === 'failed' ? 'badge-rose' : 'badge-amber'
                      }`}>
                        {trainStatus.status}
                      </span>
                    )}
                  </div>
                  
                  {isRetraining && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#cbd5e1' }}>
                        <span>{trainStatus?.message || 'Retraining classifier in background thread...'}</span>
                        <span>{trainStatus?.progress || 10}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${trainStatus?.progress || 10}%`, height: '100%', background: '#6366f1', transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleTriggerRetrain}
                    disabled={isRetraining || sampleCount < 10}
                    style={{
                      padding: '10px 14px',
                      background: (isRetraining || sampleCount < 10) 
                        ? 'rgba(255, 255, 255, 0.06)' 
                        : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      color: (isRetraining || sampleCount < 10) ? '#64748b' : '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: (isRetraining || sampleCount < 10) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <RefreshCw size={14} className={isRetraining ? 'spin' : ''} />
                    {isRetraining ? 'Retraining Model...' : 'Retrain & Deploy Updated Model'}
                  </button>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Atomic backup (`classifier.xml.bak`) created before deploying new model. Safely hot-reloads memory recognizer without downtime.
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
