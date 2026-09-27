import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Building2, 
  Home, 
  Users, 
  Plus, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileText, 
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { ProgrammeItem, UserProfile } from '../types';
import confetti from 'canvas-confetti';

interface ProgrammesViewProps {
  currentUser: UserProfile;
}

const DEFAULT_PROGRAMMES: ProgrammeItem[] = [
  {
    id: 1,
    title: 'Dairy Cooperative Training & Tech',
    start_date: '12 Nov 2026',
    end_date: '24 Nov 2026',
    location: 'VAMNICOM, Pune',
    institution: 'VAMNICOM (National Institute)',
    capacity: 60,
    enrolled: 48,
    hostel_available: true,
    status: 'Open',
    category: 'Dairy & Agriculture'
  },
  {
    id: 2,
    title: 'PACS Management & ERP Systems',
    start_date: '05 Dec 2026',
    end_date: '15 Dec 2026',
    location: 'RICM, Bengaluru',
    institution: 'Regional Institute of Cooperative Management',
    capacity: 50,
    enrolled: 42,
    hostel_available: true,
    status: 'Open',
    category: 'Credit & Accounts'
  },
  {
    id: 3,
    title: 'Digital Literacy & Biometric Attendance',
    start_date: '18 Dec 2026',
    end_date: '28 Dec 2026',
    location: 'ICM, Lucknow',
    institution: 'Institute of Cooperative Management',
    capacity: 40,
    enrolled: 40,
    hostel_available: false,
    status: 'Closed',
    category: 'Digital Governance'
  },
  {
    id: 4,
    title: 'Cooperative Banking & Auditing ERP',
    start_date: '10 Jan 2027',
    end_date: '22 Jan 2027',
    location: 'ICM, Jaipur',
    institution: 'Institute of Cooperative Management',
    capacity: 55,
    enrolled: 18,
    hostel_available: true,
    status: 'Upcoming',
    category: 'Finance & Banking'
  }
];

export const ProgrammesView: React.FC<ProgrammesViewProps> = ({ currentUser }) => {
  const [programmes, setProgrammes] = useState<ProgrammeItem[]>(DEFAULT_PROGRAMMES);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [nominatedProgrammes, setNominatedProgrammes] = useState<number[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [location, setLocation] = useState('VAMNICOM, Pune');
  const [institution, setInstitution] = useState('VAMNICOM');
  const [capacity, setCapacity] = useState(50);
  const [hostel, setHostel] = useState(true);

  const handleCreateProgramme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate) return;

    const newProg: ProgrammeItem = {
      id: Date.now(),
      title,
      start_date: startDate,
      end_date: 'Continuous',
      location,
      institution,
      capacity: Number(capacity),
      enrolled: 0,
      hostel_available: hostel,
      status: 'Open',
      category: 'Cooperative Training'
    };

    setProgrammes([newProg, ...programmes]);
    setShowModal(false);
    setTitle('');
    confetti({ particleCount: 50, spread: 60 });
  };

  const handleNominate = (id: number) => {
    setNominatedProgrammes((prev) => [...prev, id]);
    confetti({ particleCount: 40, spread: 50 });
  };

  const filteredProgrammes = programmes.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.institution.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || p.status.toLowerCase() === activeFilter;
    return matchesSearch && matchesFilter;
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
              Programme Management & Institution Scheduling
            </h2>
            <span className="badge badge-emerald">
              <Building2 size={12} /> NCCT Module 2
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '780px' }}>
            Manage trainee nominations, institution timetables, venue allocations (VAMNICOM, RICMs, ICMs), 
            and hostel/logistics facilities under National Council for Cooperative Training (NCCT).
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="gradient-btn"
          style={{ padding: '10px 18px', fontSize: '0.85rem' }}
        >
          <Plus size={16} /> + New Programme
        </button>
      </div>

      {/* Stats Quick Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '18px', borderLeft: '3px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>Active Programmes</span>
            <Calendar size={18} color="#6366f1" />
          </div>
          <h3 style={{ fontSize: '1.8rem', color: '#f8fafc', margin: '8px 0 2px 0' }}>
            {programmes.filter(p => p.status === 'Open').length}
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#10b981' }}>Currently accepting nominations</p>
        </div>

        <div className="glass-card" style={{ padding: '18px', borderLeft: '3px solid #06b6d4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>Hostel Accommodation</span>
            <Home size={18} color="#06b6d4" />
          </div>
          <h3 style={{ fontSize: '1.8rem', color: '#f8fafc', margin: '8px 0 2px 0' }}>
            {programmes.filter(p => p.hostel_available).length} Centers
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Room & boarding logistics</p>
        </div>

        <div className="glass-card" style={{ padding: '18px', borderLeft: '3px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>Partner Institutions</span>
            <Building2 size={18} color="#f59e0b" />
          </div>
          <h3 style={{ fontSize: '1.8rem', color: '#f8fafc', margin: '8px 0 2px 0' }}>
            14 Institutions
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#38bdf8' }}>VAMNICOM, RICMs, & ICMs</p>
        </div>

        <div className="glass-card" style={{ padding: '18px', borderLeft: '3px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>Total Enrolled Trainees</span>
            <Users size={18} color="#10b981" />
          </div>
          <h3 style={{ fontSize: '1.8rem', color: '#f8fafc', margin: '8px 0 2px 0' }}>
            {programmes.reduce((acc, curr) => acc + curr.enrolled, 0)} / {programmes.reduce((acc, curr) => acc + curr.capacity, 0)}
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#10b981' }}>72.5% Seat Occupancy</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              placeholder="Search by programme, venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                padding: '8px',
                fontSize: '0.85rem',
                outline: 'none',
                width: '240px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['all', 'open', 'closed', 'upcoming'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  background: activeFilter === filter ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
                  color: activeFilter === filter ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Showing {filteredProgrammes.length} programmes
        </span>
      </div>

      {/* Main Training Programmes Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="#6366f1" /> Training Programmes Roster
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NCCT National Register 2026-2027</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={{ padding: '14px 20px' }}>Programme Title</th>
                <th style={{ padding: '14px 20px' }}>Start Date</th>
                <th style={{ padding: '14px 20px' }}>Location / Venue</th>
                <th style={{ padding: '14px 20px' }}>Hostel & Facilities</th>
                <th style={{ padding: '14px 20px' }}>Enrolled / Capacity</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProgrammes.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s ease' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{p.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.institution}</div>
                  </td>
                  <td style={{ padding: '16px 20px', color: '#38bdf8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} /> {p.start_date}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: '#e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="#f59e0b" /> {p.location}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {p.hostel_available ? (
                      <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                        <Home size={10} /> Hostel Room Allocated
                      </span>
                    ) : (
                      <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>
                        Day Scholar Only
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ color: '#f8fafc', fontWeight: 600 }}>{p.enrolled} / {p.capacity}</div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '4px', width: '90px' }}>
                      <div style={{
                        height: '100%',
                        width: `${(p.enrolled / p.capacity) * 100}%`,
                        background: p.enrolled >= p.capacity ? '#ef4444' : '#10b981',
                        borderRadius: '2px'
                      }} />
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {p.status === 'Open' && (
                      <span className="badge badge-emerald">
                        <CheckCircle2 size={12} /> Open
                      </span>
                    )}
                    {p.status === 'Closed' && (
                      <span className="badge badge-rose">
                        <XCircle size={12} /> Closed
                      </span>
                    )}
                    {p.status === 'Upcoming' && (
                      <span className="badge badge-cyan">
                        <Clock size={12} /> Upcoming
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    {nominatedProgrammes.includes(p.id) ? (
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} /> Nominated
                      </span>
                    ) : p.status === 'Open' ? (
                      <button
                        onClick={() => handleNominate(p.id)}
                        className="gradient-btn"
                        style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                      >
                        Nominate Trainee
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registration Closed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '540px', padding: '28px' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#f8fafc', marginBottom: '16px' }}>Schedule New Training Programme</h3>
            <form onSubmit={handleCreateProgramme} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Programme Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cooperative Audit & Accountancy"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#f8fafc', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Start Date</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15 Jan 2027"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#f8fafc', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Target Capacity</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#f8fafc', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Venue Location</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{ width: '100%', background: '#0f1527', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#f8fafc', outline: 'none' }}
                  >
                    <option value="VAMNICOM, Pune">VAMNICOM, Pune</option>
                    <option value="RICM, Bengaluru">RICM, Bengaluru</option>
                    <option value="ICM, Lucknow">ICM, Lucknow</option>
                    <option value="ICM, Jaipur">ICM, Jaipur</option>
                    <option value="ICM, Guwahati">ICM, Guwahati</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Hostel Facilities</label>
                  <select
                    value={hostel ? 'yes' : 'no'}
                    onChange={(e) => setHostel(e.target.value === 'yes')}
                    style={{ width: '100%', background: '#0f1527', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#f8fafc', outline: 'none' }}
                  >
                    <option value="yes">Available (Boarding Provided)</option>
                    <option value="no">Day Scholar Only</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gradient-btn"
                  style={{ padding: '10px 20px' }}
                >
                  Publish Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
