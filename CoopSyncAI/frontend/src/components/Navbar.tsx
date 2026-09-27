import React from 'react';
import { 
  LayoutDashboard, 
  Camera, 
  QrCode, 
  GraduationCap, 
  BookOpen, 
  Award, 
  Briefcase, 
  Bot, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  UserCheck,
  Calendar,
  Cpu
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile;
  setCurrentUser: (u: UserProfile) => void;
  allUsers: UserProfile[];
  isOnline: boolean;
  offlineCount: number;
  onSyncOffline: () => void;
  isSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  setCurrentUser,
  allUsers,
  isOnline,
  offlineCount,
  onSyncOffline,
  isSyncing,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Analytics', icon: LayoutDashboard },
    { id: 'face-attendance', label: 'Face AI', icon: Camera, highlight: true },
    { id: 'qr-attendance', label: 'QR Attendance', icon: QrCode },
    { id: 'programmes', label: 'Programmes', icon: Calendar },
    { id: 'students', label: 'Student ERP', icon: GraduationCap },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'jobs', label: 'Job Portal', icon: Briefcase },
    { id: 'ai-assistant', label: 'AI Advisor', icon: Bot },
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(10, 13, 24, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <UserCheck size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                CoopSync <span className="gradient-text">AI</span>
              </span>
              <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                NCCT Enterprise ERP
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Cooperative ERP, Face Biometrics & Employment Ecosystem
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          overflowX: 'auto'
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: isActive 
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(6, 182, 212, 0.2) 100%)' 
                    : 'transparent',
                  color: isActive ? '#f8fafc' : 'var(--text-secondary)',
                  borderBottom: isActive ? '2px solid #6366f1' : '2px solid transparent',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={16} color={isActive ? '#38bdf8' : 'currentColor'} />
                <span>{item.label}</span>
                {item.highlight && (
                  <span className="live-indicator" style={{ marginLeft: '2px' }} title="Active AI Engine" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Status & User Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Offline Sync Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isOnline ? (
              <span className="badge badge-emerald" title="Connected to Backend API">
                <Wifi size={12} /> Live Sync
              </span>
            ) : (
              <span className="badge badge-gold" title="Offline Mode: Records queued locally">
                <WifiOff size={12} /> Offline Mode
              </span>
            )}

            {offlineCount > 0 && (
              <button
                onClick={onSyncOffline}
                disabled={isSyncing}
                className="gradient-btn"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                title="Click to sync pending attendance"
              >
                <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                Sync ({offlineCount})
              </button>
            )}
          </div>

          {/* Current User Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px 12px 4px 6px',
            borderRadius: '30px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #6366f1'
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const selected = allUsers.find(u => u.id === Number(e.target.value));
                  if (selected) setCurrentUser(selected);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id} style={{ background: '#0f1527', color: '#f8fafc' }}>
                    {u.name} ({u.role.toUpperCase()})
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.65rem', color: '#38bdf8' }}>
                ID: {currentUser.student_id || 'ADMIN'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
