// Typed Unified API Client connecting the UI to the real Backend REST APIs

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

function getHeaders(customHeaders: Record<string, string> = {}): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const orgId = localStorage.getItem("organization_id");
    if (orgId) {
      headers["X-Organization-Id"] = orgId;
    }
  }

  return headers;
}

export const api = {
  // Auth
  async login(email: string, password?: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  async register(data: { name: string; email: string; password: string; organization_name?: string }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async logout() {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: getHeaders()
    });
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
    }
    return res.json();
  },

  // Conversations
  async getConversations(status?: string, q?: string) {
    const params = new URLSearchParams();
    if (status && status !== "all") params.append("status", status);
    if (q) params.append("q", q);
    const res = await fetch(`${API_BASE}/conversations?${params.toString()}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async createConversation(data: { customer_id: string; channel?: string; assigned_agent?: string }) {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getConversation(id: string) {
    const res = await fetch(`${API_BASE}/conversations/${id}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async getMessages(conversationId: string) {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async sendMessage(conversationId: string, content: string, sender: string = "customer") {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ content, sender })
    });
    return res.json();
  },

  async handoffConversation(conversationId: string) {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/handoff`, {
      method: "POST",
      headers: getHeaders()
    });
    return res.json();
  },

  async resolveConversation(conversationId: string) {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/resolve`, {
      method: "POST",
      headers: getHeaders()
    });
    return res.json();
  },

  // Leads
  async getLeads(status?: string, q?: string) {
    const params = new URLSearchParams();
    if (status && status !== "All") params.append("status", status);
    if (q) params.append("q", q);
    const res = await fetch(`${API_BASE}/leads?${params.toString()}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async createLead(leadData: any) {
    const res = await fetch(`${API_BASE}/leads`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(leadData)
    });
    return res.json();
  },

  async updateLead(id: string, updates: any) {
    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  // Appointments
  async getAppointments() {
    const res = await fetch(`${API_BASE}/appointments`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async getAvailability(date?: string) {
    const params = date ? `?date=${encodeURIComponent(date)}` : "";
    const res = await fetch(`${API_BASE}/appointments/availability${params}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async createAppointment(appointmentData: any) {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(appointmentData)
    });
    return res.json();
  },

  async updateAppointment(id: string, updates: any) {
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  async cancelAppointment(id: string) {
    const res = await fetch(`${API_BASE}/appointments/${id}/cancel`, {
      method: "POST",
      headers: getHeaders()
    });
    return res.json();
  },

  // Knowledge Base & RAG
  async getKnowledgeDocs() {
    const res = await fetch(`${API_BASE}/knowledge/documents`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async uploadKnowledgeDoc(docData: { title: string; type: string; content?: string }) {
    const res = await fetch(`${API_BASE}/knowledge/documents`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(docData)
    });
    return res.json();
  },

  async updateKnowledgeDoc(id: string, updates: { title?: string; type?: string; content?: string; status?: string }) {
    const res = await fetch(`${API_BASE}/knowledge/documents/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  async deleteKnowledgeDoc(id: string) {
    const res = await fetch(`${API_BASE}/knowledge/documents/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    return res.json();
  },

  async reindexKnowledgeDoc(id: string) {
    const res = await fetch(`${API_BASE}/knowledge/documents/${id}/reindex`, {
      method: "POST",
      headers: getHeaders()
    });
    return res.json();
  },

  async queryKnowledge(query: string) {
    const res = await fetch(`${API_BASE}/knowledge/query`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ query })
    });
    return res.json();
  },

  // Integrations
  async getIntegrations() {
    const res = await fetch(`${API_BASE}/integrations`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async toggleIntegration(provider: string, credentials?: any) {
    const res = await fetch(`${API_BASE}/integrations/${provider}/connect`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(credentials || {})
    });
    return res.json();
  },

  async testIntegration(provider: string, credentials?: any) {
    const res = await fetch(`${API_BASE}/integrations/${provider}/connect`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ testOnly: true, ...(credentials || {}) })
    });
    return res.json();
  },

  async getIntegrationStatus(id: string) {
    const res = await fetch(`${API_BASE}/integrations/${id}/status`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Analytics
  async getAnalytics() {
    const res = await fetch(`${API_BASE}/analytics/overview`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async getAnalyticsConversations() {
    const res = await fetch(`${API_BASE}/analytics/conversations`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async getAnalyticsLeads() {
    const res = await fetch(`${API_BASE}/analytics/leads`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async getAnalyticsAppointments() {
    const res = await fetch(`${API_BASE}/analytics/appointments`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async getUsage() {
    const res = await fetch(`${API_BASE}/usage`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Unified AI Assistant & Agents Chat
  async chatAI(payload: {
    message: string;
    agentType?: 'support' | 'sales' | 'appointment' | 'copilot' | 'assistant';
    conversationId?: string;
    customerId?: string;
    customerName?: string;
    history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  }) {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  }
};
