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
  Sparkles 
} from 'lucide-react';
import { fetchAnalytics } from '../api';
import { AnalyticsData } from '../types';
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

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await fetchAnalytics();
      setData(res);
    } catch (e) {
      console.error('Failed to load analytics', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Date,Student,Roll,Method,Status\n" +
      "2026-09-27,Puneet,2400300100305,Face Recognition,Present\n" +
      "2026-09-27,Ranjan,2400300100314,Face Recognition,Present\n" +
      "2026-09-27,Varun,2400300100308,QR Verification,Present\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CoopSync_Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const barChartData = {
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

  const doughnutData = {
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
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        {/* Department Distribution */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieIcon size={18} color="#10b981" />
            <h3 style={{ fontSize: '1.1rem' }}>Cooperative Department Enrollment</h3>
          </div>
          <div style={{ height: '260px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8' } } } }} />
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
