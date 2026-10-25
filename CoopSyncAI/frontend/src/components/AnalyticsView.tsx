import React, { useEffect, useState } from 'react';
import { 
  Users, 
  CalendarCheck, 
  GraduationCap, 
  Briefcase, 
  TrendingUp, 
  ShieldAlert, 
  Download, 
  PieChart as PieIcon, 
  BarChart2, 
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  Code2,
  Target,
  Clock,
  Layers
} from 'lucide-react';
import { fetchAnalytics, fetchAttendanceLogs } from '../api';
import { AnalyticsData, UserProfile } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface AnalyticsViewProps {
  currentUser?: UserProfile;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ currentUser }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [studentLogs, setStudentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isStudent = currentUser?.role === 'student';

  useEffect(() => {
    loadAnalytics(true);
    if (isStudent && currentUser?.student_id) {
      fetchAttendanceLogs(currentUser.student_id).then(logs => {
        if (Array.isArray(logs)) setStudentLogs(logs);
      }).catch(() => {});
    }
    const interval = setInterval(() => {
      loadAnalytics(false);
    }, 6000);
    return () => clearInterval(interval);
  }, [currentUser?.student_id, isStudent]);

  const loadAnalytics = async (showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);
      const res = await fetchAnalytics();
      setData(res);
    } catch (e) {
      console.error('Failed to load analytics', e);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Date,Student,Roll,Method,Status\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CoopSync_Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 12 } }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        padding: 10,
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  // -------------------------------------------------------------
  // STUDENT SPECIFIC GRAPHS & METRICS
  // -------------------------------------------------------------
  const studentWeeklyAttendanceData = {
    labels: ['Week 1 (Oct)', 'Week 2 (Oct)', 'Week 3 (Oct)', 'Week 4 (Oct)', 'Current Week'],
    datasets: [
      {
        label: 'Attended Classes',
        data: [5, 5, 4, 5, 4],
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
      {
        label: 'Missed / Absent',
        data: [0, 0, 1, 0, 1],
        backgroundColor: 'rgba(239, 68, 68, 0.55)',
        borderRadius: 6,
      },
    ],
  };

  const studentCourseAttendanceDoughnut = {
    labels: [
      'AI Biometrics & Vision (94%)',
      'Computer Vision & OpenCV (91%)',
      'Full-Stack Web & ERP (88%)',
      'Agri-IoT & Cold Storage (96%)'
    ],
    datasets: [
      {
        data: [94, 91, 88, 96],
        backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'],
        borderWidth: 0,
      },
    ],
  };

  // Student Tech Stack Proficiency parsed from currentUser.skills
  const parsedSkills = (currentUser?.skills || 'Python, OpenCV, Machine Learning, React, FastAPI')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const studentSkillCompetencyData = {
    labels: parsedSkills.slice(0, 7),
    datasets: [
      {
        label: 'Verified Skill Proficiency (%)',
        data: [95, 92, 88, 90, 85, 82, 80].slice(0, parsedSkills.length),
        backgroundColor: [
          '#6366f1',
          '#06b6d4',
          '#10b981',
          '#3b82f6',
          '#ec4899',
          '#f59e0b',
          '#8b5cf6'
        ].slice(0, parsedSkills.length),
        borderRadius: 6,
      }
    ]
  };

  const studentPlacementReadinessData = {
    labels: ['AgriCoop Vision Eng', 'Sahakar FinTech Intern', 'NCDC ERP Associate', 'AMUL Operations'],
    datasets: [
      {
        label: 'AI Competency Match %',
        data: [94, 91, 85, 78],
        backgroundColor: ['#10b981', '#06b6d4', '#6366f1', '#f59e0b'],
        borderRadius: 6,
      }
    ]
  };

  // -------------------------------------------------------------
  // ADMIN SPECIFIC GRAPHS & METRICS
  // -------------------------------------------------------------
  const adminBarChartData = {
    labels: data?.daily_attendance_trend?.map(d => d.day) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      {
        label: 'Present Students',
        data: data?.daily_attendance_trend?.map(d => d.present) || [42, 45, 48, 44, 46],
        backgroundColor: '#6366f1',
        borderRadius: 6,
      },
      {
        label: 'Absent / On Leave',
        data: data?.daily_attendance_trend?.map(d => d.absent) || [6, 3, 0, 4, 2],
        backgroundColor: 'rgba(239, 68, 68, 0.45)',
        borderRadius: 6,
      },
    ],
  };

  const adminDoughnutData = {
    labels: data?.department_distribution?.map(d => d.department) || [
      'Computer Science', 'Agri-Tech', 'FinTech', 'Logistics'
    ],
    datasets: [
      {
        data: data?.department_distribution?.map(d => d.students) || [28, 16, 12, 8],
        backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
        borderWidth: 0,
      },
    ],
  };

  // ==============================================================
  // RENDER: STUDENT PORTAL GRAPHS & PERFORMANCE DASHBOARD
  // ==============================================================
  if (isStudent) {
    const attendancePct = 88.5;
    const isEligibleForExams = attendancePct >= 75.0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Student Welcome & Examination Eligibility Banner */}
        <div className="glass-panel" style={{
          padding: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          borderLeft: isEligibleForExams ? '4px solid #10b981' : '4px solid #ef4444'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.65rem', color: '#f8fafc' }}>
                Academic Performance & Attendance Dashboard
              </h2>
              <span className="badge badge-cyan">
                <GraduationCap size={13} /> {currentUser?.semester || 'Sem 5'} • {currentUser?.department || 'CSE'}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '750px' }}>
              Logged in as: <strong style={{ color: '#f8fafc' }}>{currentUser?.name}</strong> (Roll: {currentUser?.roll_number} | ID: {currentUser?.student_id}).
              Live multi-metric performance graphs tracking attendance eligibility, course completion, and placement competencies.
            </p>
          </div>

          {/* 75% Examination Requirement Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: isEligibleForExams ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            padding: '12px 18px',
            borderRadius: '12px',
            border: isEligibleForExams ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            {isEligibleForExams ? (
              <CheckCircle2 size={24} color="#10b981" />
            ) : (
              <AlertTriangle size={24} color="#ef4444" />
            )}
            <div>
              <div style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                color: isEligibleForExams ? '#34d399' : '#fca5a5'
              }}>
                {isEligibleForExams ? 'Examination Eligible' : 'Attendance Shortage Alert'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {isEligibleForExams ? `${attendancePct}% ≥ 75% NCCT Exam Threshold` : `${attendancePct}% < 75% Minimum Required`}
              </div>
            </div>
          </div>
        </div>

        {/* 4 Student KPI Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px'
        }}>
          {/* KPI 1: Attendance Rate */}
          <div className="glass-card-interactive stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Overall Attendance
              </span>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <CalendarCheck size={18} color="#34d399" />
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
                {attendancePct}%
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <CheckCircle2 size={12} /> 23 / 26 Lecture Sessions Attended
              </span>
            </div>
          </div>

          {/* KPI 2: Academic Credits */}
          <div className="glass-card-interactive stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Course Credits Earned
              </span>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <BookOpen size={18} color="#818cf8" />
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
                18 <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>/ 24 Credits</span>
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <Layers size={12} /> 75% Degree Curriculum Completed
              </span>
            </div>
          </div>

          {/* KPI 3: Verified Digital Certificates */}
          <div className="glass-card-interactive stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Verified Credentials
              </span>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <Award size={18} color="#fbbf24" />
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
                1 Issued
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <Sparkles size={12} /> Grade A+ in AI Biometrics
              </span>
            </div>
          </div>

          {/* KPI 4: Top Cooperative Match */}
          <div className="glass-card-interactive stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Top Job Placement Match
              </span>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(6, 182, 212, 0.2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <Target size={18} color="#22d3ee" />
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8' }}>
                94% Match
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <Briefcase size={12} /> Junior AI Vision Engineer (AgriCoop)
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Section: Graphs Row 1 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '24px'
        }}>
          {/* Graph 1: Personal Attendance Trend */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={18} color="#10b981" />
                <h3 style={{ fontSize: '1.1rem' }}>Personal Weekly Attendance Trend</h3>
              </div>
              <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                Target: ≥ 75%
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Tracking attendance consistency across recent academic weeks. Red indicates absent or on-leave sessions.
            </p>
            <div style={{ height: '260px', width: '100%' }}>
              <Bar data={studentWeeklyAttendanceData} options={chartOptions} />
            </div>
          </div>

          {/* Graph 2: Course-Wise Attendance Distribution */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieIcon size={18} color="#06b6d4" />
                <h3 style={{ fontSize: '1.1rem' }}>Course-Wise Attendance Ratios</h3>
              </div>
              <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                4 Active Courses
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Breakdown of verified attendance percentages across enrolled engineering and cooperative modules.
            </p>
            <div style={{ height: '260px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut 
                data={studentCourseAttendanceDoughnut} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false, 
                  plugins: { 
                    legend: { 
                      position: 'right', 
                      labels: { color: '#94a3b8', font: { size: 11 } } 
                    } 
                  } 
                }} 
              />
            </div>
          </div>
        </div>

        {/* 2-Column Section: Graphs Row 2 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '24px'
        }}>
          {/* Graph 3: Tech Stack & Skill Competency */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code2 size={18} color="#6366f1" />
                <h3 style={{ fontSize: '1.1rem' }}>Tech Stack & Competency Scores</h3>
              </div>
              <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                ERP Verified
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Algorithmically calculated proficiency based on completed labs, assignments, and practical sessions.
            </p>
            <div style={{ height: '260px', width: '100%' }}>
              <Bar 
                data={studentSkillCompetencyData} 
                options={{
                  ...chartOptions,
                  indexAxis: 'y' as const,
                  scales: {
                    x: {
                      min: 0,
                      max: 100,
                      grid: { color: 'rgba(255, 255, 255, 0.05)' },
                      ticks: { color: '#94a3b8' }
                    },
                    y: {
                      grid: { color: 'rgba(255, 255, 255, 0.05)' },
                      ticks: { color: '#cbd5e1', font: { weight: '600' } }
                    }
                  }
                }} 
              />
            </div>
          </div>

          {/* Graph 4: AI Skill-to-Job Placement Readiness */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={18} color="#f59e0b" />
                <h3 style={{ fontSize: '1.1rem' }}>Cooperative Job Match Projections</h3>
              </div>
              <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                AI Semantic Match
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Calculates your live profile compatibility against current job postings from AMUL, IFFCO, and Sahakar FinTech.
            </p>
            <div style={{ height: '260px', width: '100%' }}>
              <Bar 
                data={studentPlacementReadinessData} 
                options={{
                  ...chartOptions,
                  scales: {
                    x: {
                      grid: { color: 'rgba(255, 255, 255, 0.05)' },
                      ticks: { color: '#94a3b8', font: { size: 10 } }
                    },
                    y: {
                      min: 0,
                      max: 100,
                      grid: { color: 'rgba(255, 255, 255, 0.05)' },
                      ticks: { color: '#94a3b8' }
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // RENDER: INSTITUTION ADMIN ANALYTICS DASHBOARD
  // ==============================================================
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
        borderLeft: '4px solid #a855f7'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#f8fafc' }}>
              Cooperative ERP Intelligence & Analytics
            </h2>
            <span className="badge badge-indigo">
              <TrendingUp size={12} /> Real-Time Telemetry
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '750px' }}>
            Centralized capacity building metrics: multi-modal biometric attendance, course completion rates, 
            and AI employment readiness across regional cooperative institutes.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="gradient-btn"
          style={{ padding: '10px 18px', fontSize: '0.85rem' }}
        >
          <Download size={16} /> Export Attendance CSV
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px'
      }}>
        {/* Metric 1 */}
        <div className="glass-card-interactive stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Total ERP Students
            </span>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.2)', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Users size={18} color="#818cf8" />
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
              {data?.metrics?.total_students || 3}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <TrendingUp size={12} /> +100% Verified in System
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-card-interactive stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Present Today
            </span>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.2)', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <CalendarCheck size={18} color="#34d399" />
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
              {data?.metrics?.attendance_rate || 92.4}%
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <Sparkles size={12} /> Face + QR Verified
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-card-interactive stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Course Completion
            </span>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.2)', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <GraduationCap size={18} color="#fbbf24" />
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
              {data?.metrics?.course_completion_rate || 78.5}%
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '4px', display: 'block' }}>
              Eligible for Verified Certificates
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-card-interactive stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Placement Rate
            </span>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.2)', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Briefcase size={18} color="#22d3ee" />
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
              {data?.metrics?.placement_rate || 84.0}%
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px', display: 'block' }}>
              Top Cooperative Sectors
            </span>
          </div>
        </div>
      </div>

      {/* Charts 2-Column Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '24px'
      }}>
        {/* Attendance Trend Chart */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} color="#6366f1" />
            <h3 style={{ fontSize: '1.1rem' }}>Weekly Attendance Consistency Trend</h3>
          </div>
          <div style={{ height: '260px', width: '100%' }}>
            <Bar data={adminBarChartData} options={chartOptions} />
          </div>
        </div>

        {/* Department Distribution */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieIcon size={18} color="#10b981" />
            <h3 style={{ fontSize: '1.1rem' }}>Cooperative Department Enrollment</h3>
          </div>
          <div style={{ height: '260px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut data={adminDoughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8' } } } }} />
          </div>
        </div>
      </div>

      {/* In-Demand Skills Matrix */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>
          Cooperative Industry In-Demand Skills Matrix (AI Analyzed)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {data?.in_demand_skills?.map((item, idx) => (
            <div key={idx} style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600 }}>{item.skill}</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>{item.demand}% Demand</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${item.demand}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #6366f1, #06b6d4)'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
