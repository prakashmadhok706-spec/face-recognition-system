import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Smartphone, 
  UserCheck 
} from 'lucide-react';
import { generateQRAttendance, verifyQRAttendance } from '../api';
import { UserProfile } from '../types';
import confetti from 'canvas-confetti';

interface QRAttendanceViewProps {
  currentUser: UserProfile;
  onAttendanceMarked: () => void;
}

export const QRAttendanceView: React.FC<QRAttendanceViewProps> = ({
  currentUser,
  onAttendanceMarked
}) => {
  const [qrData, setQrData] = useState<any | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(30);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'trainer' | 'student'>('trainer');
  const [simulatedToken, setSimulatedToken] = useState<string>('');

  useEffect(() => {
    fetchNewQR();
  }, []);

  // Countdown timer for 30s QR expiry
  useEffect(() => {
    if (secondsLeft <= 0) {
      fetchNewQR();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const fetchNewQR = async () => {
    try {
      const res = await generateQRAttendance();
      setQrData(res);
      setSecondsLeft(res.expires_in_seconds || 30);
      setSimulatedToken(res.raw_token || '');
    } catch (e) {
      console.error('Failed to generate QR code', e);
    }
  };

  const handleVerifyStudentScan = async (tokenToUse?: string) => {
    setIsVerifying(true);
    setScanResult(null);
    try {
      const token = tokenToUse || simulatedToken || qrData?.raw_token;
      const res = await verifyQRAttendance(token, currentUser.student_id || '5025088');
      setScanResult(res);
      if (res.success && !res.is_duplicate) {
        confetti({ particleCount: 45, spread: 60 });
        onAttendanceMarked();
      }
    } catch (err: any) {
      setScanResult({ success: false, error: err.message });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Info */}
      <div className="glass-panel" style={{
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        borderLeft: '4px solid #06b6d4'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#f8fafc' }}>
              Dynamic QR Code Attendance Module
            </h2>
            <span className="badge badge-cyan">
              <Clock size={12} /> 30s Time-Expiring Hash
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '750px' }}>
            Fail-safe backup attendance when camera visibility is low. Generates dynamically salted QR codes 
            with 30-second auto-expiration, GPS geo-fencing validation, and one-time scan security.
          </p>
        </div>

        {/* View Switcher: Trainer Screen vs Student Mobile Scanner */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={() => setActiveTab('trainer')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'trainer' ? '#6366f1' : 'transparent',
              color: '#f8fafc',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Trainer Broadcast View
          </button>
          <button
            onClick={() => setActiveTab('student')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'student' ? '#06b6d4' : 'transparent',
              color: '#f8fafc',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Student Mobile Scanner
          </button>
        </div>
      </div>

      {activeTab === 'trainer' ? (
        /* Trainer Screen Broadcast */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px'
        }}>
          {/* QR Display Card */}
          <div className="glass-panel" style={{
            padding: '30px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <QrCode size={20} color="#06b6d4" />
              <h3 style={{ fontSize: '1.2rem' }}>Dynamic Classroom Attendance QR</h3>
            </div>

            {/* QR Box with Countdown indicator */}
            <div style={{
              position: 'relative',
              background: '#ffffff',
              padding: '16px',
              borderRadius: '18px',
              boxShadow: '0 0 35px rgba(6, 182, 212, 0.3)',
              display: 'inline-block'
            }}>
              {qrData ? (
                <img
                  src={qrData.qr_base64}
                  alt="Attendance QR"
                  style={{ width: '220px', height: '220px', display: 'block' }}
                />
              ) : (
                <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RefreshCw className="animate-spin" size={32} color="#6366f1" />
                </div>
              )}

              {/* Progress ring countdown */}
              <div style={{
                position: 'absolute',
                top: '-12px',
                right: '-12px',
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: secondsLeft <= 5 ? '#ef4444' : '#6366f1',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.9rem',
                border: '3px solid #0f1527',
                boxShadow: '0 0 15px rgba(0,0,0,0.5)',
                transition: 'background 0.3s'
              }}>
                {secondsLeft}s
              </div>
            </div>

            <div>
              <p style={{ fontWeight: 600, color: '#f8fafc' }}>
                Session: {qrData?.session_name || 'CoopSync Hall 4B'}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                This QR automatically rotates every 30 seconds to prevent unauthorized photo forwarding.
              </p>
            </div>

            <button
              onClick={fetchNewQR}
              className="gradient-btn"
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} /> Refresh Token Now
            </button>
          </div>

          {/* Security & Geo-Fencing Card */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#10b981" />
              <h3 style={{ fontSize: '1.2rem' }}>Attendance Security Parameters</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                    Anti-Proxy Expiration
                  </span>
                  <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>30s Active</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Cryptographic salt with SHA-256 prevents replay attacks and remote screen screenshots.
                </p>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="#f59e0b" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                      Geo-Fenced Perimeter Check
                    </span>
                  </div>
                  <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>50m Radius</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Campus boundary verification: 28.6139° N, 77.2090° E (Cooperative Skill Center).
                </p>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                    Duplicate Attendance Prevention
                  </span>
                  <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>Enforced</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  A student can only register their attendance once per lecture session or day.
                </p>
              </div>
            </div>

            {/* Quick Test Button for Demonstration */}
            <div style={{
              marginTop: 'auto',
              background: 'rgba(99, 102, 241, 0.08)',
              padding: '14px',
              borderRadius: '12px',
              border: '1px dashed rgba(99, 102, 241, 0.3)'
            }}>
              <p style={{ fontSize: '0.8rem', color: '#c7d2fe', marginBottom: '8px' }}>
                Simulate current student (<b>{currentUser.name}</b>) scanning this live QR code:
              </p>
              <button
                onClick={() => handleVerifyStudentScan()}
                disabled={isVerifying}
                className="gradient-btn"
                style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
              >
                {isVerifying ? 'Verifying QR Token...' : '⚡ Instant Scan & Mark as ' + currentUser.name}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Student Scanner View */
        <div className="glass-panel" style={{ padding: '30px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}>
              <Smartphone size={28} color="#06b6d4" />
            </div>
            <h3 style={{ fontSize: '1.3rem' }}>Scan Instructor's QR Code</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Logged in as: <b>{currentUser.name}</b> ({currentUser.student_id})
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Scanned QR Payload Token:
              </label>
              <input
                type="text"
                value={simulatedToken}
                onChange={(e) => setSimulatedToken(e.target.value)}
                placeholder="Scan or paste QR payload token..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <button
              onClick={() => handleVerifyStudentScan()}
              disabled={isVerifying || !simulatedToken}
              className="gradient-btn"
              style={{ padding: '14px', fontSize: '0.95rem' }}
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="animate-spin" size={16} /> Verifying Token...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} /> Submit Attendance Verification
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Verification Result Alert */}
      {scanResult && (
        <div className="glass-panel" style={{
          padding: '18px 24px',
          background: scanResult.success 
            ? (scanResult.is_duplicate ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)')
            : 'rgba(239, 68, 68, 0.1)',
          border: scanResult.success 
            ? (scanResult.is_duplicate ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)')
            : '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          {scanResult.success ? (
            scanResult.is_duplicate ? (
              <AlertCircle size={28} color="#f59e0b" style={{ flexShrink: 0 }} />
            ) : (
              <CheckCircle2 size={28} color="#10b981" style={{ flexShrink: 0 }} />
            )
          ) : (
            <AlertCircle size={28} color="#ef4444" style={{ flexShrink: 0 }} />
          )}
          <div>
            <h4 style={{ fontSize: '1rem', color: '#f8fafc' }}>
              {scanResult.success ? scanResult.message : 'QR Verification Failed'}
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {scanResult.success 
                ? `Student: ${scanResult.student_name} | Session: ${scanResult.session_name || 'Classroom'}`
                : scanResult.error}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
