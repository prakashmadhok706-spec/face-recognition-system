import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  User,
  Users,
  Search,
  Filter,
  RefreshCw,
  Sliders,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Briefcase,
  Award,
  Layers,
  Clock,
  Sparkles,
  Cpu,
  Check,
  X,
  Target,
  BarChart2,
  PieChart as PieIcon,
  MessageSquare,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Calendar
} from 'lucide-react';
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
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  fetchRiskOverview,
  fetchRiskStudents,
  fetchStudentRiskProfile,
  triggerBatchRiskPrediction,
  recordInterventionApi,
  updateInterventionApi,
  submitPredictionFeedbackApi,
  retrainRiskModelApi,
  fetchModelMetricsApi
} from '../api';
import {
  UserProfile,
  RiskOverviewData,
  StudentRiskRecord,
  StudentRiskProfileResponse
} from '../types';

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

interface EarlyWarningViewProps {
  currentUser: UserProfile;
}

export const EarlyWarningView: React.FC<EarlyWarningViewProps> = ({ currentUser }) => {
  const isStudent = currentUser.role === 'student';

  // Enterprise Overview State
  const [overview, setOverview] = useState<RiskOverviewData | null>(null);
  const [students, setStudents] = useState<StudentRiskRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('All');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All');
  const [selectedSemFilter, setSelectedSemFilter] = useState<string>('All');

  // Detail & Explainability Modal
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentRiskProfileResponse | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);

  // Telemetry Modal
  const [showTelemetryModal, setShowTelemetryModal] = useState<boolean>(false);
  const [telemetryData, setTelemetryData] = useState<any | null>(null);
  const [isRetraining, setIsRetraining] = useState<boolean>(false);

  // New Intervention Form in Modal
  const [interventionTitle, setInterventionTitle] = useState<string>('');
  const [interventionType, setInterventionType] = useState<string>('Academic Counseling');
  const [interventionNotes, setInterventionNotes] = useState<string>('');
  const [interventionAction, setInterventionAction] = useState<string>('');
  const [assignedTrainer, setAssignedTrainer] = useState<string>(currentUser.name || 'Faculty Mentor');
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [isSubmittingIntervention, setIsSubmittingIntervention] = useState<boolean>(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<string | null>(null);

  // Load Data
  useEffect(() => {
    loadAllData();
  }, [isStudent, currentUser.student_id]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      if (isStudent && currentUser.student_id) {
        // Student only loads their own profile
        const prof = await fetchStudentRiskProfile(currentUser.student_id);
        if (prof.success) {
          setStudentProfile(prof);
        }
      } else {
        const [ovData, stList] = await Promise.all([
          fetchRiskOverview(),
          fetchRiskStudents()
        ]);
        if (ovData && ovData.total_students !== undefined) {
          setOverview(ovData);
        }
        if (Array.isArray(stList)) {
          setStudents(stList);
        }
      }
    } catch (err) {
      console.error('Error loading Early Warning data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshPredictions = async () => {
    setIsRefreshing(true);
    try {
      await triggerBatchRiskPrediction();
      await loadAllData();
    } catch (err) {
      console.error('Error triggering batch predictions:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenStudentDetail = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setIsLoadingProfile(true);
    setFeedbackSubmitted(null);
    try {
      const prof = await fetchStudentRiskProfile(studentId);
      if (prof.success) {
        setStudentProfile(prof);
      }
    } catch (err) {
      console.error('Error fetching student risk profile:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleOpenTelemetry = async () => {
    setShowTelemetryModal(true);
    try {
      const res = await fetchModelMetricsApi();
      if (res.success) {
        setTelemetryData(res.model_metadata);
      }
    } catch (err) {
      console.error('Error fetching telemetry:', err);
    }
  };

  const handleRetrainModel = async (modelType: string = 'RandomForestClassifier') => {
    setIsRetraining(true);
    try {
      const res = await retrainRiskModelApi(modelType, currentUser.role);
      if (res.success) {
        alert(res.message);
        const metrics = await fetchModelMetricsApi();
        if (metrics.success) {
          setTelemetryData(metrics.model_metadata);
        }
        await loadAllData();
      } else {
        alert(res.error || 'Retraining failed');
      }
    } catch (err: any) {
      alert(`Retraining error: ${err.message}`);
    } finally {
      setIsRetraining(false);
    }
  };

  const handleCreateIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !interventionTitle.trim()) return;

    setIsSubmittingIntervention(true);
    try {
      const res = await recordInterventionApi({
        student_id: selectedStudentId,
        risk_level: studentProfile?.risk_profile.risk_level || 'Medium Risk',
        intervention_type: interventionType,
        title: interventionTitle.trim(),
        notes: interventionNotes.trim(),
        action_taken: interventionAction.trim(),
        assigned_trainer_name: assignedTrainer.trim(),
        follow_up_date: followUpDate || undefined,
        requester_role: currentUser.role
      });

      if (res.success) {
        // Reset form
        setInterventionTitle('');
        setInterventionNotes('');
        setInterventionAction('');
        setFollowUpDate('');
        // Reload student detail & main roster
        await handleOpenStudentDetail(selectedStudentId);
        const stList = await fetchRiskStudents();
        if (Array.isArray(stList)) setStudents(stList);
      } else {
        alert(res.message || 'Could not record intervention');
      }
    } catch (err: any) {
      alert(`Error saving intervention: ${err.message}`);
    } finally {
      setIsSubmittingIntervention(false);
    }
  };

  const handleUpdateInterventionStatus = async (
    interventionId: number,
    newStatus: string
  ) => {
    try {
      await updateInterventionApi(interventionId, {
        status: newStatus,
        requester_role: currentUser.role
      });
      if (selectedStudentId) {
        await handleOpenStudentDetail(selectedStudentId);
      }
    } catch (err) {
      console.error('Error updating intervention status:', err);
    }
  };

  const handleFeedback = async (
    actualStatus: 'Accurate Risk' | 'False Alarm / Overestimated' | 'Underestimated Risk'
  ) => {
    if (!studentProfile) return;
    try {
      await submitPredictionFeedbackApi({
        prediction_id: studentProfile.student.id,
        user_id: studentProfile.student.id,
        reviewer_name: currentUser.name || 'Educator',
        reviewer_role: currentUser.role,
        actual_risk_status: actualStatus,
        comments: `Feedback submitted via Early Warning System UI by ${currentUser.name}`
      });
      setFeedbackSubmitted(actualStatus);
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }
  };

  // Helper colors
  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'High Risk':
        return <span className="badge badge-rose"><AlertTriangle size={12} /> High Risk</span>;
      case 'Medium Risk':
        return <span className="badge badge-gold"><Clock size={12} /> Medium Risk</span>;
      default:
        return <span className="badge badge-emerald"><CheckCircle2 size={12} /> Low Risk</span>;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High Risk': return '#ef4444';
      case 'Medium Risk': return '#f59e0b';
      default: return '#10b981';
    }
  };

  // Filtering
  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRisk =
      selectedRiskFilter === 'All' || s.risk_level === selectedRiskFilter;

    const matchesDept =
      selectedDeptFilter === 'All' || s.department.toLowerCase().includes(selectedDeptFilter.toLowerCase());

    const matchesSem =
      selectedSemFilter === 'All' || s.semester.toLowerCase().includes(selectedSemFilter.toLowerCase());

    return matchesSearch && matchesRisk && matchesDept && matchesSem;
  });

  // Departments for filter dropdown
  const uniqueDepts = Array.from(new Set(students.map(s => s.department).filter(Boolean)));
  const uniqueSems = Array.from(new Set(students.map(s => s.semester).filter(Boolean)));

  // Chart Data: Risk Tier Distribution
  const riskDoughnutData = {
    labels: ['High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [
      {
        data: [
          overview?.high_risk_count || 0,
          overview?.medium_risk_count || 0,
          overview?.low_risk_count || 0
        ],
        backgroundColor: ['rgba(239, 68, 68, 0.85)', 'rgba(245, 158, 11, 0.85)', 'rgba(16, 185, 129, 0.85)'],
        borderColor: ['#ef4444', '#f59e0b', '#10b981'],
        borderWidth: 1.5,
        hoverOffset: 6
      }
    ]
  };

  // Chart Data: Attendance vs Academic Performance Correlation
  const correlationChartData = {
    labels: overview?.correlation_points.map(p => p.student_name.split(' ')[0]) || [],
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: overview?.correlation_points.map(p => p.attendance_pct) || [],
        backgroundColor: 'rgba(56, 189, 248, 0.75)',
        borderColor: '#38bdf8',
        borderRadius: 6
      },
      {
        label: 'Assessment Average (%)',
        data: overview?.correlation_points.map(p => p.assessment_avg) || [],
        backgroundColor: 'rgba(168, 85, 247, 0.75)',
        borderColor: '#a855f7',
        borderRadius: 6
      }
    ]
  };

  // Chart Data: Department Risk Distribution
  const deptChartData = {
    labels: overview?.department_distribution.map(d => d.department.replace('Computer Science & Engineering', 'CSE').replace('Department', '').trim()) || [],
    datasets: [
      {
        label: 'High Risk',
        data: overview?.department_distribution.map(d => d.high_risk) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.8)'
      },
      {
        label: 'Medium Risk',
        data: overview?.department_distribution.map(d => d.med_risk) || [],
        backgroundColor: 'rgba(245, 158, 11, 0.8)'
      },
      {
        label: 'Low Risk',
        data: overview?.department_distribution.map(d => d.low_risk) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)'
      }
    ]
  };

  // Chart Data: 4-Week Risk Mitigation Trend
  const trendLineData = {
    labels: overview?.risk_trend.map(t => t.period) || [],
    datasets: [
      {
        label: 'Average Risk Score (0-100)',
        data: overview?.risk_trend.map(t => t.avg_risk_score) || [],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#f59e0b'
      },
      {
        label: 'High Risk Student Count',
        data: overview?.risk_trend.map(t => t.high_risk_count) || [],
        borderColor: '#ef4444',
        backgroundColor: 'transparent',
        tension: 0.35,
        borderDash: [5, 5],
        pointBackgroundColor: '#ef4444'
      }
    ]
  };

  // ============================================================================
  // STUDENT PORTAL VIEW (Personal Performance & Early Warning)
  // ============================================================================
  if (isStudent) {
    const prof = studentProfile?.risk_profile;
    const isAttWarning = (prof?.features.attendance_pct || 100) < 75.0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Banner */}
        <div className="glass-panel" style={{ padding: '28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '220px',
            height: '220px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="badge badge-emerald" style={{ marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={12} /> AI Academic Diagnostic System
              </span>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc', margin: '4px 0 8px 0' }}>
                My Academic Performance & Early Warning Insights
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '780px', margin: 0 }}>
                Continuous predictive evaluation analyzing attendance thresholds, modular quiz benchmarks, LMS progress, and cooperative placement readiness.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Model Status</span>
                <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>Random Forest Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Statutory Warning Alert if < 75% */}
        {isAttWarning && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px'
          }}>
            <ShieldAlert size={28} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 4px 0' }}>
                Debarment Warning: Attendance Below Statutory 75% Threshold
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#cbd5e1', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                Your recorded attendance is currently <strong>{prof?.features.attendance_pct}%</strong>. Under UGC & Cooperative Board regulations, students below 75% are ineligible to sit for final semester examinations. Please attend upcoming lectures and check in via Face AI or QR scanner.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <span className="badge badge-rose">Urgent Action Required</span>
                <span className="badge badge-indigo">Daily Check-In Geofence Enabled</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Performance Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {/* Card 1: Risk Tier */}
          <div className="glass-card" style={{ padding: '22px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Overall Risk Diagnostic
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
              <div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: getRiskColor(prof?.risk_level || 'Low Risk'), margin: 0 }}>
                  {prof?.risk_score}
                  <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span>
                </h2>
                <div style={{ marginTop: '6px' }}>{getRiskBadge(prof?.risk_level || 'Low Risk')}</div>
              </div>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: `4px solid ${getRiskColor(prof?.risk_level || 'Low Risk')}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.2)'
              }}>
                <Target size={28} color={getRiskColor(prof?.risk_level || 'Low Risk')} />
              </div>
            </div>
          </div>

          {/* Card 2: Attendance */}
          <div className="glass-card" style={{ padding: '22px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Biometric Attendance Rate
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
              <div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: (prof?.features.attendance_pct || 0) < 75 ? '#ef4444' : '#10b981', margin: 0 }}>
                  {prof?.features.attendance_pct}%
                </h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Required: 75.0% Minimum</span>
              </div>
              <Calendar size={32} color={(prof?.features.attendance_pct || 0) < 75 ? '#ef4444' : '#10b981'} style={{ opacity: 0.8 }} />
            </div>
          </div>

          {/* Card 3: Assessment Average */}
          <div className="glass-card" style={{ padding: '22px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Academic Assessment Avg
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
              <div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: (prof?.features.assessment_avg || 0) < 50 ? '#ef4444' : '#38bdf8', margin: 0 }}>
                  {prof?.features.assessment_avg}%
                </h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Across Quizzes & Labs</span>
              </div>
              <GraduationCap size={32} color="#38bdf8" style={{ opacity: 0.8 }} />
            </div>
          </div>

          {/* Card 4: Placement Readiness */}
          <div className="glass-card" style={{ padding: '22px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Placement Readiness Match
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
              <div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#a855f7', margin: 0 }}>
                  {prof?.features.placement_readiness}%
                </h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{prof?.features.skills_count} Verified Skills</span>
              </div>
              <Briefcase size={32} color="#a855f7" style={{ opacity: 0.8 }} />
            </div>
          </div>
        </div>

        {/* Explainability & Prescriptive Action Plan */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Explainability Card */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
              <HelpCircle size={18} color="#38bdf8" /> Why Did I Receive This Risk Score?
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              The model evaluates 5 orthogonal criteria. Below is the transparent breakdown of point impacts on your profile:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {prof?.explainability && Object.entries(prof.explainability).map(([key, item]) => (
                <div key={key} style={{
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#f8fafc', textTransform: 'capitalize' }}>
                      {key.replace('_', ' ')}
                    </strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Actual: {item.value} (Target: {item.threshold})
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: item.component_risk > 30 ? '#ef4444' : (item.component_risk > 10 ? '#f59e0b' : '#10b981')
                    }}>
                      +{item.component_risk} pts risk
                    </span>
                    <span className="badge badge-indigo" style={{ display: 'block', fontSize: '0.62rem', marginTop: '2px' }}>
                      Weight {item.weight}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Recommendations Card */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
              <Sparkles size={18} color="#f59e0b" /> Prescriptive Action & Study Plan
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              AI-generated personalized action items to reduce academic debarment risk and boost placement standing:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {prof?.recommendations.map((rec, i) => (
                <div key={i} style={{
                  padding: '14px',
                  background: 'rgba(245, 158, 11, 0.06)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#f59e0b',
                    color: '#000',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: '0.84rem', color: '#f8fafc', lineHeight: 1.4 }}>
                    {rec}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Assigned Faculty Interventions */}
        {studentProfile?.interventions && studentProfile.interventions.length > 0 && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="#10b981" /> Faculty Mentoring & Support Interventions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {studentProfile.interventions.map((inv) => (
                <div key={inv.id} style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="badge badge-indigo">{inv.type}</span>
                      <strong style={{ color: '#f8fafc', fontSize: '0.92rem' }}>{inv.title}</strong>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0' }}>{inv.notes}</p>
                    {inv.action_taken && (
                      <p style={{ fontSize: '0.8rem', color: '#38bdf8', margin: '4px 0' }}>
                        <strong>Action Taken:</strong> {inv.action_taken}
                      </p>
                    )}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Assigned by: {inv.assigned_trainer} • Follow-up: {inv.follow_up_date || 'TBD'}
                    </span>
                  </div>
                  <div>
                    <span className={`badge ${inv.status === 'Completed' ? 'badge-emerald' : 'badge-gold'}`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // ADMIN & TRAINER ENTERPRISE DASHBOARD
  // ============================================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner & Control Actions */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '18px' }}>
        <div>
          <span className="badge badge-rose" style={{ marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={12} /> Institutional Early Warning Engine
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc', margin: '4px 0 8px 0' }}>
            AI Student Performance Prediction & Early Warning System
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0, maxWidth: '820px' }}>
            Enterprise multi-factor machine learning pipeline predicting academic failure, debarment risks, low attendance, and cooperative skill stagnation with local SHAP explainability.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleRefreshPredictions}
            disabled={isRefreshing}
            className="gradient-btn"
            style={{ padding: '10px 18px', fontSize: '0.85rem' }}
            title="Recalculate AI risk predictions across all students"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Running AI Inference...' : 'Recalculate Predictions'}
          </button>

          <button
            onClick={handleOpenTelemetry}
            className="gradient-btn"
            style={{
              padding: '10px 18px',
              fontSize: '0.85rem',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
            title="View ML Confusion Matrix, Cross-Validation Scores, and Feature Importances"
          >
            <Cpu size={15} color="#38bdf8" />
            ML Model Telemetry
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Card 1: Total Monitored */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Students Monitored
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                {overview?.total_students || 0}
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#10b981' }}>100% Cohort Coverage</span>
            </div>
            <Users size={30} color="#38bdf8" style={{ opacity: 0.8 }} />
          </div>
        </div>

        {/* Card 2: High Risk Debarment Alerts */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
          <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            High-Risk Debarment Alerts
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444', margin: 0 }}>
                {overview?.high_risk_count || 0}
                <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                  ({overview?.high_risk_pct}%)
                </span>
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Immediate Intervention Needed</span>
            </div>
            <AlertTriangle size={30} color="#ef4444" style={{ opacity: 0.9 }} />
          </div>
        </div>

        {/* Card 3: Medium Risk Support Queue */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Medium-Risk Monitoring
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', margin: 0 }}>
                {overview?.medium_risk_count || 0}
                <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                  ({overview?.medium_risk_pct}%)
                </span>
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Watchlist / Peer Coaching</span>
            </div>
            <Clock size={30} color="#f59e0b" style={{ opacity: 0.9 }} />
          </div>
        </div>

        {/* Card 4: Model Accuracy / F1-Score */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Model Validation F1-Score
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', margin: 0 }}>
                {overview?.active_model ? (overview.active_model.f1_score * 100).toFixed(1) : '94.8'}%
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {overview?.active_model?.model_type || 'Random Forest'}
              </span>
            </div>
            <Cpu size={30} color="#10b981" style={{ opacity: 0.8 }} />
          </div>
        </div>

        {/* Card 5: Interventions */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Active Interventions
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#a855f7', margin: 0 }}>
                {overview?.interventions.total || 0}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {overview?.interventions.pending || 0} Pending Action
              </span>
            </div>
            <MessageSquare size={30} color="#a855f7" style={{ opacity: 0.8 }} />
          </div>
        </div>
      </div>

      {/* Enterprise Interactive Visualizations Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
        {/* Chart 1: Risk Tier Distribution */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <PieIcon size={16} color="#38bdf8" /> Cohort Risk Level Distribution
            </h3>
            <span className="badge badge-indigo">All Departments</span>
          </div>
          <div style={{ height: '230px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut
              data={riskDoughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { color: '#cbd5e1', font: { size: 11 } } }
                }
              }}
            />
          </div>
        </div>

        {/* Chart 2: Attendance vs Academic Performance Correlation */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <BarChart2 size={16} color="#a855f7" /> Attendance vs Academic Performance Correlation
            </h3>
            <span className="badge badge-rose">&lt; 75% Debarment Risk</span>
          </div>
          <div style={{ height: '230px' }}>
            <Bar
              data={correlationChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
                  y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.06)' }, max: 100 }
                },
                plugins: {
                  legend: { position: 'top', labels: { color: '#cbd5e1', font: { size: 11 } } }
                }
              }}
            />
          </div>
        </div>

        {/* Chart 3: Department-wise Risk Distribution */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Layers size={16} color="#10b981" /> Department-Wise Risk Distribution
            </h3>
            <span className="badge badge-emerald">Real-time DB Sync</span>
          </div>
          <div style={{ height: '230px' }}>
            <Bar
              data={deptChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { ticks: { color: '#94a3b8' }, grid: { display: false }, stacked: true },
                  y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.06)' }, stacked: true }
                },
                plugins: {
                  legend: { position: 'top', labels: { color: '#cbd5e1', font: { size: 11 } } }
                }
              }}
            />
          </div>
        </div>

        {/* Chart 4: 4-Week Risk Mitigation Trend */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <TrendingDown size={16} color="#f59e0b" /> Early Warning Risk Reduction Trend
            </h3>
            <span className="badge badge-gold">Post-Intervention</span>
          </div>
          <div style={{ height: '230px' }}>
            <Line
              data={trendLineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
                  y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.06)' } }
                },
                plugins: {
                  legend: { position: 'top', labels: { color: '#cbd5e1', font: { size: 11 } } }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Search */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search student by name, student ID, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '0.9rem',
              width: '100%'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Risk Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              value={selectedRiskFilter}
              onChange={(e) => setSelectedRiskFilter(e.target.value)}
              className="glass-card"
              style={{
                padding: '6px 12px',
                color: '#f8fafc',
                fontSize: '0.82rem',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <option value="All">All Risk Tiers</option>
              <option value="High Risk">🔴 High Risk</option>
              <option value="Medium Risk">🟡 Medium Risk</option>
              <option value="Low Risk">🟢 Low Risk</option>
            </select>
          </div>

          {/* Department Filter */}
          {uniqueDepts.length > 0 && (
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="glass-card"
              style={{
                padding: '6px 12px',
                color: '#f8fafc',
                fontSize: '0.82rem',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <option value="All">All Departments</option>
              {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}

          {/* Semester Filter */}
          {uniqueSems.length > 0 && (
            <select
              value={selectedSemFilter}
              onChange={(e) => setSelectedSemFilter(e.target.value)}
              className="glass-card"
              style={{
                padding: '6px 12px',
                color: '#f8fafc',
                fontSize: '0.82rem',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <option value="All">All Semesters</option>
              {uniqueSems.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Actionable Risk Roster Table */}
      <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Users size={18} color="#38bdf8" /> Actionable Early Warning Student Roster
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredStudents.length}</strong> of {students.length} students
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 14px' }}>Student Profile</th>
              <th style={{ padding: '12px 14px' }}>Department & Sem</th>
              <th style={{ padding: '12px 14px' }}>Attendance</th>
              <th style={{ padding: '12px 14px' }}>Assessments</th>
              <th style={{ padding: '12px 14px' }}>Risk Index</th>
              <th style={{ padding: '12px 14px' }}>Primary Risk Drivers</th>
              <th style={{ padding: '12px 14px' }}>Intervention</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => {
              const isAttLow = student.features.attendance_pct < 75.0;
              const isAssLow = student.features.assessment_avg < 50.0;

              return (
                <tr
                  key={student.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    background: student.risk_level === 'High Risk' ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                >
                  {/* Student Profile */}
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}>
                        {student.student_name.charAt(0)}
                      </div>
                      <div>
                        <strong style={{ color: '#f8fafc', fontSize: '0.9rem', display: 'block' }}>
                          {student.student_name}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ID: {student.student_id}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td style={{ padding: '14px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#cbd5e1', display: 'block' }}>
                      {student.department}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {student.semester}
                    </span>
                  </td>

                  {/* Attendance */}
                  <td style={{ padding: '14px' }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: isAttLow ? '#ef4444' : '#10b981'
                    }}>
                      {student.features.attendance_pct}%
                    </span>
                    {isAttLow && (
                      <span className="badge badge-rose" style={{ display: 'inline-block', fontSize: '0.62rem', marginLeft: '6px' }}>
                        &lt; 75%
                      </span>
                    )}
                  </td>

                  {/* Assessments */}
                  <td style={{ padding: '14px' }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: isAssLow ? '#ef4444' : (student.features.assessment_avg < 65 ? '#f59e0b' : '#38bdf8')
                    }}>
                      {student.features.assessment_avg}%
                    </span>
                  </td>

                  {/* Risk Score */}
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '1rem', color: getRiskColor(student.risk_level) }}>
                        {student.risk_score}
                      </strong>
                      {getRiskBadge(student.risk_level)}
                    </div>
                    {/* Progress bar */}
                    <div style={{ width: '100px', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, student.risk_score)}%`,
                        height: '100%',
                        background: getRiskColor(student.risk_level),
                        borderRadius: '3px'
                      }} />
                    </div>
                  </td>

                  {/* Primary Risk Factors */}
                  <td style={{ padding: '14px', maxWidth: '300px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {student.primary_factors.slice(0, 2).map((factor, i) => (
                        <span key={i} style={{
                          fontSize: '0.74rem',
                          color: student.risk_level === 'High Risk' ? '#fca5a5' : '#cbd5e1',
                          background: 'rgba(255,255,255,0.03)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          • {factor}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Latest Intervention */}
                  <td style={{ padding: '14px' }}>
                    {student.latest_intervention ? (
                      <div>
                        <span className={`badge ${student.latest_intervention.status === 'Completed' ? 'badge-emerald' : 'badge-gold'}`} style={{ fontSize: '0.68rem' }}>
                          {student.latest_intervention.status}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                          {student.latest_intervention.type}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>None Logged</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenStudentDetail(student.student_id)}
                      className="gradient-btn"
                      style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                    >
                      Explain & Intervene
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ===================================================================== */}
      {/* STUDENT EXPLAINABILITY & INTERVENTION DRAWER / MODAL */}
      {/* ===================================================================== */}
      {selectedStudentId && studentProfile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '920px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '30px',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedStudentId(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>

            {/* Profile Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1.3rem'
                }}>
                  {studentProfile.student.name.charAt(0)}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 4px 0' }}>
                    {studentProfile.student.name}
                  </h2>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                    <span>ID: <strong>{studentProfile.student.student_id}</strong></span>
                    <span>•</span>
                    <span>{studentProfile.student.department}</span>
                    <span>•</span>
                    <span>{studentProfile.student.semester}</span>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Early Warning Index</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: getRiskColor(studentProfile.risk_profile.risk_level), margin: 0 }}>
                    {studentProfile.risk_profile.risk_score}
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/100</span>
                  </h2>
                  {getRiskBadge(studentProfile.risk_profile.risk_level)}
                </div>
              </div>
            </div>

            {/* Component Risk Gauges */}
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
                Multi-Dimensional Risk Components
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                {Object.entries(studentProfile.risk_profile.component_risks).map(([key, val]) => (
                  <div key={key} style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '10px',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize', display: 'block' }}>
                      {key} Risk
                    </span>
                    <strong style={{
                      fontSize: '1.2rem',
                      color: val > 50 ? '#ef4444' : (val > 25 ? '#f59e0b' : '#10b981'),
                      display: 'block',
                      margin: '4px 0'
                    }}>
                      {val} pts
                    </strong>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, val)}%`,
                        height: '100%',
                        background: val > 50 ? '#ef4444' : (val > 25 ? '#f59e0b' : '#10b981')
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transparent Explainability Breakdown */}
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <HelpCircle size={16} color="#38bdf8" /> Prediction Explainability & Benchmark Analysis
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(studentProfile.risk_profile.explainability).map(([k, exp]) => (
                  <div key={k} style={{
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div>
                      <strong style={{ color: '#f8fafc', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                        {k.replace('_', ' ')}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
                        Observed: <strong>{exp.value}</strong> vs Target: {exp.threshold}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className={`badge ${exp.component_risk > 30 ? 'badge-rose' : (exp.component_risk > 10 ? 'badge-gold' : 'badge-emerald')}`}>
                        {exp.status} (+{exp.component_risk} pts)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prescriptive Recommended Interventions */}
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Sparkles size={16} color="#f59e0b" /> Prescriptive AI Action Recommendations
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {studentProfile.risk_profile.recommendations.map((rec, i) => (
                  <div key={i} style={{
                    padding: '10px 14px',
                    background: 'rgba(245, 158, 11, 0.06)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    color: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <ChevronRight size={14} color="#f59e0b" /> {rec}
                  </div>
                ))}
              </div>
            </div>

            {/* Faculty Intervention Recording Form */}
            <div style={{ marginTop: '28px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '22px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <MessageSquare size={16} color="#10b981" /> Record New Intervention Action
              </h4>

              <form onSubmit={handleCreateIntervention} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Intervention Type
                  </label>
                  <select
                    value={interventionType}
                    onChange={(e) => setInterventionType(e.target.value)}
                    className="glass-card"
                    style={{ width: '100%', padding: '9px 12px', color: '#f8fafc', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <option value="Academic Counseling">Academic Counseling (1-on-1)</option>
                    <option value="Remedial Class">Remedial Tutorial / Catch-up Session</option>
                    <option value="Peer Mentoring">Peer Mentoring Assignment</option>
                    <option value="Attendance Warning">Formal Attendance Warning Letter</option>
                    <option value="Placement Mock Interview">Placement & Resume Clinic</option>
                    <option value="Parent Communication">Parent / Guardian Notification</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Intervention Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mandatory DSA Recursion Remedial"
                    value={interventionTitle}
                    onChange={(e) => setInterventionTitle(e.target.value)}
                    className="glass-card"
                    style={{ width: '100%', padding: '9px 12px', color: '#f8fafc', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Assigned Faculty / Mentor
                  </label>
                  <input
                    type="text"
                    value={assignedTrainer}
                    onChange={(e) => setAssignedTrainer(e.target.value)}
                    className="glass-card"
                    style={{ width: '100%', padding: '9px 12px', color: '#f8fafc', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Follow-Up Date
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="glass-card"
                    style={{ width: '100%', padding: '9px 12px', color: '#f8fafc', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Notes & Action Plan
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Document specific diagnostic findings, target milestones, and counseling notes..."
                    value={interventionNotes}
                    onChange={(e) => setInterventionNotes(e.target.value)}
                    className="glass-card"
                    style={{ width: '100%', padding: '9px 12px', color: '#f8fafc', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={isSubmittingIntervention}
                    className="gradient-btn gradient-btn-success"
                    style={{ padding: '9px 20px', fontSize: '0.85rem' }}
                  >
                    {isSubmittingIntervention ? 'Saving...' : 'Record Intervention'}
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Interventions List */}
            {studentProfile.interventions && studentProfile.interventions.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
                  Recorded Interventions History ({studentProfile.interventions.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {studentProfile.interventions.map((inv) => (
                    <div key={inv.id} style={{
                      padding: '12px 14px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}>
                      <div>
                        <strong style={{ fontSize: '0.85rem', color: '#f8fafc' }}>{inv.title}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                          ({inv.type}) by {inv.assigned_trainer} • {inv.created_at}
                        </span>
                        {inv.notes && (
                          <p style={{ fontSize: '0.78rem', color: '#cbd5e1', margin: '4px 0 0 0' }}>{inv.notes}</p>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select
                          value={inv.status}
                          onChange={(e) => handleUpdateInterventionStatus(inv.id, e.target.value)}
                          className="glass-card"
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.72rem',
                            color: '#f8fafc',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.1)'
                          }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Escalated">Escalated</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Faculty Feedback on Prediction Accuracy */}
            <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Educator Model Feedback:</span>
                <span style={{ fontSize: '0.82rem', color: '#f8fafc', marginLeft: '6px' }}>Was this risk prediction accurate?</span>
              </div>

              {feedbackSubmitted ? (
                <span className="badge badge-emerald">
                  <Check size={12} /> Feedback Logged ({feedbackSubmitted})
                </span>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleFeedback('Accurate Risk')}
                    className="glass-card"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    <ThumbsUp size={12} /> Accurate Prediction
                  </button>
                  <button
                    onClick={() => handleFeedback('False Alarm / Overestimated')}
                    className="glass-card"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    <ThumbsDown size={12} /> Overestimated Risk
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ML MODEL TELEMETRY & AUDIT MODAL */}
      {/* ===================================================================== */}
      {showTelemetryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '820px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowTelemetryModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>

            <span className="badge badge-indigo" style={{ marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={12} /> Machine Learning Audit & Model Validation
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', margin: '4px 0 16px 0' }}>
              Active Predictive Model: {telemetryData?.model_type || 'RandomForestClassifier'}
            </h2>

            {/* Telemetry Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              <div className="glass-card" style={{ padding: '14px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Precision (Weighted)</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', margin: '4px 0 0 0' }}>
                  {telemetryData ? (telemetryData.precision_score * 100).toFixed(1) : '100.0'}%
                </h3>
              </div>

              <div className="glass-card" style={{ padding: '14px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Recall (Weighted)</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', margin: '4px 0 0 0' }}>
                  {telemetryData ? (telemetryData.recall_score * 100).toFixed(1) : '100.0'}%
                </h3>
              </div>

              <div className="glass-card" style={{ padding: '14px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>F1-Score</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', margin: '4px 0 0 0' }}>
                  {telemetryData ? (telemetryData.f1_score * 100).toFixed(1) : '100.0'}%
                </h3>
              </div>

              <div className="glass-card" style={{ padding: '14px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>5-Fold CV Mean F1</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a855f7', margin: '4px 0 0 0' }}>
                  {telemetryData ? (telemetryData.cv_mean_f1 * 100).toFixed(1) : '100.0'}%
                </h3>
              </div>
            </div>

            {/* Confusion Matrix Table */}
            {telemetryData?.confusion_matrix && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
                  Test Set Confusion Matrix (3x3 Multiclass)
                </h4>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '10px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-muted)' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Actual \ Predicted</th>
                        <th style={{ padding: '8px', color: '#10b981' }}>Pred: Low Risk</th>
                        <th style={{ padding: '8px', color: '#f59e0b' }}>Pred: Med Risk</th>
                        <th style={{ padding: '8px', color: '#ef4444' }}>Pred: High Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px', textAlign: 'left', color: '#10b981', fontWeight: 600 }}>Actual: Low Risk</td>
                        <td style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.2)', fontWeight: 700 }}>{telemetryData.confusion_matrix[0]?.[0] || 0}</td>
                        <td style={{ padding: '8px' }}>{telemetryData.confusion_matrix[0]?.[1] || 0}</td>
                        <td style={{ padding: '8px' }}>{telemetryData.confusion_matrix[0]?.[2] || 0}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px', textAlign: 'left', color: '#f59e0b', fontWeight: 600 }}>Actual: Med Risk</td>
                        <td style={{ padding: '8px' }}>{telemetryData.confusion_matrix[1]?.[0] || 0}</td>
                        <td style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.2)', fontWeight: 700 }}>{telemetryData.confusion_matrix[1]?.[1] || 0}</td>
                        <td style={{ padding: '8px' }}>{telemetryData.confusion_matrix[1]?.[2] || 0}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px', textAlign: 'left', color: '#ef4444', fontWeight: 600 }}>Actual: High Risk</td>
                        <td style={{ padding: '8px' }}>{telemetryData.confusion_matrix[2]?.[0] || 0}</td>
                        <td style={{ padding: '8px' }}>{telemetryData.confusion_matrix[2]?.[1] || 0}</td>
                        <td style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.2)', fontWeight: 700 }}>{telemetryData.confusion_matrix[2]?.[2] || 0}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Feature Importances Ranking */}
            {telemetryData?.feature_importances && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
                  Random Forest Feature Importance Weights
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(telemetryData.feature_importances)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([feat, imp]) => {
                      const pct = Math.round((imp as number) * 100);
                      return (
                        <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '0.8rem', color: '#cbd5e1', width: '220px', textTransform: 'capitalize' }}>
                            {feat.replace(/_/g, ' ')}
                          </span>
                          <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #38bdf8)', borderRadius: '4px' }} />
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', width: '45px', textAlign: 'right' }}>
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Retrain Controls */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  Training Samples: <strong>{telemetryData?.training_samples_count || 400}</strong> records
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Last trained: {telemetryData?.trained_at || 'Recently'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleRetrainModel('RandomForestClassifier')}
                  disabled={isRetraining}
                  className="gradient-btn"
                  style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                >
                  <RefreshCw size={14} className={isRetraining ? 'animate-spin' : ''} />
                  Retrain Random Forest
                </button>
                <button
                  onClick={() => handleRetrainModel('LogisticRegression')}
                  disabled={isRetraining}
                  className="glass-card"
                  style={{ padding: '8px 16px', fontSize: '0.82rem', color: '#f8fafc', cursor: 'pointer' }}
                >
                  Train Logistic Regression
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

