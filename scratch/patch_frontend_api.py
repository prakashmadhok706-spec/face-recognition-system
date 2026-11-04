import re

api_path = r'CoopSyncAI\frontend\src\api.ts'
with open(api_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add token management functions at top
auth_helper = """// Secure Token Management
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
"""

if "getAccessToken" not in code:
    code = code.replace(
        "const API_BASE = 'http://127.0.0.1:8000/api';",
        "const API_BASE = 'http://127.0.0.1:8000/api';\n\n" + auth_helper
    )

# 2. Update loginUserApi to store tokens
old_login = """export async function loginUserApi(emailOrId: string, password: string = 'admin123') {
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
}"""

new_login = """export async function loginUserApi(emailOrId: string, password: string = 'admin123') {
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
    if (data.access_token) {
      setAuthTokens(data.access_token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function logoutUserApi() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    });
  } catch {}
  clearAuthTokens();
}"""

code = code.replace(old_login, new_login)

# 3. Add getAuthHeaders to key API functions
# fetchStudents
code = code.replace(
    "const res = await fetch(`${API_BASE}/students`);",
    "const res = await fetch(`${API_BASE}/students`, { headers: getAuthHeaders() });"
)

# fetchAdmins
code = code.replace(
    "const res = await fetch(`${API_BASE}/admins`);",
    "const res = await fetch(`${API_BASE}/admins`, { headers: getAuthHeaders() });"
)

# addStudentApi
code = code.replace(
    "headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify(studentData),",
    "headers: getAuthHeaders({ 'Content-Type': 'application/json' }),\n    body: JSON.stringify(studentData),"
)

# updateStudentApi
code = code.replace(
    "method: 'PUT',\n    headers: { 'Content-Type': 'application/json' },",
    "method: 'PUT',\n    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),"
)

# deleteStudentApi
code = code.replace(
    "method: 'DELETE',\n    });",
    "method: 'DELETE',\n      headers: getAuthHeaders(),\n    });"
)

# triggerRetrainModelApi
code = code.replace(
    "method: 'POST',\n      headers: { 'Content-Type': 'application/json' },",
    "method: 'POST',\n      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),"
)

# fetchRetrainStatusApi
code = code.replace(
    "const res = await fetch(`${API_BASE}/train/status`);",
    "const res = await fetch(`${API_BASE}/train/status`, { headers: getAuthHeaders() });"
)

# clearAttendanceLogsApi
code = code.replace(
    "method: 'POST',\n  });",
    "method: 'POST',\n    headers: getAuthHeaders(),\n  });"
)

# fetchAttendanceLogsApi
code = code.replace(
    "const res = await fetch(`${API_BASE}/attendance/logs`);",
    "const res = await fetch(`${API_BASE}/attendance/logs`, { headers: getAuthHeaders() });"
)

# Early Warning API calls: attach getAuthHeaders
code = re.sub(
    r'(export async function fetchRiskOverview\(\) \{[\s\S]*?fetch\(`\$\{API_BASE\}/risk/overview`)',
    r'\1`, { headers: getAuthHeaders() }',
    code
)

code = re.sub(
    r'(export async function fetchRiskStudents\([^\)]*\) \{[\s\S]*?fetch\(`\$\{API_BASE\}/risk/students\$\{qs\}`)(?!\s*,\s*\{)',
    r'\1, { headers: getAuthHeaders() }',
    code
)

code = re.sub(
    r'(export async function fetchStudentRiskProfile\([^\)]*\) \{[\s\S]*?fetch\(`\$\{API_BASE\}/risk/student/\$\{studentId\}`)(?!\s*,\s*\{)',
    r'\1, { headers: getAuthHeaders() }',
    code
)

code = re.sub(
    r'(export async function fetchInterventions\([^\)]*\) \{[\s\S]*?fetch\(`\$\{API_BASE\}/risk/interventions\$\{qs\}`)(?!\s*,\s*\{)',
    r'\1, { headers: getAuthHeaders() }',
    code
)

# Post endpoints headers
code = code.replace(
    "headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify(record),",
    "headers: getAuthHeaders({ 'Content-Type': 'application/json' }),\n      body: JSON.stringify(record),"
)

with open(api_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Patched api.ts successfully!")

