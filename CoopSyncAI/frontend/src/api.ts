// Always use direct backend URL — avoids port-mismatch issues when Vite uses a different port
const API_BASE = 'http://127.0.0.1:8000/api';

// Safe JSON parser — prevents "Unexpected end of JSON input" when server returns empty body
async function safeJson(res: Response) {
  const text = await res.text();
  if (!text || text.trim() === '') return { success: false, message: 'Empty response from server' };
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, message: `Server error: ${text.substring(0, 200)}` };
  }
}

// Secure Token Management (Task 7: Centralized Frontend Auth Integration)
export function getAccessToken(): string | null {
  try {
    return sessionStorage.getItem('coopsync_access_token');
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  try {
    return sessionStorage.getItem('coopsync_refresh_token');
  } catch {
    return null;
  }
}

export function setAuthTokens(accessToken: string, refreshToken?: string) {
  try {
    sessionStorage.setItem('coopsync_access_token', accessToken);
    if (refreshToken) {
      sessionStorage.setItem('coopsync_refresh_token', refreshToken);
    }
  } catch {}
}

export function clearAuthTokens() {
  try {
    sessionStorage.removeItem('coopsync_access_token');
    sessionStorage.removeItem('coopsync_refresh_token');
    sessionStorage.removeItem('coopsync_session');
  } catch {}
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAccessToken();
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function refreshAccessTokenApi(): Promise<boolean> {
  const rToken = getRefreshToken();
  if (!rToken) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rToken }),
    });
    if (!res.ok) {
      clearAuthTokens();
      return false;
    }
    const data = await safeJson(res);
    if (data && data.access_token) {
      setAuthTokens(data.access_token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function logoutUserApi(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    });
  } catch {}
  clearAuthTokens();
}

// Centralized authenticated fetch wrapper: auto-attaches Bearer token and handles refresh
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const customHeaders = (init?.headers as Record<string, string>) || {};
  const mergedHeaders = getAuthHeaders(customHeaders);
  const response = await fetch(input, {
    ...init,
    headers: mergedHeaders,
  });

  if (response.status === 401 && !input.includes('/auth/')) {
    const refreshed = await refreshAccessTokenApi();
    if (refreshed) {
      const retryHeaders = getAuthHeaders(customHeaders);
      return await fetch(input, {
        ...init,
        headers: retryHeaders,
      });
    }
  }
  return response;
}



export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  } catch (e) {
    try {
      const fallback = await fetch('http://127.0.0.1:8000/api/health');
      return await fallback.json();
    } catch {
      return { status: 'offline', error: String(e) };
    }
  }
}

export async function fetchStudents() {
  try {
    const res = await apiFetch(`${API_BASE}/students`);
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch (e) {
    try {
      const fallback = await fetch('http://127.0.0.1:8000/api/students');
      return await fallback.json();
    } catch {
      return [];
    }
  }
}

export async function fetchAdmins() {
  try {
    const res = await apiFetch(`${API_BASE}/admins`);
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch (e) {
    try {
      const fallback = await fetch('http://127.0.0.1:8000/api/admins');
      return await fallback.json();
    } catch {
      return [];
    }
  }
}

export async function recognizeFaceImage(
  base64Image: string, 
  studentId?: string,
  gpsData?: { latitude?: number; longitude?: number; accuracy?: number; session_id?: string; device_info?: string }
) {
  const body: Record<string, any> = { image_base64: base64Image };
  if (studentId) body.student_id = studentId;
  if (gpsData) {
    if (gpsData.latitude !== undefined) body.latitude = gpsData.latitude;
    if (gpsData.longitude !== undefined) body.longitude = gpsData.longitude;
    if (gpsData.accuracy !== undefined) body.accuracy = gpsData.accuracy;
    if (gpsData.session_id !== undefined) body.session_id = gpsData.session_id;
    if (gpsData.device_info !== undefined) body.device_info = gpsData.device_info;
  }
  try {
    const res = await apiFetch(`${API_BASE}/attendance/face-recognize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err: any) {
    if (API_BASE.startsWith('/')) {
      const fallback = await fetch('http://127.0.0.1:8000/api/attendance/face-recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return await fallback.json();
    }
    throw err;
  }
}

export async function launchDesktopOpenCVCamera() {
  const res = await apiFetch(`${API_BASE}/attendance/launch-opencv-camera`, {
    method: 'POST',
  });
  return await res.json();
}

export async function generateQRAttendance() {
  const res = await apiFetch(`${API_BASE}/attendance/qr/generate`, {
    method: 'POST',
  });
  return await res.json();
}

export async function verifyQRAttendance(
  qrText: string, 
  studentId: string,
  gpsData?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    timestamp?: number;
    session_id?: string;
    device_info?: string;
  }
) {
  const payload: any = { qr_text: qrText, student_id: studentId };
  if (gpsData) {
    if (gpsData.latitude !== undefined) payload.latitude = gpsData.latitude;
    if (gpsData.longitude !== undefined) payload.longitude = gpsData.longitude;
    if (gpsData.accuracy !== undefined) payload.accuracy = gpsData.accuracy;
    if (gpsData.timestamp !== undefined) payload.timestamp = gpsData.timestamp;
    if (gpsData.session_id !== undefined) payload.session_id = gpsData.session_id;
    if (gpsData.device_info !== undefined) payload.device_info = gpsData.device_info;
  }
  const res = await apiFetch(`${API_BASE}/attendance/qr/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

export async function fetchInstitutionConfig() {
  const res = await apiFetch(`${API_BASE}/institution/config`);
  return await res.json();
}

export async function updateInstitutionConfig(configData: any, requesterRole: string = 'admin') {
  const res = await apiFetch(`${API_BASE}/institution/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...configData, requester_role: requesterRole }),
  });
  return await res.json();
}

export async function fetchAttendanceLogs(studentId?: string) {
  const url = studentId ? `${API_BASE}/attendance/logs?student_id=${studentId}` : `${API_BASE}/attendance/logs`;
  const res = await fetch(url);
  return await res.json();
}

export async function syncOfflineAttendance(records: any[]) {
  const res = await apiFetch(`${API_BASE}/attendance/sync-offline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records }),
  });
  return await res.json();
}

export async function updateAttendanceApi(attId: number, data: { status?: string; method?: string; time?: string; date?: string }) {
  try {
    const res = await apiFetch(`${API_BASE}/attendance/${attId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}

export async function manualAttendanceApi(data: { student_id: string; date?: string; time?: string; status?: string; method?: string }) {
  try {
    const res = await apiFetch(`${API_BASE}/attendance/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}

export async function deleteAttendanceApi(attId: number) {
  try {
    const res = await apiFetch(`${API_BASE}/attendance/${attId}`, {
      method: 'DELETE',
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}

export async function fetchCourses() {
  const res = await apiFetch(`${API_BASE}/courses`);
  return await res.json();
}

export async function createCourse(courseData: any) {
  const res = await apiFetch(`${API_BASE}/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(courseData),
  });
  return await res.json();
}

export async function fetchCertificates(studentName?: string) {
  const url = studentName 
    ? `${API_BASE}/certificates?student_name=${encodeURIComponent(studentName)}` 
    : `${API_BASE}/certificates`;
  const res = await fetch(url);
  return await res.json();
}

export async function generateCertificate(studentName: string, courseTitle: string) {
  const res = await apiFetch(`${API_BASE}/certificates/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_name: studentName, course_title: courseTitle }),
  });
  return await res.json();
}

export async function fetchJobs(userId: number = 1) {
  const res = await apiFetch(`${API_BASE}/jobs?user_id=${userId}`);
  return await res.json();
}

export async function applyJob(jobId: number, userId: number, note?: string) {
  const res = await apiFetch(`${API_BASE}/jobs/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: jobId, user_id: userId, note }),
  });
  return await res.json();
}

export async function fetchAnalytics() {
  const res = await apiFetch(`${API_BASE}/analytics`);
  return await res.json();
}

export async function sendAIChat(query: string, userId: number = 1) {
  const res = await apiFetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, user_id: userId }),
  });
  return await res.json();
}

export async function addStudentApi(studentData: any) {
  try {
    const res = await apiFetch(`${API_BASE}/students/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData),
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}

export async function captureSampleApi(sampleData: {
  student_id: string;
  student_name: string;
  image_base64: string;
  requester_role?: string;
  target_samples?: number;
}) {
  try {
    const res = await apiFetch(`${API_BASE}/students/capture-sample`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sampleData),
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, error: `Network error: ${err.message}`, message: err.message, samples_count: 0 };
  }
}

export async function resetStudentSamplesApi(studentId: string, requesterRole: string = 'admin') {
  try {
    const res = await apiFetch(`${API_BASE}/students/${encodeURIComponent(studentId)}/reset-samples`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requester_role: requesterRole }),
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, error: err.message, message: `Network error: ${err.message}` };
  }
}

export async function fetchStudentSamplesCountApi(studentId: string) {
  try {
    const res = await apiFetch(`${API_BASE}/students/${encodeURIComponent(studentId)}/samples-count`);
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, samples_count: 0, error: err.message };
  }
}

export async function triggerRetrainModelApi(requesterRole: string = 'admin') {
  try {
    const res = await apiFetch(`${API_BASE}/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requester_role: requesterRole }),
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}

export async function fetchRetrainStatusApi() {
  try {
    const res = await apiFetch(`${API_BASE}/train/status`);
    return await safeJson(res);
  } catch (err: any) {
    return { status: 'failed', progress: 0, message: `Polling error: ${err.message}` };
  }
}

export async function trainModelApi(requesterRole: string = 'admin') {
  return await triggerRetrainModelApi(requesterRole);
}

export async function updateStudentApi(studentId: string, studentData: any) {
  const res = await apiFetch(`${API_BASE}/students/${studentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData),
  });
  return await res.json();
}


export async function deleteStudentApi(studentId: string) {
  try {
    const res = await apiFetch(`${API_BASE}/students/${studentId}`, {
      method: 'DELETE',
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}

export async function clearAttendanceLogsApi() {
  const res = await apiFetch(`${API_BASE}/attendance/clear`, {
    method: 'POST',
  });
  return await res.json();
}

export async function loginUserApi(emailOrId: string, password: string = 'admin123') {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_or_id: emailOrId, password }),
    });
    const data = await safeJson(res);
    if (data && data.access_token) {
      setAuthTokens(data.access_token, data.refresh_token);
    }
    return data;
  } catch (err: any) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}

export async function registerUserApi(data: {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'admin' | 'trainer';
  student_id?: string;
  roll_number?: string;
  department?: string;
  semester?: string;
  degree?: string;
  gender?: string;
  skills?: string;
}) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}

export async function getAIConfig() {
  try {
    const res = await apiFetch(`${API_BASE}/ai/config`);
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}

export async function updateAIConfig(provider: string, apiKey: string) {
  try {
    const res = await apiFetch(`${API_BASE}/ai/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, api_key: apiKey }),
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}

export async function testAIChat(query: string, userId: number = 1) {
  const res = await apiFetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, user_id: userId }),
  });
  return await res.json();
}

// ==============================================================================
// STUDENT PERFORMANCE PREDICTION & EARLY WARNING SYSTEM APIs
// ==============================================================================

export async function fetchRiskOverview() {
  try {
    const res = await apiFetch(`${API_BASE}/risk/overview`);
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchRiskStudents(filters?: {
  risk_level?: string;
  department?: string;
  semester?: string;
  search?: string;
}) {
  try {
    const params = new URLSearchParams();
    if (filters?.risk_level) params.append('risk_level', filters.risk_level);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.semester) params.append('semester', filters.semester);
    if (filters?.search) params.append('search', filters.search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiFetch(`${API_BASE}/risk/students${qs}`);
    return await safeJson(res);
  } catch (err: any) {
    return [];
  }
}

export async function fetchStudentRiskProfile(studentId: string) {
  try {
    const res = await apiFetch(`${API_BASE}/risk/student/${studentId}`);
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function triggerBatchRiskPrediction() {
  try {
    const res = await apiFetch(`${API_BASE}/risk/predict/all`, { method: 'POST' });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function triggerSingleRiskPrediction(studentId: string) {
  try {
    const res = await apiFetch(`${API_BASE}/risk/predict/student/${studentId}`, { method: 'POST' });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function fetchInterventions(filters?: { student_id?: string; status?: string }) {
  try {
    const params = new URLSearchParams();
    if (filters?.student_id) params.append('student_id', filters.student_id);
    if (filters?.status) params.append('status', filters.status);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiFetch(`${API_BASE}/risk/interventions${qs}`);
    return await safeJson(res);
  } catch (err: any) {
    return [];
  }
}

export async function recordInterventionApi(data: {
  student_id: string;
  risk_level?: string;
  intervention_type: string;
  title: string;
  notes?: string;
  action_taken?: string;
  assigned_trainer_name?: string;
  follow_up_date?: string;
  prediction_id?: number;
  requester_role?: string;
}) {
  try {
    const res = await apiFetch(`${API_BASE}/risk/interventions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function updateInterventionApi(
  interventionId: number,
  data: {
    status?: string;
    action_taken?: string;
    outcome_notes?: string;
    follow_up_date?: string;
    requester_role?: string;
  }
) {
  try {
    const res = await apiFetch(`${API_BASE}/risk/interventions/${interventionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function submitPredictionFeedbackApi(data: {
  prediction_id: number;
  user_id: number;
  reviewer_name: string;
  reviewer_role?: string;
  actual_risk_status: string;
  comments?: string;
}) {
  try {
    const res = await apiFetch(`${API_BASE}/risk/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function fetchModelMetricsApi() {
  try {
    const res = await apiFetch(`${API_BASE}/risk/model/metrics`);
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function retrainRiskModelApi(modelType: string = 'RandomForestClassifier', requesterRole: string = 'admin') {
  try {
    const res = await apiFetch(`${API_BASE}/risk/model/retrain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_type: modelType, requester_role: requesterRole }),
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function addStudentAssessmentApi(data: {
  student_id: string;
  subject: string;
  assessment_type: string;
  score: number;
  max_score?: number;
  weight?: number;
  date?: string;
}) {
  try {
    const res = await apiFetch(`${API_BASE}/risk/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}



// LMS Course Enrollment & Progress APIs
export async function enrollCourseApi(courseId: number) {
  try {
    const res = await apiFetch(`${API_BASE}/courses/${courseId}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function fetchMyEnrollmentsApi() {
  try {
    const res = await apiFetch(`${API_BASE}/students/me/enrollments`);
    return await safeJson(res);
  } catch (err: any) {
    return [];
  }
}

export async function fetchCourseProgressApi(courseId: number) {
  try {
    const res = await apiFetch(`${API_BASE}/courses/${courseId}/progress`);
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function updateModuleProgressApi(
  courseId: number,
  moduleId: number,
  data: { is_completed: boolean; time_spent_minutes?: number; score?: number }
) {
  try {
    const res = await apiFetch(`${API_BASE}/courses/${courseId}/modules/${moduleId}/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function completeCourseApi(courseId: number) {
  try {
    const res = await apiFetch(`${API_BASE}/courses/${courseId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function fetchMyLearningProgressApi() {
  try {
    const res = await apiFetch(`${API_BASE}/students/me/learning-progress`);
    return await safeJson(res);
  } catch (err: any) {
    return null;
  }
}

export async function verifyCertificateApi(certId: string) {
  try {
    const res = await fetch(`${API_BASE}/certificates/verify/${encodeURIComponent(certId)}`);
    return await safeJson(res);
  } catch (err: any) {
    return { valid: false, status: 'Verification request failed' };
  }
}

export async function revokeCertificateApi(certId: string, reason?: string) {
  try {
    const res = await apiFetch(`${API_BASE}/certificates/${encodeURIComponent(certId)}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || 'Administrative revocation' }),
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
