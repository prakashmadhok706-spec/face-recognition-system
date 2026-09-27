import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { FaceAttendanceView } from './components/FaceAttendanceView';
import { QRAttendanceView } from './components/QRAttendanceView';
import { AnalyticsView } from './components/AnalyticsView';
import { StudentERPView } from './components/StudentERPView';
import { CoursesView } from './components/CoursesView';
import { CertificatesView } from './components/CertificatesView';
import { EmploymentView } from './components/EmploymentView';
import { AIChatModal } from './components/AIChatModal';
import { ProgrammesView } from './components/ProgrammesView';
import { fetchHealth, fetchStudents, syncOfflineAttendance } from './api';
import { UserProfile } from './types';


const DEFAULT_USERS: UserProfile[] = [
  {
    id: 1,
    student_id: '5025088',
    roll_number: '2400300100305',
    name: 'Puneet',
    email: 'puneet@coopsync.edu',
    role: 'student',
    department: 'Computer Science & Engineering',
    semester: 'Sem 5',
    degree: 'B.Tech',
    skills: 'Python, OpenCV, Machine Learning, React, FastAPI',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
  },
  {
    id: 2,
    student_id: '4868448',
    roll_number: '2400300100314',
    name: 'Ranjan',
    email: 'ranjan@coopsync.edu',
    role: 'student',
    department: 'Computer Science & Engineering',
    semester: 'Sem 5',
    degree: 'B.Tech',
    skills: 'Python, Data Science, SQL, Deep Learning',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150'
  },
  {
    id: 3,
    student_id: 'NCCT001',
    roll_number: 'NCCT-ADM-01',
    name: 'NCCT National Admin',
    email: 'ncct.admin@coopsync.gov.in',
    role: 'ncct_admin',
    department: 'National Council for Cooperative Training',
    semester: 'HQ Admin',
    degree: 'Ph.D',
    skills: 'National Monitoring, Policy, ERP Governance',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
  },
  {
    id: 4,
    student_id: 'ADMIN001',
    roll_number: 'EMP-ADM-01',
    name: 'Dr. Anita Verma (VAMNICOM Director)',
    email: 'admin@coopsync.edu',
    role: 'institution_admin',
    department: 'VAMNICOM Pune Administration',
    semester: 'Director',
    degree: 'Ph.D',
    skills: 'ERP Management, Governance, Education Policy',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
  },
  {
    id: 5,
    student_id: 'TRN001',
    roll_number: 'EMP-TRN-04',
    name: 'Prof. Rajesh Sharma (Faculty)',
    email: 'trainer@coopsync.edu',
    role: 'trainer',
    department: 'Computer Vision & AI',
    semester: 'Faculty',
    degree: 'M.Tech',
    skills: 'Deep Learning, OpenCV, Embedded Systems',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
  },
  {
    id: 6,
    student_id: 'EMP001',
    roll_number: 'AMUL-HR-01',
    name: 'AMUL Recruiter / Employer',
    email: 'careers@amul.coop',
    role: 'employer',
    department: 'AMUL Talent Acquisition',
    semester: 'HR Manager',
    skills: 'Dairy Operations, Placement, Recruitment',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'
  }
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [allUsers, setAllUsers] = useState<UserProfile[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USERS[0]);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('coopsync_offline_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    checkHealth();
    loadUsers();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    const health = await fetchHealth();
    if (health.status === 'healthy') {
      setIsOnline(true);
      setSystemHealth(health);
    } else {
      setIsOnline(false);
    }
  };

  const loadUsers = async () => {
    try {
      const students = await fetchStudents();
      if (students && students.length > 0) {
        const merged = [
          ...students.map((s: any) => ({
            id: s.id,
            student_id: s.student_id,
            roll_number: s.roll_number,
            name: s.name,
            email: s.email,
            role: 'student' as const,
            department: s.department,
            semester: s.semester,
            skills: s.skills,
            avatar: s.avatar
          })),
          DEFAULT_USERS[2], // NCCT Admin
          DEFAULT_USERS[3], // Institution Admin
          DEFAULT_USERS[4], // Trainer
          DEFAULT_USERS[5]  // Employer
        ];
        setAllUsers(merged);
      }
    } catch (e) {
      console.warn('Using default users', e);
    }
  };

  const handleSyncOffline = async () => {
    if (offlineQueue.length === 0) return;
    setIsSyncing(true);
    try {
      const res = await syncOfflineAttendance(offlineQueue);
      if (res.success) {
        setOfflineQueue([]);
        localStorage.removeItem('coopsync_offline_queue');
        alert(res.message);
      }
    } catch (e) {
      alert('Could not sync records. Backend may be offline.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAttendanceMarked = () => {
    checkHealth();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        allUsers={allUsers}
        isOnline={isOnline}
        offlineCount={offlineQueue.length}
        onSyncOffline={handleSyncOffline}
        isSyncing={isSyncing}
      />

      {/* Main Container */}
      <main style={{
        flex: 1,
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        padding: '28px 24px 60px 24px'
      }}>
        {activeTab === 'dashboard' && <AnalyticsView />}
        {activeTab === 'programmes' && <ProgrammesView currentUser={currentUser} />}
        {activeTab === 'face-attendance' && (
          <FaceAttendanceView
            currentUser={currentUser}
            onAttendanceMarked={handleAttendanceMarked}
          />
        )}
        {activeTab === 'qr-attendance' && (
          <QRAttendanceView
            currentUser={currentUser}
            onAttendanceMarked={handleAttendanceMarked}
          />
        )}
        {activeTab === 'students' && <StudentERPView currentUser={currentUser} />}
        {activeTab === 'courses' && <CoursesView currentUser={currentUser} />}
        {activeTab === 'certificates' && <CertificatesView currentUser={currentUser} />}
        {activeTab === 'jobs' && <EmploymentView currentUser={currentUser} />}
        {activeTab === 'ai-assistant' && <AIChatModal currentUser={currentUser} />}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(10, 13, 24, 0.95)',
        padding: '24px',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <strong style={{ color: '#f8fafc' }}>CoopSync AI Ecosystem</strong> – Smart Education & Cooperative Digital Transformation
            <span style={{ margin: '0 8px' }}>•</span>
            <span style={{ color: '#38bdf8' }}>NCCT Enterprise ERP Platform</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>LBPH Face Classifier: <strong style={{ color: systemHealth?.classifier_loaded ? '#10b981' : '#f59e0b' }}>{systemHealth?.classifier_loaded ? 'Model Loaded (15MB)' : 'Active'}</strong></span>
            <span>Dataset: <strong>{systemHealth?.students_count || 10} Enrolled</strong></span>
            <span style={{ color: '#818cf8' }}>Enterprise Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
