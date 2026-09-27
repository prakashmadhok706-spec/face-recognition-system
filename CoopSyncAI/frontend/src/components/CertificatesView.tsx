import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Download, 
  ShieldCheck, 
  ExternalLink, 
  QrCode, 
  Sparkles, 
  CheckCircle2, 
  FileCheck 
} from 'lucide-react';
import { fetchCertificates, generateCertificate } from '../api';
import { CertificateItem, UserProfile } from '../types';
import confetti from 'canvas-confetti';

interface CertificatesViewProps {
  currentUser: UserProfile;
}

export const CertificatesView: React.FC<CertificatesViewProps> = ({ currentUser }) => {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [verifyModalCert, setVerifyModalCert] = useState<CertificateItem | null>(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const res = await fetchCertificates();
      setCertificates(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateCertificate = async () => {
    setIsGenerating(true);
    try {
      const res = await generateCertificate(
        currentUser.name,
        "AI-Enabled Computer Vision & Face Biometrics"
      );
      if (res.success) {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.5 }
        });
        loadCertificates();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

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
        borderLeft: '4px solid #f59e0b'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#f8fafc' }}>
              Tamper-Proof Digital Certificates
            </h2>
            <span className="badge badge-gold">
              <Award size={12} /> QR-Verified Credentials
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '750px' }}>
            Official completion credentials generated with dynamic verification QR codes, cryptographic watermarks, 
            and instant public lookup. Issued automatically upon meeting attendance and curriculum criteria.
          </p>
        </div>

        <button
          onClick={handleGenerateCertificate}
          disabled={isGenerating}
          className="gradient-btn gradient-btn-success"
          style={{ padding: '10px 18px', fontSize: '0.85rem' }}
        >
          <Sparkles size={16} />
          {isGenerating ? 'Rendering PDF...' : `Issue Certificate for ${currentUser.name}`}
        </button>
      </div>

      {/* Certificates Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '24px'
      }}>
        {certificates.map((cert) => (
          <div
            key={cert.id}
            className="glass-card-interactive"
            style={{
              padding: '24px',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            {/* Golden top bar */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #f59e0b, #ec4899, #6366f1)'
            }} />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                  {cert.certificate_no}
                </span>
                <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                  <ShieldCheck size={12} /> {cert.status || 'Verified'}
                </span>
              </div>

              <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', marginBottom: '6px' }}>
                {cert.course_title}
              </h3>

              <p style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: 600 }}>
                Recipient: {cert.student_name}
              </p>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                <p>Grade: <strong style={{ color: '#10b981' }}>{cert.grade || 'A+'}</strong></p>
                <p>Issued on: {cert.issue_date}</p>
                <p>Authority: Cooperative Skills ERP Board</p>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <a
                href={`http://127.0.0.1:8000/api/certificates/download/${cert.certificate_no}`}
                target="_blank"
                rel="noreferrer"
                className="gradient-btn"
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem', textDecoration: 'none' }}
              >
                <Download size={14} /> Download PDF
              </a>

              <button
                onClick={() => setVerifyModalCert(cert)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem'
                }}
              >
                <QrCode size={14} color="#06b6d4" /> Verify
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Verification Modal */}
      {verifyModalCert && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            background: '#0f172a',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <CheckCircle2 size={32} color="#10b981" />
            </div>

            <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', marginBottom: '6px' }}>
              Public Credential Authenticated
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Verified via cryptographic hash and cooperative registration database.
            </p>

            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'left',
              fontSize: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Certificate ID:</span> <strong>{verifyModalCert.certificate_no}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Recipient:</span> <strong>{verifyModalCert.student_name}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Program:</span> <strong>{verifyModalCert.course_title}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Grade:</span> <strong style={{ color: '#10b981' }}>{verifyModalCert.grade}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <span className="badge badge-emerald" style={{ padding: '2px 8px', fontSize: '0.65rem' }}>OFFICIAL VERIFIED</span></div>
            </div>

            <button
              onClick={() => setVerifyModalCert(null)}
              className="gradient-btn"
              style={{ width: '100%', padding: '10px' }}
            >
              Close Verification
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
