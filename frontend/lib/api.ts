// Typed Unified API Client connecting the UI to the real Backend REST APIs

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function getHeaders(customHeaders: Record<string, string> = {}): HeadersInit {
  const headers: Record<string, string> = {
    "Accept": "application/json",
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

/**
 * Safe fetch wrapper that handles:
 * - JSON responses
 * - Non-JSON / HTML redirects gracefully without throwing SyntaxError
 * - 401 Unauthorized session expiration
 * - 403, 404, 422 validation errors, and 500 server errors
 * - Network failures
 */
async function safeRequest<T = any>(url: string, init: RequestInit = {}): Promise<any> {
  try {
    const customHeaders = (init.headers as Record<string, string>) || {};
    const headers = getHeaders(customHeaders);

    const res = await fetch(url, {
      ...init,
      headers,
    });

    const contentType = res.headers.get("content-type") || "";
    let data: any = null;

    if (contentType.includes("application/json")) {
      try {
        data = await res.json();
      } catch {
        data = { success: false, error: "Failed to parse JSON response." };
      }
    } else {
      const text = await res.text().catch(() => "");
      data = {
        success: res.ok,
        message: text.slice(0, 300) || res.statusText,
        error: !res.ok ? (res.statusText || `HTTP ${res.status}`) : undefined,
      };
    }

    if (res.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
      return {
        success: false,
        status: 401,
        message: data?.message || "Unauthenticated session.",
        error: "Unauthenticated",
      };
    }

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        message: data?.message || `Request failed with HTTP ${res.status}`,
        error: data?.error || data?.message || `HTTP ${res.status}`,
        errors: data?.errors,
        ...data,
      };
    }

    return typeof data === "object" && data !== null ? data : { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      status: 0,
      message: err?.message || "Network communication failure.",
      error: err?.message || "NetworkError",
    };
  }
}

export const api = {
  // Organizations & Multi-tenancy
  async getOrganizations() {
    return safeRequest(`${API_BASE}/organizations`);
  },

  async createOrganization(name: string, slug?: string) {
    return safeRequest(`${API_BASE}/organizations`, {
      method: "POST",
      body: JSON.stringify({ name, slug })
    });
  },

  async updateOrganization(id: string, data: any) {
    return safeRequest(`${API_BASE}/organizations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  },

  async deleteOrganization(id: string) {
    return safeRequest(`${API_BASE}/organizations/${id}`, {
      method: "DELETE"
    });
  },

  // Auth
  async login(email: string, password?: string) {
    return safeRequest(`${API_BASE}/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },

  async register(data: { name: string; email: string; password: string; organization_name?: string }) {
    return safeRequest(`${API_BASE}/auth/register`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async getMe() {
    return safeRequest(`${API_BASE}/auth/me`);
  },

  async logout() {
    const res = await safeRequest(`${API_BASE}/auth/logout`, {
      method: "POST"
    });
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
    }
    return res;
  },

  // Conversations
  async getConversations(status?: string, q?: string) {
    const params = new URLSearchParams();
    if (status && status !== "all") params.append("status", status);
    if (q) params.append("q", q);
    return safeRequest(`${API_BASE}/conversations?${params.toString()}`);
  },

  async createConversation(data: { customer_id: string; channel?: string; assigned_agent?: string }) {
    return safeRequest(`${API_BASE}/conversations`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async getConversation(id: string) {
    return safeRequest(`${API_BASE}/conversations/${id}`);
  },

  async getMessages(conversationId: string) {
    return safeRequest(`${API_BASE}/conversations/${conversationId}/messages`);
  },

  async sendMessage(conversationId: string, content: string, sender: string = "customer") {
    return safeRequest(`${API_BASE}/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content, sender })
    });
  },

  async handoffConversation(conversationId: string) {
    return safeRequest(`${API_BASE}/conversations/${conversationId}/handoff`, {
      method: "POST"
    });
  },

  async resolveConversation(conversationId: string) {
    return safeRequest(`${API_BASE}/conversations/${conversationId}/resolve`, {
      method: "POST"
    });
  },

  async deleteConversation(conversationId: string) {
    return safeRequest(`${API_BASE}/conversations/${conversationId}`, {
      method: "DELETE"
    });
  },

  // Leads
  async getLeads(status?: string, q?: string) {
    const params = new URLSearchParams();
    if (status && status !== "All") params.append("status", status);
    if (q) params.append("q", q);
    return safeRequest(`${API_BASE}/leads?${params.toString()}`);
  },

  async createLead(leadData: any) {
    return safeRequest(`${API_BASE}/leads`, {
      method: "POST",
      body: JSON.stringify(leadData)
    });
  },

  async updateLead(id: string, updates: any) {
    return safeRequest(`${API_BASE}/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates)
    });
  },

  async deleteLead(id: string) {
    return safeRequest(`${API_BASE}/leads/${id}`, {
      method: "DELETE"
    });
  },

  // Appointments
  async getAppointments() {
    return safeRequest(`${API_BASE}/appointments`);
  },

  async getAvailability(date?: string) {
    const params = date ? `?date=${encodeURIComponent(date)}` : "";
    return safeRequest(`${API_BASE}/appointments/availability${params}`);
  },

  async createAppointment(appointmentData: any) {
    return safeRequest(`${API_BASE}/appointments`, {
      method: "POST",
      body: JSON.stringify(appointmentData)
    });
  },

  async updateAppointment(id: string, updates: any) {
    return safeRequest(`${API_BASE}/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates)
    });
  },

  async cancelAppointment(id: string) {
    return safeRequest(`${API_BASE}/appointments/${id}/cancel`, {
      method: "POST"
    });
  },

  // Knowledge Base & RAG
  async getKnowledgeDocs() {
    return safeRequest(`${API_BASE}/knowledge/documents`);
  },

  async uploadKnowledgeDoc(docData: { title: string; type: string; content?: string }) {
    return safeRequest(`${API_BASE}/knowledge/documents`, {
      method: "POST",
      body: JSON.stringify(docData)
    });
  },

  async updateKnowledgeDoc(id: string, updates: { title?: string; type?: string; content?: string; status?: string }) {
    return safeRequest(`${API_BASE}/knowledge/documents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates)
    });
  },

  async deleteKnowledgeDoc(id: string) {
    return safeRequest(`${API_BASE}/knowledge/documents/${id}`, {
      method: "DELETE"
    });
  },

  async reindexKnowledgeDoc(id: string) {
    return safeRequest(`${API_BASE}/knowledge/documents/${id}/reindex`, {
      method: "POST"
    });
  },

  async queryKnowledge(query: string) {
    return safeRequest(`${API_BASE}/knowledge/query`, {
      method: "POST",
      body: JSON.stringify({ query })
    });
  },

  async scrapeKnowledgeUrl(data: { url: string; title?: string; agent?: string }) {
    return safeRequest(`${API_BASE}/knowledge/scrape`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  // Integrations (Real Backend Endpoints)
  async getIntegrations() {
    return safeRequest(`${API_BASE}/integrations`);
  },

  async toggleIntegration(provider: string, credentials?: any) {
    return safeRequest(`${API_BASE}/integrations/${provider}/connect`, {
      method: "POST",
      body: JSON.stringify(credentials || {})
    });
  },

  async testIntegration(provider: string, credentials?: any) {
    return safeRequest(`${API_BASE}/integrations/${provider}/connect?testOnly=1`, {
      method: "POST",
      body: JSON.stringify(credentials || {})
    });
  },

  async disconnectIntegration(id: string) {
    return safeRequest(`${API_BASE}/integrations/${id}`, {
      method: "DELETE"
    });
  },

  async getIntegrationStatus(id: string) {
    return safeRequest(`${API_BASE}/integrations/${id}/status`);
  },

  // Analytics
  async getAnalytics() {
    return safeRequest(`${API_BASE}/analytics/overview`);
  },

  async getAnalyticsConversations() {
    return safeRequest(`${API_BASE}/analytics/conversations`);
  },

  async getAnalyticsLeads() {
    return safeRequest(`${API_BASE}/analytics/leads`);
  },

  async getAnalyticsAppointments() {
    return safeRequest(`${API_BASE}/analytics/appointments`);
  },

  async getUsage() {
    return safeRequest(`${API_BASE}/usage`);
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
    return safeRequest(`${API_BASE}/ai/chat`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  // --- GHL CONTACTS ---
  async getContacts(params?: any) {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.status) q.append("status", params.status);
    return safeRequest(`${API_BASE}/contacts?${q.toString()}`);
  },

  async getContact(id: string) {
    return safeRequest(`${API_BASE}/contacts/${id}`);
  },

  async createContact(data: any) {
    return safeRequest(`${API_BASE}/contacts`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async updateContact(id: string, data: any) {
    return safeRequest(`${API_BASE}/contacts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  },

  async deleteContact(id: string) {
    return safeRequest(`${API_BASE}/contacts/${id}`, {
      method: "DELETE"
    });
  },

  async importContacts(csvContent: string) {
    return safeRequest(`${API_BASE}/contacts/import`, {
      method: "POST",
      body: JSON.stringify({ csv_content: csvContent })
    });
  },

  async exportContacts() {
    return safeRequest(`${API_BASE}/contacts/export`);
  },

  // --- SMART LISTS ---
  async getSmartLists() {
    return safeRequest(`${API_BASE}/smart-lists`);
  },

  async createSmartList(data: any) {
    return safeRequest(`${API_BASE}/smart-lists`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async deleteSmartList(id: string) {
    return safeRequest(`${API_BASE}/smart-lists/${id}`, {
      method: "DELETE"
    });
  },

  // --- TEAM MANAGEMENT ---
  async getTeamMembers() {
    return safeRequest(`${API_BASE}/team/members`);
  },

  async inviteTeamMember(email: string, role: string) {
    return safeRequest(`${API_BASE}/team/invite`, {
      method: "POST",
      body: JSON.stringify({ email, role })
    });
  },

  // --- GHL PIPELINES ---
  async getPipelines() {
    return safeRequest(`${API_BASE}/pipelines`);
  },

  async createPipeline(data: any) {
    return safeRequest(`${API_BASE}/pipelines`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async updatePipeline(id: string, data: any) {
    return safeRequest(`${API_BASE}/pipelines/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  },

  // --- GHL OPPORTUNITIES ---
  async getOpportunities(pipelineId?: string, stageId?: string) {
    const params = new URLSearchParams();
    if (pipelineId) params.append("pipeline_id", pipelineId);
    if (stageId) params.append("stage_id", stageId);
    return safeRequest(`${API_BASE}/opportunities?${params.toString()}`);
  },

  async createOpportunity(data: any) {
    return safeRequest(`${API_BASE}/opportunities`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async updateOpportunity(id: string, data: any) {
    return safeRequest(`${API_BASE}/opportunities/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  },

  async deleteOpportunity(id: string) {
    return safeRequest(`${API_BASE}/opportunities/${id}`, {
      method: "DELETE"
    });
  },

  // --- GHL WORKFLOWS ---
  async getWorkflows(mode?: 'workflows' | 'executions', workflowId?: string) {
    const params = new URLSearchParams();
    if (mode) params.append("mode", mode);
    if (workflowId) params.append("workflow_id", workflowId);
    return safeRequest(`${API_BASE}/workflows?${params.toString()}`);
  },

  async createWorkflow(data: any) {
    return safeRequest(`${API_BASE}/workflows`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async updateWorkflow(id: string, data: any) {
    return safeRequest(`${API_BASE}/workflows/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  },

  async executeWorkflow(workflowId: string, payload?: any) {
    return safeRequest(`${API_BASE}/workflows/${workflowId}/execute`, {
      method: "POST",
      body: JSON.stringify(payload || {})
    });
  },

  async getWorkflowExecutions(workflowId: string) {
    return safeRequest(`${API_BASE}/workflows/${workflowId}/executions`);
  },

  // --- E-COMMERCE ORDERS ---
  async createOrder(data: any) {
    return safeRequest(`${API_BASE}/woocommerce/orders`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  // --- GHL TASKS ---
  async getTasks(status?: string) {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    return safeRequest(`${API_BASE}/tasks?${params.toString()}`);
  },

  async createTask(data: any) {
    return safeRequest(`${API_BASE}/tasks`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async updateTask(id: string, data: any) {
    return safeRequest(`${API_BASE}/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  },

  async deleteTask(id: string) {
    return safeRequest(`${API_BASE}/tasks/${id}`, {
      method: "DELETE"
    });
  },

  // --- GHL COMPANIES ---
  async getCompanies() {
    return safeRequest(`${API_BASE}/companies`);
  },

  async createCompany(data: any) {
    return safeRequest(`${API_BASE}/companies`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async updateCompany(id: string, data: any) {
    return safeRequest(`${API_BASE}/companies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  },

  async deleteCompany(id: string) {
    return safeRequest(`${API_BASE}/companies/${id}`, {
      method: "DELETE"
    });
  },

  // --- GHL CUSTOM FIELDS & TIMELINE ---
  async getCustomFields(entity?: string) {
    const params = new URLSearchParams();
    if (entity) params.append("entity", entity);
    return safeRequest(`${API_BASE}/custom-fields?${params.toString()}`);
  },

  async createCustomField(data: any) {
    return safeRequest(`${API_BASE}/custom-fields`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async getActivityTimeline(contactId?: string) {
    const params = new URLSearchParams();
    if (contactId) params.append("contact_id", contactId);
    return safeRequest(`${API_BASE}/timeline?${params.toString()}`);
  },

  async addTimelineEvent(data: any) {
    return safeRequest(`${API_BASE}/timeline`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  // --- GLOBAL SEARCH ---
  async globalSearch(query: string) {
    const params = new URLSearchParams();
    params.append("q", query);
    return safeRequest(`${API_BASE}/search?${params.toString()}`);
  }
};
