import { UserProfile, ActivationCodeItem, LabStats, AuditLogItem, SavedCircuitItem, Experiment } from '../types';

const TOKEN_KEY = 'yemen_mechatronics_auth_token';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'حدث خطأ في الاتصال بالخادم');
    }

    return data as T;
  },

  // Auth
  async register(body: {
    fullName: string;
    phone: string;
    university: string;
    studyLevel: string;
    password: string;
  }): Promise<{ message: string; user: UserProfile; token: string }> {
    const res = await this.request<{ message: string; user: UserProfile; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    this.setToken(res.token);
    return res;
  },

  async login(body: { phone: string; password: string }): Promise<{ message: string; user: UserProfile; token: string }> {
    const res = await this.request<{ message: string; user: UserProfile; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    this.setToken(res.token);
    return res;
  },

  async ownerLogin(body: { phone: string; password: string }): Promise<{ message: string; user: UserProfile; token: string }> {
    const res = await this.request<{ message: string; user: UserProfile; token: string }>('/api/auth/owner-login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    this.setToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: UserProfile }> {
    return this.request<{ user: UserProfile }>('/api/auth/me');
  },

  async redeemCode(code: string): Promise<{ message: string; user: UserProfile }> {
    return this.request<{ message: string; user: UserProfile }>('/api/auth/redeem-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  // Owner - Students
  async getStudents(params: { search?: string; university?: string; studyLevel?: string; status?: string } = {}): Promise<{ students: UserProfile[] }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.university) query.set('university', params.university);
    if (params.studyLevel) query.set('studyLevel', params.studyLevel);
    if (params.status) query.set('status', params.status);
    return this.request<{ students: UserProfile[] }>(`/api/students?${query.toString()}`);
  },

  async updateStudentStatus(id: string, status: 'active' | 'suspended' | 'pending'): Promise<{ message: string; student: UserProfile }> {
    return this.request<{ message: string; student: UserProfile }>(`/api/students/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async updateStudentSubscription(id: string, body: { durationDays: number; planName?: string; status?: string }): Promise<{ message: string; student: UserProfile }> {
    return this.request<{ message: string; student: UserProfile }>(`/api/students/${id}/subscription`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  async deleteStudent(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/students/${id}`, {
      method: 'DELETE',
    });
  },

  // Owner - Activation Codes
  async getActivationCodes(): Promise<{ codes: ActivationCodeItem[] }> {
    return this.request<{ codes: ActivationCodeItem[] }>('/api/activation-codes');
  },

  async generateActivationCodes(body: { prefix: string; durationDays: number; planName: string; count: number }): Promise<{ message: string; codes: ActivationCodeItem[] }> {
    return this.request<{ message: string; codes: ActivationCodeItem[] }>('/api/activation-codes', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async revokeActivationCode(id: string): Promise<{ message: string; code: ActivationCodeItem }> {
    return this.request<{ message: string; code: ActivationCodeItem }>(`/api/activation-codes/${id}/revoke`, {
      method: 'PATCH',
    });
  },

  // Experiments
  async getExperiments(): Promise<{ experiments: Experiment[] }> {
    return this.request<{ experiments: Experiment[] }>('/api/experiments');
  },

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
  },

  async deleteExperiment(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/experiments/${id}`, {
      method: 'DELETE',
    });
  },

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
  },

  // Saved Circuits
  async saveCircuit(body: { id?: string; title: string; description?: string; elements: any[]; wires: any[] }): Promise<{ message: string; circuit: SavedCircuitItem }> {
    return this.request<{ message: string; circuit: SavedCircuitItem }>('/api/circuits/save', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async getMyCircuits(): Promise<{ circuits: SavedCircuitItem[] }> {
    return this.request<{ circuits: SavedCircuitItem[] }>('/api/circuits/my');
  },

  async deleteCircuit(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/circuits/${id}`, {
      method: 'DELETE',
    });
  },

  // Stats & Settings
  async getStats(): Promise<{ stats: LabStats; auditLogs: AuditLogItem[] }> {
    return this.request<{ stats: LabStats; auditLogs: AuditLogItem[] }>('/api/stats');
  },

  async getSettings(): Promise<{ settings: any }> {
    return this.request<{ settings: any }>('/api/settings');
  },

  async updateSettings(settings: any): Promise<{ message: string; settings: any }> {
    return this.request<{ message: string; settings: any }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async logSimulationRun(): Promise<{ success: boolean; count: number }> {
    return this.request<{ success: boolean; count: number }>('/api/simulation/run-event', {
      method: 'POST',
    });
  },
};
