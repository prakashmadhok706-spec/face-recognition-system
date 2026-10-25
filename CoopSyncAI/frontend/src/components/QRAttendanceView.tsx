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
  Navigation,
  Crosshair,
  Lock,
  Compass,
  AlertTriangle,
  Radio,
  Check,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { generateQRAttendance, verifyQRAttendance, fetchInstitutionConfig } from '../api';
import { UserProfile } from '../types';
import confetti from 'canvas-confetti';

interface QRAttendanceViewProps {
  currentUser: UserProfile;
  onAttendanceMarked: () => void;
}

interface GPSCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface InstitutionConfigData {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  allowed_radius_meters: number;
  max_accuracy_threshold: number;
  enforce_geofence: boolean;
  updated_at?: string;
}

// Client-side Haversine distance calculator for real-time visual feedback
function calculateHaversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000.0; // Earth radius in meters
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
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

  // Real GPS State
  const [instConfig, setInstConfig] = useState<InstitutionConfigData | null>(null);
  const [deviceCoords, setDeviceCoords] = useState<GPSCoords | null>(null);
  const [gpsPermission, setGpsPermission] = useState<'prompt' | 'granted' | 'denied' | 'unavailable'>('prompt');
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);
  const [isAcquiringGPS, setIsAcquiringGPS] = useState<boolean>(false);
  const [liveDistance, setLiveDistance] = useState<number | null>(null);

  useEffect(() => {
    fetchNewQR();
    loadInstitutionConfig();
    checkExistingPermission();
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

  // Check permission query if supported
  const checkExistingPermission = async () => {
    if (!('geolocation' in navigator)) {
      setGpsPermission('unavailable');
      return;
    }
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (status.state === 'granted') setGpsPermission('granted');
        else if (status.state === 'denied') setGpsPermission('denied');
        else setGpsPermission('prompt');

        status.onchange = () => {
          if (status.state === 'granted') setGpsPermission('granted');
          else if (status.state === 'denied') setGpsPermission('denied');
          else setGpsPermission('prompt');
        };
      } catch {
        // Fallback for browsers that don't support permissions.query for geolocation
      }
    }
  };

  const loadInstitutionConfig = async () => {
    try {
      const res = await fetchInstitutionConfig();
      if (res && res.success && res.config) {
        setInstConfig(res.config);
      }
    } catch (e) {
      console.warn('Failed to fetch institution geofence config', e);
    }
  };

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

  // Request real device GPS only when student triggers attendance
  const acquireDeviceGPS = (): Promise<GPSCoords> => {
    setIsAcquiringGPS(true);
    setGpsErrorMsg(null);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = new Error('Geolocation is not supported by this browser or device.');
        setGpsPermission('unavailable');
        setGpsErrorMsg(err.message);
        setIsAcquiringGPS(false);
        reject(err);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: GPSCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp || Date.now()
          };
          setDeviceCoords(coords);
          setGpsPermission('granted');
          setIsAcquiringGPS(false);

          // Calculate live distance if institution coords are loaded
          if (instConfig) {
            const dist = calculateHaversineMeters(
              coords.latitude,
              coords.longitude,
              instConfig.latitude,
              instConfig.longitude
            );
            setLiveDistance(dist);
          }
          resolve(coords);
        },
        (err) => {
          setIsAcquiringGPS(false);
          let errorText = 'Unable to retrieve your location.';
          if (err.code === 1) {
            setGpsPermission('denied');
            errorText = 'Location permission was denied. Please allow location access in your browser address bar/settings to verify attendance.';
          } else if (err.code === 2) {
            setGpsPermission('unavailable');
            errorText = 'GPS signal unavailable. Please ensure your device GPS / Location services are switched on.';
          } else if (err.code === 3) {
            errorText = 'GPS request timed out. Please ensure clear signal reception and retry.';
          }
          setGpsErrorMsg(errorText);
          reject(new Error(errorText));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  // Verify and mark attendance with real GPS telemetry
  const handleVerifyStudentScan = async (tokenToUse?: string) => {
    setIsVerifying(true);
    setScanResult(null);
    setGpsErrorMsg(null);

    try {
      // 1. Acquire real device GPS upon action (Requirement 1 & 2)
      let coords = deviceCoords;
      if (!coords) {
        coords = await acquireDeviceGPS();
      }

      const token = tokenToUse || simulatedToken || qrData?.raw_token;
      if (!token) {
        throw new Error('Please enter or scan an active classroom QR token.');
      }

      // 2. Transmit coordinates and session payload to backend attendance API (Requirement 6 & 7)
      const res = await verifyQRAttendance(token, currentUser.student_id || '5025088', {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        timestamp: coords.timestamp,
        session_id: qrData?.session_id,
        device_info: `${navigator.userAgent.slice(0, 80)}`
      });

      setScanResult(res);

      if (res.success && !res.is_duplicate) {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
        onAttendanceMarked();
      }
    } catch (err: any) {
      setScanResult({
        success: false,
        error: err.message || 'GPS or verification error occurred.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const isInsideRadius = liveDistance !== null && instConfig && liveDistance <= instConfig.allowed_radius_meters;

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
              Dynamic QR & Real GPS Attendance Module
            </h2>
            <span className="badge badge-cyan">
              <Clock size={12} /> 30s Auto-Expiring Hash
            </span>
            <span className="badge badge-emerald">
              <Radio size={12} /> Real GPS Geofencing
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '750px' }}>
            High-integrity attendance combining dynamically salted 30-second QR codes with authoritative 
            device browser GPS geofencing. Validates physical student presence within the campus radius.
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
              cursor: 'pointer',
              transition: 'all 0.2s'
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
              cursor: 'pointer',
              transition: 'all 0.2s'
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
                This QR automatically rotates every 30 seconds with SHA-256 HMAC salt to block proxy screenshots.
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

          {/* Security & Configured Institution Geofence Card */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#10b981" />
                <h3 style={{ fontSize: '1.2rem' }}>Configured Geofence Perimeter</h3>
              </div>
              <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                Backend Enforced
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Actual Campus Coordinates */}
              <div style={{
                background: 'rgba(6, 182, 212, 0.05)',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid rgba(6, 182, 212, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={16} color="#06b6d4" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                      {instConfig?.name || 'Cooperative Skill Center'}
                    </span>
                  </div>
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Active Anchor</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Campus Latitude</span>
                    <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>
                      {instConfig ? `${instConfig.latitude.toFixed(6)}° N` : '28.613900° N'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Campus Longitude</span>
                    <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>
                      {instConfig ? `${instConfig.longitude.toFixed(6)}° E` : '77.209000° E'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Allowed Geofence Radius */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Crosshair size={15} color="#f59e0b" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                      Allowed Attendance Radius
                    </span>
                  </div>
                  <span className="badge badge-gold" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                    {instConfig?.allowed_radius_meters || 50}m Radius
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Students must be physically within {instConfig?.allowed_radius_meters || 50} meters of the campus center. Calculations use the great-circle Haversine formula on the backend.
                </p>
              </div>

              {/* Signal Precision Requirement */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Radio size={15} color="#10b981" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                      Max Allowed Accuracy Error
                    </span>
                  </div>
                  <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                    ±{instConfig?.max_accuracy_threshold || 100}m Max
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Prevents cellular tower / IP approximation spoofing. High precision device GPS required.
                </p>
              </div>
            </div>

            {/* Quick Test Attendance Trigger */}
            <div style={{
              marginTop: 'auto',
              background: 'rgba(99, 102, 241, 0.08)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px dashed rgba(99, 102, 241, 0.3)'
            }}>
              <p style={{ fontSize: '0.8rem', color: '#c7d2fe', marginBottom: '8px' }}>
                Test student check-in as <b>{currentUser.name}</b> ({currentUser.student_id}):
              </p>
              <button
                onClick={() => handleVerifyStudentScan()}
                disabled={isVerifying || isAcquiringGPS}
                className="gradient-btn"
                style={{ width: '100%', padding: '12px', fontSize: '0.88rem' }}
              >
                {isVerifying || isAcquiringGPS ? (
                  <>
                    <RefreshCw className="animate-spin" size={15} /> Verifying GPS & QR Token...
                  </>
                ) : (
                  <>
                    <Navigation size={15} /> Acquire Device GPS & Verify Scan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Student Scanner View */
        <div className="glass-panel" style={{ padding: '30px', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
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
            <h3 style={{ fontSize: '1.3rem', color: '#f8fafc' }}>Student Real-Time Attendance Verification</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Logged in as: <b>{currentUser.name}</b> (ID: {currentUser.student_id})
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Live GPS Telemetry Dashboard (Requirement 3, 4, 10) */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Navigation size={18} color="#38bdf8" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                    Live Device Geolocation Telemetry
                  </span>
                </div>
                {/* Permission Status Indicator */}
                <span className={`badge ${
                  gpsPermission === 'granted' ? 'badge-emerald' : 
                  gpsPermission === 'denied' ? 'badge-red' : 'badge-gold'
                }`} style={{ fontSize: '0.72rem' }}>
                  {gpsPermission === 'granted' ? '● GPS Permission Granted' : 
                   gpsPermission === 'denied' ? '✕ Permission Denied' : '○ Permission Required'}
                </span>
              </div>

              {/* Read-Only Coordinates Display (Requirement 10) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px'
              }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Device Latitude</div>
                  <div style={{ color: deviceCoords ? '#38bdf8' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'monospace' }}>
                    {deviceCoords ? `${deviceCoords.latitude.toFixed(6)}°` : 'Pending Check-In'}
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Device Longitude</div>
                  <div style={{ color: deviceCoords ? '#38bdf8' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'monospace' }}>
                    {deviceCoords ? `${deviceCoords.longitude.toFixed(6)}°` : 'Pending Check-In'}
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Signal Accuracy</div>
                  <div style={{ color: deviceCoords ? '#34d399' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>
                    {deviceCoords ? `±${deviceCoords.accuracy.toFixed(1)}m` : '---'}
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Campus Distance</div>
                  <div style={{
                    color: liveDistance !== null 
                      ? (isInsideRadius ? '#10b981' : '#f87171') 
                      : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}>
                    {liveDistance !== null ? `${liveDistance}m` : '---'}
                  </div>
                </div>
              </div>

              {/* Geofence Perimeter Verification Progress */}
              {deviceCoords && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: isInsideRadius ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: isInsideRadius ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.82rem'
                }}>
                  {isInsideRadius ? (
                    <>
                      <CheckCircle2 size={16} color="#10b981" />
                      <span style={{ color: '#6ee7b7' }}>
                        <b>Perimeter Verified:</b> You are within the allowed {instConfig?.allowed_radius_meters || 50}m campus geofence boundary.
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={16} color="#ef4444" />
                      <span style={{ color: '#fca5a5' }}>
                        <b>Outside Geofence:</b> You are {liveDistance}m away from campus (Allowed: {instConfig?.allowed_radius_meters || 50}m).
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* GPS error message box */}
              {gpsErrorMsg && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                  <span>{gpsErrorMsg}</span>
                </div>
              )}
            </div>

            {/* QR Token Input */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Active Classroom QR Payload Token:
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={simulatedToken}
                  onChange={(e) => setSimulatedToken(e.target.value)}
                  placeholder="Scan or paste classroom QR payload token..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Location permission will be prompted automatically upon submitting attendance.
              </p>
            </div>

            {/* Submit Verification Button */}
            <button
              onClick={() => handleVerifyStudentScan()}
              disabled={isVerifying || isAcquiringGPS || !simulatedToken}
              className="gradient-btn"
              style={{ padding: '14px', fontSize: '0.95rem' }}
            >
              {isAcquiringGPS ? (
                <>
                  <Compass className="animate-spin" size={18} /> Acquiring Device GPS...
                </>
              ) : isVerifying ? (
                <>
                  <RefreshCw className="animate-spin" size={18} /> Verifying Geofence on Server...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} /> Verify GPS & Mark Attendance
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Verification Result Banner (Requirement 9) */}
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
            <XCircle size={28} color="#ef4444" style={{ flexShrink: 0 }} />
          )}
          <div>
            <h4 style={{ fontSize: '1rem', color: '#f8fafc' }}>
              {scanResult.success ? scanResult.message : 'Attendance Verification Failed'}
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {scanResult.success ? (
                <>
                  Student: <b>{scanResult.student_name}</b> | Status: <b>{scanResult.geofence_status || 'Verified (Within Radius)'}</b> | Distance: <b>{scanResult.distance || '0'}m</b>
                </>
              ) : (
                <span style={{ color: '#fca5a5' }}>
                  {scanResult.error || 'Coordinates rejected or invalid session.'}
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
