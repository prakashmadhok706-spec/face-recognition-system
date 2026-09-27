export interface UserProfile {
  id: number;
  student_id: string;
  roll_number: string;
  name: string;
  email: string;
  role: 'student' | 'trainer' | 'admin' | 'employer';
  department: string;
  semester: string;
  degree?: string;
  skills: string;
  avatar: string;
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
