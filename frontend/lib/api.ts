// Typed Unified API Client connecting the UI to the real Backend REST APIs

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export const api = {
  // Auth
  async login(email: string, password?: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`);
    return res.json();
  },

  // Conversations
  async getConversations(status?: string, q?: string) {
    const params = new URLSearchParams();
    if (status && status !== "all") params.append("status", status);
    if (q) params.append("q", q);
    const res = await fetch(`${API_BASE}/conversations?${params.toString()}`);
    return res.json();
  },

  async sendMessage(conversationId: string, content: string, sender: string = "customer") {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, sender })
    });
    return res.json();
  },

  async handoffConversation(conversationId: string) {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/handoff`, {
      method: "POST"
    });
    return res.json();
  },

  async resolveConversation(conversationId: string) {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/resolve`, {
      method: "POST"
    });
    return res.json();
  },

  // Leads
  async getLeads(status?: string, q?: string) {
    const params = new URLSearchParams();
    if (status && status !== "All") params.append("status", status);
    if (q) params.append("q", q);
    const res = await fetch(`${API_BASE}/leads?${params.toString()}`);
    return res.json();
  },

  async createLead(leadData: any) {
    const res = await fetch(`${API_BASE}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData)
    });
    return res.json();
  },

  async updateLead(id: string, updates: any) {
    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  // Appointments
  async getAppointments() {
    const res = await fetch(`${API_BASE}/appointments`);
    return res.json();
  },

  async getAvailability(date?: string) {
    const params = date ? `?date=${encodeURIComponent(date)}` : "";
    const res = await fetch(`${API_BASE}/appointments/availability${params}`);
    return res.json();
  },

  async createAppointment(appointmentData: any) {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(appointmentData)
    });
    return res.json();
  },

  // Knowledge Base & RAG
  async getKnowledgeDocs() {
    const res = await fetch(`${API_BASE}/knowledge/documents`);
    return res.json();
  },

  async uploadKnowledgeDoc(docData: { title: string; type: string; content?: string }) {
    const res = await fetch(`${API_BASE}/knowledge/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(docData)
    });
    return res.json();
  },

  async updateKnowledgeDoc(id: string, updates: { title?: string; type?: string; content?: string }) {
    const res = await fetch(`${API_BASE}/knowledge/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  async deleteKnowledgeDoc(id: string) {
    const res = await fetch(`${API_BASE}/knowledge/documents/${id}`, {
      method: "DELETE"
    });
    return res.json();
  },

  async queryKnowledge(query: string) {
    const res = await fetch(`${API_BASE}/knowledge/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    return res.json();
  },

  // Integrations
  async getIntegrations() {
    const res = await fetch(`${API_BASE}/integrations`);
    return res.json();
  },

  async toggleIntegration(provider: string, credentials?: any) {
    const res = await fetch(`${API_BASE}/integrations/${provider}/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials || {})
    });
    return res.json();
  },

  async testIntegration(provider: string, credentials?: any) {
    const res = await fetch(`${API_BASE}/integrations/${provider}/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testOnly: true, ...(credentials || {}) })
    });
    return res.json();
  },

  // Analytics
  async getAnalytics() {
    const res = await fetch(`${API_BASE}/analytics/overview`);
    return res.json();
  }
};
