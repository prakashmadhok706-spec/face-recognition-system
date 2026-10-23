import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Plus, 
  Save, 
  X, 
  Sparkles, 
  Camera, 
  QrCode, 
  ShieldCheck, 
  FileSpreadsheet,
  Download,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { fetchAttendanceLogs, updateAttendanceApi, manualAttendanceApi, deleteAttendanceApi, fetchStudents } from '../api';
import { AttendanceRecord, UserProfile } from '../types';
import confetti from 'canvas-confetti';

interface AttendanceManagerViewProps {
  currentUser: UserProfile;
}

export const AttendanceManagerView: React.FC<AttendanceManagerViewProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Modal: Edit Attendance Record
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<string>('Present');
  const [editMethod, setEditMethod] = useState<string>('Manual Override (Admin)');
  const [editTime, setEditTime] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Modal: Add Manual Attendance Record
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [manualStudentId, setManualStudentId] = useState<string>('');
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [manualTime, setManualTime] = useState<string>(new Date().toTimeString().slice(0, 8));
  const [manualStatus, setManualStatus] = useState<string>('Present');
  const [manualMethod, setManualMethod] = useState<string>('Manual Override (Admin)');
  const [manualReason, setManualReason] = useState<string>('Verified in person by Institutional Admin');
  const [isSubmittingManual, setIsSubmittingManual] = useState<boolean>(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedLogs, fetchedStudents] = await Promise.all([
        fetchAttendanceLogs(),
        fetchStudents()
      ]);
      setLogs(fetchedLogs || []);
      setStudentsList(fetchedStudents || []);
      if (fetchedStudents && fetchedStudents.length > 0) {
        setManualStudentId(fetchedStudents[0].student_id || String(fetchedStudents[0].id));
      }
    } catch (e) {
      console.error('Error loading attendance logs', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEdit = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setEditStatus(rec.status || 'Present');
    setEditMethod(rec.method || 'Manual Override (Admin)');
    setEditTime(rec.time || new Date().toTimeString().slice(0, 8));
    setEditDate(rec.date || new Date().toISOString().slice(0, 10));
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    setIsUpdating(true);
    try {
      const res = await updateAttendanceApi(editingRecord.id, {
        status: editStatus,
        method: editMethod,
        time: editTime,
        date: editDate
      });

      if (res && res.success !== false) {
        setAlertMsg({ type: 'success', text: `Attendance for ${editingRecord.student_name} successfully updated to ${editStatus}!` });
        setEditingRecord(null);
        await loadData();
      } else {
        setAlertMsg({ type: 'error', text: res?.message || 'Failed to update attendance record.' });
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Error updating record.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteRecord = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete attendance record #${id} for ${name}?`)) return;
    try {
      const res = await deleteAttendanceApi(id);
      if (res && res.success !== false) {
        setAlertMsg({ type: 'success', text: `Attendance record #${id} deleted.` });
        await loadData();
      } else {
        alert(res?.message || 'Failed to delete record.');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting record.');
    }
  };

  const handleCreateManualAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentId) {
      alert('Please select a student.');
      return;
    }
    setIsSubmittingManual(true);
    try {
      const res = await manualAttendanceApi({
        student_id: manualStudentId,
        date: manualDate,
        time: manualTime,
        status: manualStatus,
        method: manualMethod
      });

      if (res && res.success !== false) {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        setAlertMsg({ type: 'success', text: res.message || 'Manual attendance recorded successfully!' });
        setShowManualModal(false);
        await loadData();
      } else {
        setAlertMsg({ type: 'error', text: res?.message || 'Failed to record manual attendance.' });
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Error submitting manual attendance.' });
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleExportCSV = () => {
    const headers = "ID,Student Name,Student ID,Date,Time,Method,Confidence,Status\n";
    const rows = logs.map(l => 
      `${l.id},"${l.student_name}",${l.student_id},${l.date},${l.time},"${l.method}",${l.confidence || 100},${l.status}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CoopSync_Attendance_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logs
  const todayStr = new Date().toISOString().slice(0, 10);
  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      (l.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.student_id || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && (l.status || 'Present').toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (methodFilter !== 'all' && !(l.method || '').toLowerCase().includes(methodFilter.toLowerCase())) return false;
    if (dateFilter === 'today' && l.date !== todayStr) return false;
    return true;
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
              Student Attendance Roster & Manual Verification
            </h2>
            <span className="badge badge-emerald">
              <ClipboardCheck size={12} /> NCCT Module 1B
            </span>
            <span className="badge badge-indigo">
              Admin Edit Controls Active
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '780px' }}>
            Comprehensive institutional attendance roster. Inspect real-time face biometric and QR scan logs, 
            resolve camera/lighting discrepancies, and make verified manual overrides with permanent audit logging.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowManualModal(true)}
            className="gradient-btn gradient-btn-success"
            style={{ padding: '10px 18px', fontSize: '0.85rem' }}
          >
            <Plus size={16} /> Mark Manual Attendance
          </button>

          <button
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Download size={15} /> Export Audit CSV
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alertMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          backgroundColor: alertMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${alertMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: alertMsg.type === 'success' ? '#34d399' : '#fca5a5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {alertMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{alertMsg.text}</span>
          </div>
          <button 
            onClick={() => setAlertMsg(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats Counter Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '18px', borderLeft: '3px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>Total Attendance Records</span>
            <FileSpreadsheet size={18} color="#6366f1" />
          </div>
          <h3 style={{ fontSize: '1.8rem', color: '#f8fafc', margin: '8px 0 2px 0' }}>
            {logs.length}
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Synchronized with SQLite & CSV</p>
        </div>

        <div className="glass-card" style={{ padding: '18px', borderLeft: '3px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>Face Biometrics (LBPH)</span>
            <Camera size={18} color="#10b981" />
          </div>
          <h3 style={{ fontSize: '1.8rem', color: '#f8fafc', margin: '8px 0 2px 0' }}>
            {logs.filter(l => (l.method || '').toLowerCase().includes('face')).length}
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#10b981' }}>Anti-Spoof Liveness Verified</p>
        </div>

        <div className="glass-card" style={{ padding: '18px', borderLeft: '3px solid #06b6d4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>Dynamic QR Scans</span>
            <QrCode size={18} color="#06b6d4" />
          </div>
          <h3 style={{ fontSize: '1.8rem', color: '#f8fafc', margin: '8px 0 2px 0' }}>
            {logs.filter(l => (l.method || '').toLowerCase().includes('qr')).length}
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#06b6d4' }}>Single-Use Token Authenticated</p>
        </div>

        <div className="glass-card" style={{ padding: '18px', borderLeft: '3px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>Admin Manual Overrides</span>
            <ShieldCheck size={18} color="#f59e0b" />
          </div>
          <h3 style={{ fontSize: '1.8rem', color: '#f8fafc', margin: '8px 0 2px 0' }}>
            {logs.filter(l => (l.method || '').toLowerCase().includes('manual')).length}
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Discrepancy Resolution</p>
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
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '8px 14px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          width: '280px'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student or roll #..."
            style={{
              background: 'transparent',
              border: 'none',
              color: '#f8fafc',
              fontSize: '0.85rem',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#f8fafc',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Dates</option>
            <option value="today">Today Only ({todayStr})</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#f8fafc',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="excused">Excused</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#f8fafc',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Methods</option>
            <option value="face">Face Recognition</option>
            <option value="qr">QR Verification</option>
            <option value="manual">Manual Override</option>
          </select>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
            Showing {filteredLogs.length} records
          </span>
        </div>
      </div>

      {/* Attendance Roster Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600 }}>Record ID</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600 }}>Student</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600 }}>Date & Time</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600 }}>Verification Method</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600 }}>Confidence / Liveness</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600, textAlign: 'right' }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    No attendance records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((item) => {
                  const isPresent = (item.status || '').toLowerCase() === 'present';
                  const isLate = (item.status || '').toLowerCase() === 'late';
                  const isManual = (item.method || '').toLowerCase().includes('manual');
                  const isFace = (item.method || '').toLowerCase().includes('face');
                  const isQR = (item.method || '').toLowerCase().includes('qr');

                  return (
                    <tr 
                      key={item.id} 
                      style={{ 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {/* Record ID */}
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: '#64748b' }}>
                        #{item.id}
                      </td>

                      {/* Student Info */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            backgroundColor: '#1e293b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#38bdf8',
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}>
                            {item.student_name ? item.student_name.charAt(0) : 'S'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#f8fafc' }}>{item.student_name}</div>
                            <div style={{ fontSize: '0.74rem', color: '#38bdf8' }}>ID: {item.student_id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ color: '#f8fafc', fontWeight: 500 }}>{item.date}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.time}</div>
                      </td>

                      {/* Method */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isFace && <Camera size={14} color="#10b981" />}
                          {isQR && <QrCode size={14} color="#06b6d4" />}
                          {isManual && <ShieldCheck size={14} color="#f59e0b" />}
                          <span style={{ 
                            color: isManual ? '#fbbf24' : isFace ? '#34d399' : '#22d3ee',
                            fontWeight: 500 
                          }}>
                            {item.method}
                          </span>
                        </div>
                      </td>

                      {/* Confidence */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#cbd5e1' }}>
                            {item.confidence ? `${item.confidence.toFixed(1)}%` : '100%'}
                          </span>
                          {item.liveness_verified !== false ? (
                            <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 6px', borderRadius: '4px' }}>
                              Liveness ✓
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', padding: '2px 6px', borderRadius: '4px' }}>
                              Unverified
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: isPresent 
                            ? 'rgba(16, 185, 129, 0.15)' 
                            : isLate 
                            ? 'rgba(245, 158, 11, 0.15)' 
                            : 'rgba(168, 85, 247, 0.15)',
                          color: isPresent 
                            ? '#34d399' 
                            : isLate 
                            ? '#fbbf24' 
                            : '#c084fc',
                          border: `1px solid ${
                            isPresent 
                              ? 'rgba(16, 185, 129, 0.3)' 
                              : isLate 
                              ? 'rgba(245, 158, 11, 0.3)' 
                              : 'rgba(168, 85, 247, 0.3)'
                          }`
                        }}>
                          {item.status || 'Present'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Attendance Status / Method"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(56, 189, 248, 0.12)',
                              border: '1px solid rgba(56, 189, 248, 0.25)',
                              color: '#38bdf8',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(item.id, item.student_name)}
                            title="Delete Record"
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              color: '#f87171',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Edit Attendance Record */}
      {editingRecord && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(3, 7, 18, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0d1527',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '460px',
            padding: '28px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Edit3 size={20} color="#38bdf8" />
                <h3 style={{ fontSize: '1.2rem', color: '#ffffff', fontWeight: 700 }}>
                  Edit Attendance Record #{editingRecord.id}
                </h3>
              </div>
              <button 
                onClick={() => setEditingRecord(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '20px' }}>
              Modifying attendance parameters for <strong>{editingRecord.student_name}</strong> (ID: {editingRecord.student_id}).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                  Attendance Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="Present">Present (Verified)</option>
                  <option value="Late">Late Arrival</option>
                  <option value="Excused">Excused / Approved Leave</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                  Verification Method
                </label>
                <select
                  value={editMethod}
                  onChange={(e) => setEditMethod(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="Manual Override (Admin)">Manual Override (Admin Verified)</option>
                  <option value="Face Recognition">Face Recognition (LBPH Biometrics)</option>
                  <option value="QR Verification">QR Dynamic Scan</option>
                  <option value="Offline Sync">Offline Synchronized</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                    Time
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isUpdating}
                  className="gradient-btn gradient-btn-success"
                  style={{ flex: 1, padding: '11px', fontSize: '0.88rem' }}
                >
                  {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Save Attendance Update</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  style={{
                    padding: '11px 18px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    color: '#cbd5e1',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mark Manual Attendance */}
      {showManualModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(3, 7, 18, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0d1527',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            padding: '28px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={22} color="#10b981" />
                <h3 style={{ fontSize: '1.25rem', color: '#ffffff', fontWeight: 700 }}>
                  Mark Manual Attendance
                </h3>
              </div>
              <button 
                onClick={() => setShowManualModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '18px' }}>
              Manually authenticate attendance for a candidate experiencing camera lighting failure, 
              hardware unavailability, or authorized physical check-in.
            </p>

            <form onSubmit={handleCreateManualAttendance} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                  Select Enrolled Student
                </label>
                <select
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                  required
                >
                  {studentsList.map((s) => (
                    <option key={s.id} value={s.student_id || String(s.id)}>
                      {s.name} (Roll: {s.roll_number || s.student_id}) - {s.department}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                    Attendance Status
                  </label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Excused">Excused (Medical/Official)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                    Override Authority
                  </label>
                  <input
                    type="text"
                    value={currentUser.name}
                    disabled
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#94a3b8',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                    Time
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                  Verification Audit Note
                </label>
                <input
                  type="text"
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="e.g. Verified by faculty due to camera glare"
                  style={{
                    width: '100%',
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="gradient-btn gradient-btn-success"
                  style={{ flex: 1, padding: '11px', fontSize: '0.88rem' }}
                >
                  {isSubmittingManual ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Record Verified Attendance</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  style={{
                    padding: '11px 18px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    color: '#cbd5e1',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
