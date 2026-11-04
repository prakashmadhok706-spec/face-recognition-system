
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

