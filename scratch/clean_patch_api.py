import re

api_path = r'CoopSyncAI\frontend\src\api.ts'
with open(api_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define Auth Token helper functions
helpers = """// Secure Token Management (Task 7: Centralized Frontend Auth Integration)
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
"""

# Insert helpers after safeJson
target = "async function safeJson(res: Response) {\n  const text = await res.text();\n  if (!text || text.trim() === '') return { success: false, message: 'Empty response from server' };\n  try {\n    return JSON.parse(text);\n  } catch {\n    return { success: false, message: `Server error: ${text.substring(0, 200)}` };\n  }\n}"
idx = content.find(target)
if idx != -1:
    end_of_safejson = idx + len(target)
    content = content[:end_of_safejson] + "\n\n" + helpers + "\n" + content[end_of_safejson:]

# Update loginUserApi to save tokens on success
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
}"""

content = content.replace(old_login, new_login)

# Replace standard fetch with apiFetch in all API functions except inside apiFetch, health, and auth endpoints
# Let's replace 'await fetch(`${API_BASE}/' with 'await apiFetch(`${API_BASE}/'
# But keep /health and /auth/login as direct fetch
content = content.replace("await fetch(`${API_BASE}/students", "await apiFetch(`${API_BASE}/students")
content = content.replace("await fetch(`${API_BASE}/admins", "await apiFetch(`${API_BASE}/admins")
content = content.replace("await fetch(`${API_BASE}/attendance", "await apiFetch(`${API_BASE}/attendance")
content = content.replace("await fetch(`${API_BASE}/courses", "await apiFetch(`${API_BASE}/courses")
content = content.replace("await fetch(`${API_BASE}/certificates", "await apiFetch(`${API_BASE}/certificates")
content = content.replace("await fetch(`${API_BASE}/jobs", "await apiFetch(`${API_BASE}/jobs")
content = content.replace("await fetch(`${API_BASE}/analytics", "await apiFetch(`${API_BASE}/analytics")
content = content.replace("await fetch(`${API_BASE}/ai", "await apiFetch(`${API_BASE}/ai")
content = content.replace("await fetch(`${API_BASE}/train", "await apiFetch(`${API_BASE}/train")
content = content.replace("await fetch(`${API_BASE}/risk", "await apiFetch(`${API_BASE}/risk")
content = content.replace("await fetch(`${API_BASE}/institution", "await apiFetch(`${API_BASE}/institution")

with open(api_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated api.ts successfully!")
