export interface UserProfile {
  id: number;
  student_id: string;
  roll_number: string;
  name: string;
  email: string;
  role: 'student' | 'trainer' | 'admin' | 'employer' | 'ncct_admin' | 'institution_admin';
  department: string;
  semester: string;
  degree?: string;
  skills: string;
  avatar: string;
  institution?: string;
}

export interface ProgrammeItem {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  location: string;
  institution: string;
  capacity: number;
  enrolled: number;
  hostel_available: boolean;
  status: 'Open' | 'Closed' | 'Upcoming';
  category: string;
}

export interface AttendanceRecord {
  id: number;
  student_id: string;
  student_name: string;
  date: string;
  time: string;
  method: string;
  confidence: number;
  liveness_verified: boolean;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  distance?: number | null;
  geofence_status?: string | null;
  device_info?: string | null;
  session_id?: string | null;
}

export interface CourseItem {
  id: number;
  title: string;
  category: string;
  trainer_name: string;
  duration: string;
  modules_count: number;
  enrolled_count: number;
  description: string;
  thumbnail: string;
  youtube_url?: string;
  progress_percentage: number;
}

export interface CertificateItem {
  id: number;
  certificate_no: string;
  student_name: string;
  course_title: string;
  issue_date: string;
  grade: string;
  status: string;
}

export interface JobItem {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  required_skills: string;
  description: string;
  openings: number;
  deadline: string;
  logo: string;
  skill_match_score: number;
}

export interface AnalyticsData {
  metrics: {
    total_students: number;
    present_today: number;
    attendance_rate: number;
    course_completion_rate: number;
    placement_rate: number;
    anti_spoof_preventions: number;
  };
  daily_attendance_trend: Array<{ day: string; present: number; absent: number }>;
  department_distribution: Array<{ department: string; students: number; color: string }>;
  in_demand_skills: Array<{ skill: string; demand: number }>;
}

// ==============================================================================
// STUDENT PERFORMANCE PREDICTION & EARLY WARNING SYSTEM TYPES
// ==============================================================================

export interface ComponentRisks {
  attendance: number;
  academic: number;
  completion: number;
  skill: number;
  placement: number;
}

export interface StudentFeatures {
  attendance_pct: number;
  assessment_avg: number;
  course_completion_pct: number;
  learning_activity_score: number;
  placement_readiness: number;
  skills_count: number;
}

export interface ExplainabilityFactor {
  value: string;
  threshold: string;
  component_risk: number;
  weight: string;
  status: string;
}

export interface StudentRiskRecord {
  id: number;
  user_id: number;
  student_id: string;
  student_name: string;
  department: string;
  semester: string;
  risk_score: number;
  risk_level: 'Low Risk' | 'Medium Risk' | 'High Risk';
  component_risks: ComponentRisks;
  features: StudentFeatures;
  primary_factors: string[];
  explainability: Record<string, ExplainabilityFactor>;
  recommendations: string[];
  model_version: string;
  is_preliminary: boolean;
  predicted_at: string;
  latest_intervention?: {
    id: number;
    type: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Escalated';
    assigned_trainer: string;
  } | null;
}

export interface RiskOverviewData {
  total_students: number;
  high_risk_count: number;
  high_risk_pct: number;
  medium_risk_count: number;
  medium_risk_pct: number;
  low_risk_count: number;
  low_risk_pct: number;
  department_distribution: Array<{
    department: string;
    total: number;
    high_risk: number;
    med_risk: number;
    low_risk: number;
  }>;
  correlation_points: Array<{
    student_id: string;
    student_name: string;
    attendance_pct: number;
    assessment_avg: number;
    risk_score: number;
    risk_level: string;
  }>;
  risk_trend: Array<{
    period: string;
    high_risk_count: number;
    avg_risk_score: number;
  }>;
  interventions: {
    total: number;
    pending: number;
    completed: number;
  };
  active_model?: {
    version_name: string;
    model_type: string;
    accuracy: number;
    f1_score: number;
    precision: number;
    recall: number;
    cv_mean_f1: number;
    cv_std_f1: number;
    roc_auc: number;
    feature_importances: Record<string, number>;
    confusion_matrix: number[][];
    training_samples: number;
    trained_at: string;
  } | null;
  is_preliminary: boolean;
}

export interface StudentInterventionItem {
  id: number;
  user_id: number;
  student_id: string;
  student_name: string;
  risk_level: string;
  type: string;
  title: string;
  notes: string;
  action_taken: string;
  assigned_trainer: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Escalated';
  follow_up_date?: string | null;
  outcome_notes?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface AssessmentItem {
  id: number;
  subject: string;
  type: string;
  score: number;
  max_score: number;
  weight: number;
  date: string;
}

export interface StudentRiskProfileResponse {
  success: boolean;
  student: {
    id: number;
    student_id: string;
    name: string;
    email: string;
    department: string;
    semester: string;
    skills: string;
    avatar: string;
  };
  risk_profile: {
    risk_score: number;
    risk_level: 'Low Risk' | 'Medium Risk' | 'High Risk';
    component_risks: ComponentRisks;
    features: StudentFeatures;
    primary_factors: string[];
    explainability: Record<string, ExplainabilityFactor>;
    recommendations: string[];
    model_version: string;
    is_preliminary: boolean;
    predicted_at: string;
  };
  assessments: AssessmentItem[];
  interventions: StudentInterventionItem[];
}

