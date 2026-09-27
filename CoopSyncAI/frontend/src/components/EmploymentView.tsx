import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Building2, 
  Check, 
  ArrowRight 
} from 'lucide-react';
import { fetchJobs, applyJob } from '../api';
import { JobItem, UserProfile } from '../types';
import confetti from 'canvas-confetti';

interface EmploymentViewProps {
  currentUser: UserProfile;
}

export const EmploymentView: React.FC<EmploymentViewProps> = ({ currentUser }) => {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<number[]>([]);
  const [applyingId, setApplyingId] = useState<number | null>(null);

  useEffect(() => {
    loadJobs();
  }, [currentUser]);

  const loadJobs = async () => {
    try {
      const res = await fetchJobs(currentUser.id);
      setJobs(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApply = async (job: JobItem) => {
    setApplyingId(job.id);
    try {
      const res = await applyJob(job.id, currentUser.id);
      if (res.success) {
        setAppliedJobs((prev) => [...prev, job.id]);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setApplyingId(null);
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
        borderLeft: '4px solid #06b6d4'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#f8fafc' }}>
              Cooperative Employment & AI Placement Portal
            </h2>
            <span className="badge badge-cyan">
              <Sparkles size={12} /> AI Skill-to-Job Matching
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '750px' }}>
            Direct bridge between cooperative societies, agri-tech startups, and trained students. 
            AI algorithms match your verified biometric attendance, completed courses, and Python skills to hiring employers.
          </p>
        </div>

        {/* Current Student Skill Snapshot */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '12px 18px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Matching Profile for:</span>
          <p style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>{currentUser.name}</p>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
            {currentUser.skills?.split(',').slice(0, 3).map((s, i) => (
              <span key={i} className="badge badge-indigo" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                {s.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px'
      }}>
        {jobs.map((job) => {
          const isApplied = appliedJobs.includes(job.id);
          const score = job.skill_match_score || 85;

          return (
            <div
              key={job.id}
              className="glass-card-interactive"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div>
                {/* Header row with AI Match Tag */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={job.logo}
                      alt={job.company}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    />
                    <div>
                      <h4 style={{ fontSize: '1.15rem', color: '#f8fafc', lineHeight: 1.2 }}>
                        {job.title}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {job.company}
                      </p>
                    </div>
                  </div>

                  {/* AI Skill Match Badge */}
                  <div style={{
                    textAlign: 'center',
                    background: score >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                    border: score >= 80 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
                    padding: '6px 10px',
                    borderRadius: '10px'
                  }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: score >= 80 ? '#10b981' : '#818cf8', display: 'block' }}>
                      {score}%
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      AI Match
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  {job.description}
                </p>

                {/* Details list */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  marginBottom: '14px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '10px',
                  borderRadius: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} color="#06b6d4" /> {job.location}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <DollarSign size={12} color="#10b981" /> {job.salary}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Briefcase size={12} color="#a855f7" /> {job.type}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} color="#f59e0b" /> Deadline: {job.deadline}
                  </div>
                </div>

                {/* Required Skills */}
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Required Competencies:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {job.required_skills.split(',').map((skill, i) => (
                      <span
                        key={i}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#e2e8f0',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem'
                        }}
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Apply Action */}
              <button
                onClick={() => handleApply(job)}
                disabled={isApplied || applyingId === job.id}
                className={isApplied ? "gradient-btn gradient-btn-success" : "gradient-btn"}
                style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}
              >
                {isApplied ? (
                  <>
                    <Check size={16} /> Application Shortlisted
                  </>
                ) : applyingId === job.id ? (
                  'Transmitting ERP Profile...'
                ) : (
                  <>
                    <span>1-Click Apply with ERP Profile</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
