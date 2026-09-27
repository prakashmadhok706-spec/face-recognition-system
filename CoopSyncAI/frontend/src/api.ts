const API_BASE = 'http://127.0.0.1:8000/api';

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  } catch (e) {
    return { status: 'offline', error: String(e) };
  }
}

export async function fetchStudents() {
  try {
    const res = await fetch(`${API_BASE}/students`);
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch (e) {
    return [];
  }
}

export async function recognizeFaceImage(base64Image: string) {
  const res = await fetch(`${API_BASE}/attendance/face-recognize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_base64: base64Image }),
  });
  return await res.json();
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

export async function verifyQRAttendance(qrText: string, studentId: string) {
  const res = await fetch(`${API_BASE}/attendance/qr/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qr_text: qrText, student_id: studentId }),
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

export async function fetchCertificates() {
  const res = await fetch(`${API_BASE}/certificates`);
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
  const res = await fetch(`${API_BASE}/students/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData),
  });
  return await res.json();
}

export async function captureSampleApi(sampleData: any) {
  const res = await fetch(`${API_BASE}/students/capture-sample`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sampleData),
  });
  return await res.json();
}

export async function trainModelApi() {
  const res = await fetch(`${API_BASE}/train-model`, {
    method: 'POST',
  });
  return await res.json();
}

export async function clearAttendanceLogsApi() {
  const res = await fetch(`${API_BASE}/attendance/clear-logs`, {
    method: 'POST',
  });
  return await res.json();
}

