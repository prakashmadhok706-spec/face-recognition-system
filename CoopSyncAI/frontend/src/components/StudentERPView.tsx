import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles
} from 'lucide-react';
import { fetchStudents, addStudentApi, captureSampleApi } from '../api';
import { UserProfile } from '../types';
import confetti from 'canvas-confetti';

interface StudentERPViewProps {
  currentUser: UserProfile;
}

export const StudentERPView: React.FC<StudentERPViewProps> = ({ currentUser }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // student.py Modal State
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [newStudentId, setNewStudentId] = useState<string>('5025088');
  const [newStudentName, setNewStudentName] = useState<string>('Rahul Singh');
  const [newRollNo, setNewRollNo] = useState<string>('2400300100305');
  const [newGender, setNewGender] = useState<string>('Male');
  const [newDept, setNewDept] = useState<string>('Dairy Cooperative Management');
  const [newYear, setNewYear] = useState<string>('4th Year');
  const [newCourse, setNewCourse] = useState<string>('B.Tech');
  const [newSem, setNewSem] = useState<string>('Batch 2026');
  const [sampleCount, setSampleCount] = useState<number>(0);
  const [registerMsg, setRegisterMsg] = useState<string | null>(null);

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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await addStudentApi({
        id: newStudentId,
        name: newStudentName,
        roll: newRollNo,
        gender: newGender,
        dept: newDept,
        year: newYear,
        course: newCourse,
        sem: newSem
      });
      setRegisterMsg(res.message);
      confetti({ particleCount: 50, spread: 60 });
      loadStudents();
    } catch (err: any) {
      setRegisterMsg('Registration error: ' + err.message);
    }
  };

  const startSampleCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      console.warn('Camera feed error:', e);
    }
  };

  const handleCapturePhotoSample = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const b64 = canvas.toDataURL('image/jpeg', 0.85);

    try {
      const res = await captureSampleApi({
        student_id: newStudentId,
        student_name: newStudentName,
        image_base64: b64
      });
      setSampleCount(res.samples_count);
      setRegisterMsg(res.message);
    } catch (err: any) {
      setRegisterMsg('Sample capture error: ' + err.message);
    }
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
            Unified student roster matching SIH26087 ERP specifications. Track attendance percentages, 
            skills development, course credits, and verified digital credentials in real time.
          </p>
        </div>

        {/* Search, Filter & Register Student (student.py) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="gradient-btn"
            style={{ padding: '10px 18px', fontSize: '0.85rem' }}
          >
            <UserPlus size={16} /> Register Student (student.py)
          </button>

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

            {/* Skills Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {student.skills?.split(',').map((skill: string, idx: number) => (
                <span
                  key={idx}
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
        ))}
      </div>

      {/* student.py Register Student & Dataset Photo Capture Modal */}
      {showRegisterModal && (
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
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '680px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', color: '#f8fafc' }}>student.py – Student Registration & Dataset Capture</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Saves details to <code>students.csv</code> & photos to <code>dataset/</code></p>
              </div>
              <span className="badge badge-emerald">students.csv Writer</span>
            </div>

            {registerMsg && (
              <div style={{ padding: '10px 14px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid #6366f1', borderRadius: '8px', color: '#c7d2fe', fontSize: '0.82rem', marginBottom: '14px' }}>
                {registerMsg}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Student ID</label>
                  <input type="text" value={newStudentId} onChange={(e) => setNewStudentId(e.target.value)} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', color: '#f8fafc' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Student Full Name</label>
                  <input type="text" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', color: '#f8fafc' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Roll Number</label>
                  <input type="text" value={newRollNo} onChange={(e) => setNewRollNo(e.target.value)} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', color: '#f8fafc' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Gender</label>
                  <select value={newGender} onChange={(e) => setNewGender(e.target.value)} style={{ width: '100%', background: '#0f1527', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', color: '#f8fafc' }}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Department</label>
                  <input type="text" value={newDept} onChange={(e) => setNewDept(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', color: '#f8fafc' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Semester / Batch</label>
                  <input type="text" value={newSem} onChange={(e) => setNewSem(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', color: '#f8fafc' }} />
                </div>
              </div>

              {/* Photo Dataset Sample Tool (student.py feature) */}
              <div className="glass-card" style={{ padding: '14px', marginTop: '6px', borderLeft: '3px solid #06b6d4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#f8fafc', fontWeight: 600 }}>Dataset Face Photo Capture Tool</span>
                  <button type="button" onClick={startSampleCamera} style={{ background: 'rgba(6,182,212,0.2)', border: '1px solid #06b6d4', color: '#38bdf8', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}>
                    Start Camera Feed
                  </button>
                </div>

                <div style={{ width: '100%', height: '140px', background: '#05070e', borderRadius: '6px', overflow: 'hidden', marginBottom: '8px' }}>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Saved Samples: {sampleCount}</span>
                  <button type="button" onClick={handleCapturePhotoSample} className="gradient-btn gradient-btn-cyan" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
                    <Camera size={14} /> Take Photo Sample
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowRegisterModal(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="gradient-btn" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                  Save Student Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
