import { UserProfile, ActivationCodeItem, LabStats, AuditLogItem, SavedCircuitItem, Experiment } from '../types';

const TOKEN_KEY = 'yemen_mechatronics_auth_token';

export interface ApiNotification {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  timestamp: number;
}

type NotificationListener = (notification: ApiNotification) => void;

class ApiClient {
  private listeners: Set<NotificationListener> = new Set();
  private lastErrorNotificationTime = 0;
  private lastErrorMessage = '';

  /**
   * Subscribe to global API notifications (errors, server unreachable, timeouts)
   */
  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners with deduplication for rapid identical errors (e.g. repeated polling)
   */
  public notify(notification: Omit<ApiNotification, 'id' | 'timestamp'>) {
    const now = Date.now();
    // Throttle identical error messages within 3 seconds to prevent UI flooding
    if (
      notification.message === this.lastErrorMessage &&
      now - this.lastErrorNotificationTime < 3000
    ) {
      return;
    }

    this.lastErrorMessage = notification.message;
    this.lastErrorNotificationTime = now;

    const fullNotification: ApiNotification = {
      id: `${now}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: now,
      ...notification,
    };

    this.listeners.forEach((listener) => {
      try {
        listener(fullNotification);
      } catch (err) {
        console.error('Error in API notification listener:', err);
      }
    });
  }

  public getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public setToken(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.warn('Failed to store auth token in localStorage:', e);
    }
  }

  public clearToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.warn('Failed to clear auth token from localStorage:', e);
    }
  }

  /**
   * Robust HTTP request wrapper featuring:
   * 1. Configurable request timeout (AbortController)
   * 2. Automatic retry for transient network drops / timeouts (with exponential backoff)
   * 3. Graceful fallback on empty / non-JSON responses
   * 4. Comprehensive console logging of failures and retries
   * 5. User-friendly notification dispatch
   */
  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
    config: {
      timeoutMs?: number;
      maxRetries?: number;
      retryDelayMs?: number;
      silentNotification?: boolean;
    } = {}
  ): Promise<T> {
    const {
      timeoutMs = 9000,
      maxRetries = 2,
      retryDelayMs = 800,
      silentNotification = false,
    } = config;

    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= maxRetries) {
      attempt++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeoutMs);

      let response: Response;
      try {
        response = await fetch(endpoint, {
          ...options,
          headers,
          signal: controller.signal,
        });
      } catch (err: any) {
        clearTimeout(timeoutId);
        const isAbort = err.name === 'AbortError' || controller.signal.aborted;
        const isNetworkFail = isAbort || err instanceof TypeError || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError');
        lastError = err;

        // Retry network failures and timeouts if attempts remain
        if (isNetworkFail && attempt <= maxRetries) {
          const delay = retryDelayMs * Math.pow(1.5, attempt - 1);
          console.warn(`[API Retry] Network issue on ${endpoint}. Retrying (${attempt}/${maxRetries}) in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        // Exhausted retries for network drops
        let friendlyMessage = err.message;
        if (isAbort) {
          friendlyMessage = 'انتهت مهلة انتظار الخادم. يرجى التحقق من الاتصال بالإنترنت.';
        } else if (isNetworkFail) {
          friendlyMessage = 'تعذر الاتصال بالخادم. يرجى التأكد من تشغيل الخادم وتوفر الإنترنت.';
        }

        console.error(`[API Network Error] ${endpoint}:`, {
          error: friendlyMessage,
          isTimeout: isAbort,
          isNetworkFail,
        });

        if (!silentNotification) {
          this.notify({
            type: 'error',
            message: friendlyMessage,
            details: isAbort ? 'انتهت مهلة الطلب (Timeout)' : 'خطأ اتصال بالشبكة (Network unreachable)',
          });
        }

        throw new Error(friendlyMessage);
      }

      clearTimeout(timeoutId);

      // Safely parse JSON response or handle empty body
      let data: any = null;
      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();

      if (text && text.trim().length > 0) {
        if (contentType.includes('application/json')) {
          try {
            data = JSON.parse(text);
          } catch (parseErr) {
            console.warn(`[API] JSON parse warning on ${endpoint}:`, parseErr);
            data = { raw: text };
          }
        } else {
          // HTML or plaintext (e.g., 404/502 Vercel error page)
          try {
            data = JSON.parse(text);
          } catch {
            data = { message: text.length > 200 ? `${text.slice(0, 200)}...` : text };
          }
        }
      } else {
        // Empty response body
        data = {};
      }

      if (!response.ok) {
        const status = response.status;
        let errorMessage = data?.error || data?.message;

        if (!errorMessage) {
          if (status === 401) {
            errorMessage = 'بيانات الاعتماد غير صحيحة أو انتهت الجلسة.';
          } else if (status === 403) {
            errorMessage = 'غير مصرح لك بالوصول إلى هذا المحتوى.';
          } else if (status === 404) {
            errorMessage = 'الخدمة المطلوبة غير متوفرة على الخادم.';
          } else if (status >= 500) {
            errorMessage = 'تعذر الاتصال بالخادم الداخلي أو حدث خطأ مؤقت.';
          } else {
            errorMessage = `فشل الطلب مع رمز الحالة (${status}).`;
          }
        }

        // Check if this error is retryable (502, 503, 504 server gateway drops)
        const isServerUnavailable = status === 502 || status === 503 || status === 504;
        if (isServerUnavailable && attempt <= maxRetries) {
          const delay = retryDelayMs * Math.pow(1.5, attempt - 1);
          console.warn(`[API Retry] Server returned ${status}. Retrying (${attempt}/${maxRetries}) in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        // Log appropriately: warn for 4xx client errors, error for 5xx server crashes
        if (status >= 500) {
          console.error(`[API Server Error] HTTP ${status} on ${endpoint}:`, { endpoint, status, data });
          if (!silentNotification) {
            this.notify({
              type: 'error',
              message: errorMessage,
              details: `HTTP ${status} - ${endpoint}`,
            });
          }
        } else {
          console.warn(`[API HTTP ${status}] ${endpoint}:`, errorMessage);
        }

        throw new Error(errorMessage);
      }

      // Successful response
      return data as T;
    }

    throw lastError || new Error('حدث خطأ غير متوقع في الاتصال بالخادم.');
  }

  // Auth
  async register(body: {
    fullName: string;
    phone: string;
    university: string;
    studyLevel: string;
    password: string;
  }): Promise<{ message: string; user: UserProfile; token: string }> {
    const res = await this.request<{ message: string; user: UserProfile; token: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      { maxRetries: 0, silentNotification: true }
    );
    this.setToken(res.token);
    return res;
  }

  async login(body: { phone: string; password: string }): Promise<{ message: string; user: UserProfile; token: string }> {
    const res = await this.request<{ message: string; user: UserProfile; token: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      { maxRetries: 0, silentNotification: true }
    );
    this.setToken(res.token);
    return res;
  }

  async ownerLogin(body: { phone: string; password: string }): Promise<{ message: string; user: UserProfile; token: string }> {
    const res = await this.request<{ message: string; user: UserProfile; token: string }>(
      '/api/auth/owner-login',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      { maxRetries: 0, silentNotification: true }
    );
    this.setToken(res.token);
    return res;
  }

  async getMe(): Promise<{ user: UserProfile }> {
    // getMe can be silent so failed initial session check does not show an alert if not logged in
    return this.request<{ user: UserProfile }>('/api/auth/me', {}, { silentNotification: true });
  }

  async redeemCode(code: string): Promise<{ message: string; user: UserProfile }> {
    return this.request<{ message: string; user: UserProfile }>('/api/auth/redeem-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  // Owner - Students
  async getStudents(params: { search?: string; university?: string; studyLevel?: string; status?: string } = {}): Promise<{ students: UserProfile[] }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.university) query.set('university', params.university);
    if (params.studyLevel) query.set('studyLevel', params.studyLevel);
    if (params.status) query.set('status', params.status);
    return this.request<{ students: UserProfile[] }>(`/api/students?${query.toString()}`);
  }

  async updateStudentStatus(id: string, status: 'active' | 'suspended' | 'pending'): Promise<{ message: string; student: UserProfile }> {
    return this.request<{ message: string; student: UserProfile }>(`/api/students/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateStudentSubscription(id: string, body: { durationDays: number; planName?: string; status?: string }): Promise<{ message: string; student: UserProfile }> {
    return this.request<{ message: string; student: UserProfile }>(`/api/students/${id}/subscription`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async deleteStudent(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/students/${id}`, {
      method: 'DELETE',
    });
  }

  // Owner - Activation Codes
  async getActivationCodes(): Promise<{ codes: ActivationCodeItem[] }> {
    return this.request<{ codes: ActivationCodeItem[] }>('/api/activation-codes');
  }

  async generateActivationCodes(body: { prefix: string; durationDays: number; planName: string; count: number }): Promise<{ message: string; codes: ActivationCodeItem[] }> {
    return this.request<{ message: string; codes: ActivationCodeItem[] }>('/api/activation-codes', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async revokeActivationCode(id: string): Promise<{ message: string; code: ActivationCodeItem }> {
    return this.request<{ message: string; code: ActivationCodeItem }>(`/api/activation-codes/${id}/revoke`, {
      method: 'PATCH',
    });
  }

  // Experiments
  async getExperiments(): Promise<{ experiments: Experiment[] }> {
    return this.request<{ experiments: Experiment[] }>('/api/experiments');
  }

  async saveExperiment(exp: Partial<Experiment>): Promise<{ message: string; experiment: Experiment }> {
    if (exp.id && !exp.id.startsWith('new')) {
      return this.request<{ message: string; experiment: Experiment }>(`/api/experiments/${exp.id}`, {
        method: 'PUT',
        body: JSON.stringify(exp),
      });
    } else {
      return this.request<{ message: string; experiment: Experiment }>('/api/experiments', {
        method: 'POST',
        body: JSON.stringify(exp),
      });
    }
  }

  async deleteExperiment(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/experiments/${id}`, {
      method: 'DELETE',
    });
  }

  async submitQuiz(expId: string, answers: Record<string, number>): Promise<{
    message: string;
    score: number;
    total: number;
    percentage: number;
    passed: boolean;
    details: Array<{
      questionId: string;
      questionText: string;
      options: string[];
      selectedIndex?: number;
      correctIndex: number;
      isCorrect: boolean;
      explanation: string;
    }>;
  }> {
    return this.request(`/api/experiments/${expId}/quiz`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  // Saved Circuits
  async saveCircuit(body: { id?: string; title: string; description?: string; elements: any[]; wires: any[] }): Promise<{ message: string; circuit: SavedCircuitItem }> {
    return this.request<{ message: string; circuit: SavedCircuitItem }>('/api/circuits/save', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getMyCircuits(): Promise<{ circuits: SavedCircuitItem[] }> {
    return this.request<{ circuits: SavedCircuitItem[] }>('/api/circuits/my');
  }

  async deleteCircuit(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/circuits/${id}`, {
      method: 'DELETE',
    });
  }

  // Stats & Settings
  async getStats(): Promise<{ stats: LabStats; auditLogs: AuditLogItem[] }> {
    return this.request<{ stats: LabStats; auditLogs: AuditLogItem[] }>('/api/stats');
  }

  async getSettings(): Promise<{ settings: any }> {
    return this.request<{ settings: any }>('/api/settings');
  }

  async updateSettings(settings: any): Promise<{ message: string; settings: any }> {
    return this.request<{ message: string; settings: any }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async logSimulationRun(): Promise<{ success: boolean; count: number }> {
    return this.request<{ success: boolean; count: number }>('/api/simulation/run-event', {
      method: 'POST',
    }, { silentNotification: true });
  }
}

export const api = new ApiClient();
