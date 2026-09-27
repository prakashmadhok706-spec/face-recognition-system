import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  UserPlus, 
  Sparkles, 
  Camera, 
  Database, 
  FileSpreadsheet, 
  FolderOpen, 
  CheckCircle2, 
  RefreshCw, 
  Play, 
  ExternalLink, 
  Trash2, 
  Upload,
  ShieldCheck, 
  Clock, 
  HelpCircle, 
  Code 
} from 'lucide-react';
import { 
  addStudentApi, 
  captureSampleApi, 
  trainModelApi, 
  fetchAttendanceLogs, 
  clearAttendanceLogsApi, 
  launchDesktopOpenCVCamera,
  recognizeFaceImage
} from '../api';
import { UserProfile, AttendanceRecord } from '../types';
import confetti from 'canvas-confetti';

interface PythonSuiteViewProps {
  currentUser: UserProfile;
}

export const PythonSuiteView: React.FC<PythonSuiteViewProps> = ({ currentUser }) => {
  const [activeModule, setActiveModule] = useState<'main' | 'student' | 'train' | 'detector' | 'attendance'>('main');

  // student.py State
  const [studentId, setStudentId] = useState('5025088');
  const [studentName, setStudentName] = useState('Rahul Singh');
  const [rollNo, setRollNo] = useState('2400300100305');
  const [gender, setGender] = useState('Male');
  const [dept, setDept] = useState('Dairy Cooperative Management');
  const [year, setYear] = useState('4th Year');
  const [course, setCourse] = useState('B.Tech');
  const [sem, setSem] = useState('Sem 7');
  const [sampleCount, setSampleCount] = useState(0);
  const [studentMsg, setStudentMsg] = useState<string | null>(null);

  // train.py State
  const [trainProgress, setTrainProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [trainStatus, setTrainStatus] = useState('Status: Model Ready (classifier.xml)');
  const [trainMetrics, setTrainMetrics] = useState<any>(null);

  // facedetector.py State
  const [detectorActive, setDetectorActive] = useState(false);
  const [detectorMsg, setDetectorMsg] = useState<string | null>(null);
  const [detectorResult, setDetectorResult] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // attendence.py State
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const res = await fetchAttendanceLogs();
      setLogs(res);
    } catch (e) {
      console.error(e);
    }
  };

  // --- student.py Actions ---
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await addStudentApi({
        id: studentId,
        name: studentName,
        roll: rollNo,
        gender,
        dept,
        year,
        course,
        sem
      });
      setStudentMsg(res.message);
      confetti({ particleCount: 40, spread: 50 });
    } catch (e: any) {
      setStudentMsg('Error adding student to CSV: ' + e.message);
    }
  };

  const handleCaptureSample = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const b64 = canvas.toDataURL('image/jpeg', 0.9);

    try {
      const res = await captureSampleApi({
        student_id: studentId,
        student_name: studentName,
        image_base64: b64
      });
      setSampleCount(res.samples_count);
      setStudentMsg(res.message);
    } catch (e: any) {
      setStudentMsg('Error saving sample photo: ' + e.message);
    }
  };

  // --- train.py Actions ---
  const handleTrainModel = async () => {
    setIsTraining(true);
    setTrainProgress(10);
    setTrainStatus('Scanning dataset/ directory for face samples...');

    const timer = setInterval(() => {
      setTrainProgress((prev) => {
        if (prev >= 90) {
          clearInterval(timer);
          return 90;
        }
        return prev + 20;
      });
    }, 300);

    try {
      const res = await trainModelApi();
      clearInterval(timer);
      setTrainProgress(100);
      setTrainMetrics(res);
      setTrainStatus(res.message);
      confetti({ particleCount: 70, spread: 70 });
    } catch (e: any) {
      clearInterval(timer);
      setTrainStatus('Training error: ' + e.message);
    } finally {
      setIsTraining(false);
    }
  };

  // --- facedetector.py Actions ---
  const startDetectorCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setDetectorActive(true);
      }
    } catch (e) {
      setDetectorMsg('Webcam feed unavailable or permission denied.');
    }
  };

  const handleRunScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const b64 = canvas.toDataURL('image/jpeg', 0.85);

    try {
      const res = await recognizeFaceImage(b64);
      setDetectorResult(res);
      if (res.success) {
        confetti({ particleCount: 50, spread: 60 });
        loadLogs();
      }
    } catch (e: any) {
      setDetectorResult({ success: false, error: e.message });
    }
  };

  // --- attendence.py Actions ---
  const handleClearLogs = async () => {
    if (window.confirm('Reset all records in attendance.csv?')) {
      await clearAttendanceLogsApi();
      loadLogs();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Banner */}
      <div className="glass-panel" style={{
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        borderLeft: '4px solid #6366f1'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#f8fafc' }}>
              Integrated Python AI & Computer Vision Suite
            </h2>
            <span className="badge badge-indigo">
              <Cpu size={12} /> OpenCV LBPH Engine
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '780px' }}>
            All features from your desktop Python scripts (<b>student.py</b>, <b>train.py</b>, <b>facedetector.py</b>, 
            <b>attendence.py</b>, and <b>main.py</b>) running directly inside the web interface.
          </p>
        </div>

        <button
          onClick={launchDesktopOpenCVCamera}
          className="gradient-btn"
          style={{ padding: '10px 18px', fontSize: '0.85rem' }}
        >
          <ExternalLink size={16} /> Launch Python Desktop GUI
        </button>
      </div>

      {/* Module Nav Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        background: 'rgba(255, 255, 255, 0.03)',
        padding: '6px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        overflowX: 'auto'
      }}>
        {[
          { id: 'main', label: 'main.py (Dashboard Launcher)', icon: Cpu },
          { id: 'student', label: 'student.py (Student Details)', icon: UserPlus },
          { id: 'train', label: 'train.py (Train Model)', icon: Database },
          { id: 'detector', label: 'facedetector.py (Face Recognition)', icon: Camera },
          { id: 'attendance', label: 'attendence.py (Attendance Viewer)', icon: FileSpreadsheet }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveModule(item.id as any);
                if (item.id === 'detector') startDetectorCamera();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                background: isActive ? '#6366f1' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* MODULE 1: main.py Launcher */}
      {activeModule === 'main' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#f8fafc', marginBottom: '16px' }}>
            main.py Quick Actions Dashboard
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px'
          }}>
            {[
              { title: 'Student Details', file: 'student.py', icon: UserPlus, color: '#6366f1', action: () => setActiveModule('student') },
              { title: 'Face Detector', file: 'facedetector.py', icon: Camera, color: '#10b981', action: () => { setActiveModule('detector'); startDetectorCamera(); } },
              { title: 'Attendance Log', file: 'attendence.py', icon: FileSpreadsheet, color: '#f59e0b', action: () => setActiveModule('attendance') },
              { title: 'Train Data', file: 'train.py', icon: Database, color: '#06b6d4', action: () => setActiveModule('train') },
              { title: 'Photos Dataset', file: 'dataset/', icon: FolderOpen, color: '#ec4899', action: () => setActiveModule('student') },
              { title: 'Help Desk', file: 'Help', icon: HelpCircle, color: '#8b5cf6', action: () => alert('CoopSync AI Help Desk: Contact NCCT Support Team.') },
              { title: 'Developer Info', file: 'Dev', icon: Code, color: '#14b8a6', action: () => alert('CoopSync AI Core System • Enterprise Edition') }
            ].map((btn, idx) => {
              const Icon = btn.icon;
              return (
                <div
                  key={idx}
                  onClick={btn.action}
                  className="glass-card-interactive"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    borderTop: `4px solid ${btn.color}`
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `${btn.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={24} color={btn.color} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h4 style={{ fontSize: '1rem', color: '#f8fafc' }}>{btn.title}</h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{btn.file}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODULE 2: student.py Details Form */}
      {activeModule === 'student' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#f8fafc' }}>student.py – Student Management System</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Add student records to students.csv and capture dataset photos</p>
            </div>
            <span className="badge badge-indigo">students.csv Sync</span>
          </div>

          {studentMsg && (
            <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid #6366f1', borderRadius: '8px', color: '#c7d2fe', fontSize: '0.85rem', marginBottom: '16px' }}>
              {studentMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Student ID</label>
                  <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', color: '#f8fafc' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Full Name</label>
                  <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', color: '#f8fafc' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Roll No</label>
                  <input type="text" value={rollNo} onChange={(e) => setRollNo(e.target.value)} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', color: '#f8fafc' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} style={{ width: '100%', background: '#0f1527', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', color: '#f8fafc' }}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Department</label>
                  <input type="text" value={dept} onChange={(e) => setDept(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', color: '#f8fafc' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Year & Semester</label>
                  <input type="text" value={sem} onChange={(e) => setSem(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', color: '#f8fafc' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="gradient-btn" style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
                  <UserPlus size={16} /> Save Record to students.csv
                </button>
              </div>
            </form>

            {/* Photo Dataset Sample Capture */}
            <div className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontSize: '1rem', color: '#f8fafc' }}>Take Dataset Photo Samples</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saves images to <code>dataset/{studentId}/</code> for model training</p>
              
              <div style={{ width: '100%', height: '180px', background: '#05070e', borderRadius: '8px', overflow: 'hidden' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>Captured: {sampleCount} samples</span>
                <button onClick={handleCaptureSample} className="gradient-btn gradient-btn-cyan" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                  <Camera size={14} /> Take Photo Sample
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: train.py Trainer */}
      {activeModule === 'train' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#f8fafc' }}>train.py – Train Model Data</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Scans dataset/ directory and generates data/classifier.xml & data/labels.csv</p>
            </div>
            <span className="badge badge-emerald">LBPH Recognizer</span>
          </div>

          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button
                onClick={handleTrainModel}
                disabled={isTraining}
                className="gradient-btn gradient-btn-success"
                style={{ padding: '12px 24px', fontSize: '0.95rem' }}
              >
                {isTraining ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} />}
                {isTraining ? 'Training LBPH Model...' : 'Start Training Model'}
              </button>

              <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600 }}>
                {trainStatus}
              </span>
            </div>

            {/* Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>Training Progress</span>
                <span>{trainProgress}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${trainProgress}%`, height: '100%', background: '#10b981', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {trainMetrics && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px', fontSize: '0.82rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Samples Processed:</span> <strong style={{ color: '#38bdf8' }}>{trainMetrics.samples_processed}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Classes Trained:</span> <strong style={{ color: '#10b981' }}>{trainMetrics.classes_trained}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Output File:</span> <strong>data/classifier.xml</strong></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODULE 4: facedetector.py */}
      {activeModule === 'detector' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#f8fafc' }}>facedetector.py – Real-Time Detector</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Predicts face ID and appends log to attendance.csv</p>
            </div>
            <span className="badge badge-cyan">attendance.csv Writer</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ width: '100%', height: '300px', background: '#05070e', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <button onClick={handleRunScan} className="gradient-btn" style={{ padding: '12px 20px', fontSize: '0.95rem' }}>
                <Camera size={18} /> Run Face Detection & Mark Attendance
              </button>

              {detectorResult && (
                <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '10px' }}>
                  <h4 style={{ color: '#f8fafc', fontSize: '1.05rem' }}>{detectorResult.student_name}</h4>
                  <p style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: '4px' }}>{detectorResult.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 5: attendence.py Viewer */}
      {activeModule === 'attendance' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#f8fafc' }}>attendence.py – Attendance Records Viewer</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reads attendance.csv data store</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleClearLogs} style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', color: '#f8fafc', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer' }}>
                <Trash2 size={14} /> Clear Logs
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th style={{ padding: '12px 16px' }}>ID</th>
                  <th style={{ padding: '12px 16px' }}>Student Name</th>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                  <th style={{ padding: '12px 16px' }}>Time</th>
                  <th style={{ padding: '12px 16px' }}>Method</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px', color: '#38bdf8', fontWeight: 600 }}>{log.student_id}</td>
                    <td style={{ padding: '12px 16px', color: '#f8fafc' }}>{log.student_name}</td>
                    <td style={{ padding: '12px 16px' }}>{log.date}</td>
                    <td style={{ padding: '12px 16px' }}>{log.time}</td>
                    <td style={{ padding: '12px 16px' }}>{log.method}</td>
                    <td style={{ padding: '12px 16px' }}><span className="badge badge-emerald">Present</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
