import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  Clock, 
  GraduationCap, 
  Award, 
  Mail, 
  BookOpen, 
  Filter 
} from 'lucide-react';
import { fetchStudents } from '../api';
import { UserProfile } from '../types';

interface StudentERPViewProps {
  currentUser: UserProfile;
}

export const StudentERPView: React.FC<StudentERPViewProps> = ({ currentUser }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');

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

        {/* Search & Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
                width: '200px'
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
        {filteredStudents.map((student) => (
          <div key={student.id} className="glass-card-interactive" style={{ padding: '22px', position: 'relative' }}>
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
    </div>
  );
};
