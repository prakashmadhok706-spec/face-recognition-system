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
    const res = await fetch(`${API_BASE}/students`);
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
    const res = await fetch(`${API_BASE}/admins`);
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
    const res = await fetch(`${API_BASE}/attendance/face-recognize`, {
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
  const res = await fetch(`${API_BASE}/attendance/launch-opencv-camera`, {
    method: 'POST',
  });
  return await res.json();
}

export async function generateQRAttendance() {
  const res = await fetch(`${API_BASE}/attendance/qr/generate`, {
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
  const res = await fetch(`${API_BASE}/attendance/qr/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

export async function fetchInstitutionConfig() {
  const res = await fetch(`${API_BASE}/institution/config`);
  return await res.json();
}

export async function updateInstitutionConfig(configData: any, requesterRole: string = 'admin') {
  const res = await fetch(`${API_BASE}/institution/config`, {
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
  const res = await fetch(`${API_BASE}/attendance/sync-offline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records }),
  });
  return await res.json();
}

export async function updateAttendanceApi(attId: number, data: { status?: string; method?: string; time?: string; date?: string }) {
  try {
    const res = await fetch(`${API_BASE}/attendance/${attId}`, {
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
    const res = await fetch(`${API_BASE}/attendance/manual`, {
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
    const res = await fetch(`${API_BASE}/attendance/${attId}`, {
      method: 'DELETE',
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}

export async function fetchCourses() {
  const res = await fetch(`${API_BASE}/courses`);
  return await res.json();
}

export async function createCourse(courseData: any) {
  const res = await fetch(`${API_BASE}/courses`, {
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
  const res = await fetch(`${API_BASE}/certificates/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_name: studentName, course_title: courseTitle }),
  });
  return await res.json();
}

export async function fetchJobs(userId: number = 1) {
  const res = await fetch(`${API_BASE}/jobs?user_id=${userId}`);
  return await res.json();
}

export async function applyJob(jobId: number, userId: number, note?: string) {
  const res = await fetch(`${API_BASE}/jobs/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: jobId, user_id: userId, note }),
  });
  return await res.json();
}

export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE}/analytics`);
  return await res.json();
}

export async function sendAIChat(query: string, userId: number = 1) {
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, user_id: userId }),
  });
  return await res.json();
}

export async function addStudentApi(studentData: any) {
  try {
    const res = await fetch(`${API_BASE}/students/add`, {
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
    const res = await fetch(`${API_BASE}/students/capture-sample`, {
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
    const res = await fetch(`${API_BASE}/students/${encodeURIComponent(studentId)}/reset-samples`, {
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
    const res = await fetch(`${API_BASE}/students/${encodeURIComponent(studentId)}/samples-count`);
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, samples_count: 0, error: err.message };
  }
}

export async function triggerRetrainModelApi(requesterRole: string = 'admin') {
  try {
    const res = await fetch(`${API_BASE}/train`, {
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
    const res = await fetch(`${API_BASE}/train/status`);
    return await safeJson(res);
  } catch (err: any) {
    return { status: 'failed', progress: 0, message: `Polling error: ${err.message}` };
  }
}

export async function trainModelApi(requesterRole: string = 'admin') {
  return await triggerRetrainModelApi(requesterRole);
}

export async function updateStudentApi(studentId: string, studentData: any) {
  const res = await fetch(`${API_BASE}/students/${studentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData),
  });
  return await res.json();
}


export async function deleteStudentApi(studentId: string) {
  try {
    const res = await fetch(`${API_BASE}/students/${studentId}`, {
      method: 'DELETE',
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}

export async function clearAttendanceLogsApi() {
  const res = await fetch(`${API_BASE}/attendance/clear`, {
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
    return await safeJson(res);
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
