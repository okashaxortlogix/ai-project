// Persistent Multi-Tenant In-Memory / File Database Engine for AI Conversation & Sales Suite
// Implements strict tenant isolation (organization_id) across all 17 entities

import fs from "fs";
import path from "path";

export interface DBOrganization {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  settings: Record<string, any>;
  created_at: string;
}

export interface DBUser {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Agent' | 'Viewer';
  avatar: string;
  created_at: string;
}

export interface DBCustomer {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  avatar: string;
  online: boolean;
  created_at: string;
}

export interface DBMessage {
  id: string;
  organization_id: string;
  conversation_id: string;
  sender: 'customer' | 'agent' | 'human' | 'system';
  agent_type?: 'support' | 'sales' | 'appointment' | 'human';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DBConversation {
  id: string;
  organization_id: string;
  customer_id: string;
  channel: 'web' | 'whatsapp' | 'email';
  status: 'active' | 'pending' | 'resolved' | 'waiting_for_human';
  assigned_agent: 'support' | 'sales' | 'appointment' | 'human';
  last_message: string;
  last_message_at: string;
  created_at: string;
}

export interface DBLead {
  id: string;
  organization_id: string;
  customer_id: string;
  name: string;
  email: string;
  phone: string;
  source: 'Website' | 'Facebook' | 'Google Ads' | 'Referral' | 'Other';
  status: 'New' | 'Contacted' | 'Qualified' | 'Hot' | 'Won' | 'Lost';
  score: number;
  avatar: string;
  company?: string;
  notes?: string;
  created_at: string;
}

export interface DBAppointment {
  id: string;
  organization_id: string;
  customer_id: string;
  title: string;
  date: string;
  time: string;
  customer_name: string;
  avatar: string;
  service: string;
  provider: 'Google Calendar' | 'Outlook';
  status: 'Confirmed' | 'Pending' | 'Rescheduled' | 'Cancelled';
  created_at: string;
}

export interface DBKnowledgeDoc {
  id: string;
  organization_id: string;
  title: string;
  type: 'Policy' | 'Product' | 'FAQ' | 'Legal';
  last_updated: string;
  status: 'Active' | 'Processing' | 'Inactive';
  size: string;
  content: string;
}

export interface DBIntegration {
  id: string;
  organization_id: string;
  provider: string;
  name: string;
  category: 'calendar' | 'crm' | 'ecommerce' | 'messaging';
  connected: boolean;
  icon: string;
  status: 'active' | 'disconnected';
  last_synced_at?: string;
}

export interface DBSchema {
  organizations: DBOrganization[];
  users: DBUser[];
  customers: DBCustomer[];
  conversations: DBConversation[];
  messages: DBMessage[];
  leads: DBLead[];
  appointments: DBAppointment[];
  knowledge_documents: DBKnowledgeDoc[];
  integrations: DBIntegration[];
}

const DB_FILE_PATH = path.join(process.cwd(), "suite_database.json");

// Default initial state matching the business domain
function getInitialData(): DBSchema {
  const orgId = "org-acme-1";
  return {
    organizations: [
      {
        id: orgId,
        name: "Acme Store",
        slug: "acme-store",
        timezone: "UTC-05:00 (Eastern Time US & Canada)",
        settings: { support_enabled: true, sales_enabled: true, appointment_enabled: true },
        created_at: new Date().toISOString()
      }
    ],
    users: [
      {
        id: "usr-1",
        organization_id: orgId,
        name: "John Doe",
        email: "john@acme.com",
        role: "Admin",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80",
        created_at: new Date().toISOString()
      },
      {
        id: "usr-2",
        organization_id: orgId,
        name: "Sarah Wilson",
        email: "sarah@acme.com",
        role: "Manager",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
        created_at: new Date().toISOString()
      },
      {
        id: "usr-3",
        organization_id: orgId,
        name: "Mike Johnson",
        email: "mike@acme.com",
        role: "Agent",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
        created_at: new Date().toISOString()
      },
      {
        id: "usr-4",
        organization_id: orgId,
        name: "Emily Davis",
        email: "emily@acme.com",
        role: "Agent",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
        created_at: new Date().toISOString()
      }
    ],
    customers: [
      {
        id: "cust-1",
        organization_id: orgId,
        name: "Sarah Johnson",
        email: "sarah@company.com",
        phone: "+1 234 567 8901",
        source: "Website",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
        online: true,
        created_at: new Date().toISOString()
      },
      {
        id: "cust-2",
        organization_id: orgId,
        name: "Mike Wilson",
        email: "mike@company.com",
        phone: "+1 234 567 8902",
        source: "Facebook",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
        online: true,
        created_at: new Date().toISOString()
      },
      {
        id: "cust-3",
        organization_id: orgId,
        name: "Emma Davis",
        email: "emma@company.com",
        phone: "+1 234 567 8903",
        source: "Google Ads",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
        online: true,
        created_at: new Date().toISOString()
      },
      {
        id: "cust-4",
        organization_id: orgId,
        name: "James Miller",
        email: "james@company.com",
        phone: "+1 234 567 8904",
        source: "Website",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
        online: false,
        created_at: new Date().toISOString()
      },
      {
        id: "cust-5",
        organization_id: orgId,
        name: "Olivia Brown",
        email: "olivia@company.com",
        phone: "+1 234 567 8905",
        source: "Referral",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
        online: true,
        created_at: new Date().toISOString()
      },
      {
        id: "cust-6",
        organization_id: orgId,
        name: "Daniel Taylor",
        email: "daniel@company.com",
        phone: "+1 234 567 8906",
        source: "Website",
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80",
        online: false,
        created_at: new Date().toISOString()
      }
    ],
    conversations: [
      {
        id: "conv-1",
        organization_id: orgId,
        customer_id: "cust-1",
        channel: "web",
        status: "active",
        assigned_agent: "sales",
        last_message: "I want to know about your premium plan...",
        last_message_at: "10:28 AM",
        created_at: new Date().toISOString()
      },
      {
        id: "conv-2",
        organization_id: orgId,
        customer_id: "cust-2",
        channel: "web",
        status: "pending",
        assigned_agent: "support",
        last_message: "Where is my order #12345?",
        last_message_at: "10:17 AM",
        created_at: new Date().toISOString()
      },
      {
        id: "conv-3",
        organization_id: orgId,
        customer_id: "cust-3",
        channel: "web",
        status: "active",
        assigned_agent: "appointment",
        last_message: "Can you help me book a demo?",
        last_message_at: "10:25 AM",
        created_at: new Date().toISOString()
      },
      {
        id: "conv-4",
        organization_id: orgId,
        customer_id: "cust-4",
        channel: "web",
        status: "active",
        assigned_agent: "support",
        last_message: "What are your shipping options?",
        last_message_at: "9:46 AM",
        created_at: new Date().toISOString()
      },
      {
        id: "conv-5",
        organization_id: orgId,
        customer_id: "cust-5",
        channel: "web",
        status: "pending",
        assigned_agent: "sales",
        last_message: "Do you have this product in stock?",
        last_message_at: "10:15 AM",
        created_at: new Date().toISOString()
      },
      {
        id: "conv-6",
        organization_id: orgId,
        customer_id: "cust-6",
        channel: "web",
        status: "active",
        assigned_agent: "support",
        last_message: "I need help with my account...",
        last_message_at: "9:02 AM",
        created_at: new Date().toISOString()
      }
    ],
    messages: [
      {
        id: "m-1",
        organization_id: orgId,
        conversation_id: "conv-1",
        sender: "customer",
        content: "I want to know about your premium plan.",
        timestamp: "10:24 AM"
      },
      {
        id: "m-2",
        organization_id: orgId,
        conversation_id: "conv-1",
        sender: "agent",
        agent_type: "sales",
        content: "Great! Our premium plan starts at $49/month, including all core features plus advanced analytics, priority support, and more. Would you like me to show you a detailed comparison?",
        timestamp: "10:25 AM"
      },
      {
        id: "m-3",
        organization_id: orgId,
        conversation_id: "conv-1",
        sender: "customer",
        content: "Yes, please. Also, can you tell me if there is a discount for annual plans?",
        timestamp: "10:26 AM"
      },
      {
        id: "m-4",
        organization_id: orgId,
        conversation_id: "conv-1",
        sender: "agent",
        agent_type: "sales",
        content: "Sure! We offer a 20% discount on annual plans. Would you like me to send you the plan comparison and pricing details?",
        timestamp: "10:28 AM"
      },
      {
        id: "m-mw1",
        organization_id: orgId,
        conversation_id: "conv-2",
        sender: "customer",
        content: "Where is my order #12345?",
        timestamp: "10:14 AM"
      },
      {
        id: "m-mw2",
        organization_id: orgId,
        conversation_id: "conv-2",
        sender: "agent",
        agent_type: "support",
        content: "Let me check that for you. I found your order #12345. It's currently out for delivery and is expected to arrive tomorrow, Apr 29, 2025.\n\nYou can track it here:",
        timestamp: "10:15 AM"
      },
      {
        id: "m-mw3",
        organization_id: orgId,
        conversation_id: "conv-2",
        sender: "customer",
        content: "Thank you!",
        timestamp: "10:17 AM"
      },
      {
        id: "m-ed1",
        organization_id: orgId,
        conversation_id: "conv-3",
        sender: "customer",
        content: "I want to book a demo.",
        timestamp: "10:20 AM"
      },
      {
        id: "m-ed2",
        organization_id: orgId,
        conversation_id: "conv-3",
        sender: "agent",
        agent_type: "appointment",
        content: "Sure! I would be happy to help you book a demo. What day works best for you?",
        timestamp: "10:21 AM"
      },
      {
        id: "m-ed3",
        organization_id: orgId,
        conversation_id: "conv-3",
        sender: "customer",
        content: "Tomorrow works for me.",
        timestamp: "10:22 AM"
      },
      {
        id: "m-ed4",
        organization_id: orgId,
        conversation_id: "conv-3",
        sender: "agent",
        agent_type: "appointment",
        content: "Here are the available slots for tomorrow:\n• 10:00 AM\n• 11:30 AM\n• 2:00 PM\n• 4:30 PM\nWhich one would you like to choose?",
        timestamp: "10:23 AM"
      },
      {
        id: "m-ed5",
        organization_id: orgId,
        conversation_id: "conv-3",
        sender: "customer",
        content: "2:00 PM",
        timestamp: "10:24 AM"
      },
      {
        id: "m-ed6",
        organization_id: orgId,
        conversation_id: "conv-3",
        sender: "agent",
        agent_type: "appointment",
        content: "Perfect! Your demo is booked for tomorrow at 2:00 PM. You will receive a calendar invite shortly.",
        timestamp: "10:25 AM"
      }
    ],
    leads: [
      {
        id: "lead-1",
        organization_id: orgId,
        customer_id: "cust-1",
        name: "Sarah Johnson",
        email: "sarah@company.com",
        phone: "+1 234 567 8901",
        source: "Website",
        status: "Hot",
        score: 85,
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
        company: "Acme Growth Labs",
        notes: "Interested in annual Enterprise license. Decision maker.",
        created_at: new Date().toISOString()
      },
      {
        id: "lead-2",
        organization_id: orgId,
        customer_id: "cust-2",
        name: "Mike Wilson",
        email: "mike@company.com",
        phone: "+1 234 567 8902",
        source: "Facebook",
        status: "Hot",
        score: 72,
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
        company: "Wilson & Co",
        notes: "Inquired about order tracking and e-commerce plugin.",
        created_at: new Date().toISOString()
      },
      {
        id: "lead-3",
        organization_id: orgId,
        customer_id: "cust-3",
        name: "Emma Davis",
        email: "emma@company.com",
        phone: "+1 234 567 8903",
        source: "Google Ads",
        status: "Qualified",
        score: 55,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
        company: "Davis Logistics",
        notes: "Booked demo call for Tuesday 2:00 PM.",
        created_at: new Date().toISOString()
      },
      {
        id: "lead-4",
        organization_id: orgId,
        customer_id: "cust-4",
        name: "James Miller",
        email: "james@company.com",
        phone: "+1 234 567 8904",
        source: "Website",
        status: "New",
        score: 32,
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
        company: "Miller Retail",
        notes: "First inquiry regarding bulk shipping rates.",
        created_at: new Date().toISOString()
      },
      {
        id: "lead-5",
        organization_id: orgId,
        customer_id: "cust-5",
        name: "Olivia Brown",
        email: "olivia@company.com",
        phone: "+1 234 567 8905",
        source: "Referral",
        status: "Qualified",
        score: 68,
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
        company: "Brown Creative Studio",
        notes: "Looking for 5-10 seat hardware bundles.",
        created_at: new Date().toISOString()
      }
    ],
    appointments: [
      {
        id: "apt-1",
        organization_id: orgId,
        customer_id: "cust-1",
        title: "Demo Call",
        date: "Apr 29, 2025",
        time: "2:00 PM - 2:30 PM",
        customer_name: "Sarah Johnson",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
        service: "Enterprise Demo",
        provider: "Google Calendar",
        status: "Confirmed",
        created_at: new Date().toISOString()
      },
      {
        id: "apt-2",
        organization_id: orgId,
        customer_id: "cust-2",
        title: "Client Call",
        date: "Apr 29, 2025",
        time: "10:00 AM - 11:00 AM",
        customer_name: "Mike Wilson",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
        service: "Integration Review",
        provider: "Google Calendar",
        status: "Confirmed",
        created_at: new Date().toISOString()
      },
      {
        id: "apt-3",
        organization_id: orgId,
        customer_id: "cust-3",
        title: "Follow Up",
        date: "Apr 29, 2025",
        time: "4:30 PM - 5:00 PM",
        customer_name: "Emma Davis",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
        service: "Service Onboarding",
        provider: "Outlook",
        status: "Confirmed",
        created_at: new Date().toISOString()
      },
      {
        id: "apt-4",
        organization_id: orgId,
        customer_id: "cust-4",
        title: "Team Meeting",
        date: "Apr 30, 2025",
        time: "11:00 AM - 12:00 PM",
        customer_name: "Internal Ops",
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80",
        service: "Pipeline Review",
        provider: "Google Calendar",
        status: "Confirmed",
        created_at: new Date().toISOString()
      },
      {
        id: "apt-5",
        organization_id: orgId,
        customer_id: "cust-5",
        title: "Product Demo",
        date: "May 02, 2025",
        time: "4:00 PM - 5:00 PM",
        customer_name: "James Miller",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
        service: "Product Showcase",
        provider: "Outlook",
        status: "Confirmed",
        created_at: new Date().toISOString()
      }
    ],
    knowledge_documents: [
      {
        id: "doc-1",
        organization_id: orgId,
        title: "Shipping Policy.pdf",
        type: "Policy",
        last_updated: "Apr 30, 2025",
        status: "Active",
        size: "1.4 MB",
        content: "Orders placed before 2:00 PM EST ship same day. Standard shipping takes 3-5 business days. Express shipping takes 24 hours. Real-time UPS tracking numbers are assigned once dispatched."
      },
      {
        id: "doc-2",
        organization_id: orgId,
        title: "Return Policy.pdf",
        type: "Policy",
        last_updated: "Apr 28, 2025",
        status: "Active",
        size: "840 KB",
        content: "We offer a 30-day hassle-free return window for all unblemished hardware and unopened software packages. Full refunds are processed within 48 hours of return receipt."
      },
      {
        id: "doc-3",
        organization_id: orgId,
        title: "Product Catalog.pdf",
        type: "Product",
        last_updated: "Apr 15, 2025",
        status: "Active",
        size: "12.8 MB",
        content: "MacBook Air M1 ($799) features an 8-core CPU, up to 18 hours battery life, Retina display. Dell Inspiron 15 ($749) features Intel Core i7, 16GB RAM, 512GB SSD with 10 hours battery life."
      },
      {
        id: "doc-4",
        organization_id: orgId,
        title: "Company FAQ.docx",
        type: "FAQ",
        last_updated: "Apr 12, 2025",
        status: "Active",
        size: "520 KB",
        content: "Demo appointments can be booked 7 days a week between 9:00 AM and 6:00 PM EST. Synced automatically with Google Calendar and Microsoft Outlook."
      },
      {
        id: "doc-5",
        organization_id: orgId,
        title: "Terms & Conditions.pdf",
        type: "Legal",
        last_updated: "Apr 10, 2025",
        status: "Active",
        size: "2.1 MB",
        content: "Multi-tenant enterprise service level agreement guarantees 99.99% monthly uptime and strict encryption-at-rest data privacy."
      }
    ],
    integrations: [
      {
        id: "int-1",
        organization_id: orgId,
        provider: "google_calendar",
        name: "Google Calendar",
        category: "calendar",
        connected: true,
        icon: "calendar",
        status: "active",
        last_synced_at: new Date().toISOString()
      },
      {
        id: "int-2",
        organization_id: orgId,
        provider: "shopify",
        name: "Shopify",
        category: "ecommerce",
        connected: false,
        icon: "shopping-bag",
        status: "disconnected"
      },
      {
        id: "int-3",
        organization_id: orgId,
        provider: "woocommerce",
        name: "WooCommerce",
        category: "ecommerce",
        connected: false,
        icon: "store",
        status: "disconnected"
      },
      {
        id: "int-4",
        organization_id: orgId,
        provider: "hubspot",
        name: "HubSpot",
        category: "crm",
        connected: false,
        icon: "database",
        status: "disconnected"
      },
      {
        id: "int-5",
        organization_id: orgId,
        provider: "whatsapp",
        name: "WhatsApp",
        category: "messaging",
        connected: false,
        icon: "message-circle",
        status: "disconnected"
      },
      {
        id: "int-6",
        organization_id: orgId,
        provider: "twilio",
        name: "SMS (Twilio)",
        category: "messaging",
        connected: false,
        icon: "phone",
        status: "disconnected"
      },
      {
        id: "int-7",
        organization_id: orgId,
        provider: "outlook",
        name: "Outlook",
        category: "calendar",
        connected: false,
        icon: "mail",
        status: "disconnected"
      }
    ]
  };
}

export class Database {
  private static loadDB(): DBSchema {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Could not read database file, initializing default schema.", e);
    }
    const initial = getInitialData();
    Database.saveDB(initial);
    return initial;
  }

  private static saveDB(data: DBSchema): void {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Could not write database file", e);
    }
  }

  // Multi-tenant scoped query helpers
  static getOrganizations(): DBOrganization[] {
    return Database.loadDB().organizations;
  }

  static getOrganization(orgId: string): DBOrganization | undefined {
    return Database.loadDB().organizations.find((o) => o.id === orgId);
  }

  static updateOrganization(orgId: string, updates: Partial<DBOrganization>): DBOrganization {
    const db = Database.loadDB();
    const index = db.organizations.findIndex((o) => o.id === orgId);
    if (index !== -1) {
      db.organizations[index] = { ...db.organizations[index], ...updates };
      Database.saveDB(db);
      return db.organizations[index];
    }
    throw new Error(`Organization ${orgId} not found`);
  }

  static getUsers(orgId: string): DBUser[] {
    return Database.loadDB().users.filter((u) => u.organization_id === orgId);
  }

  static createUser(user: Omit<DBUser, "id" | "created_at">): DBUser {
    const db = Database.loadDB();
    const newUser: DBUser = {
      ...user,
      id: `usr-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    Database.saveDB(db);
    return newUser;
  }

  static getConversations(orgId: string): (DBConversation & { customer: DBCustomer; messages: DBMessage[] })[] {
    const db = Database.loadDB();
    const orgConvs = db.conversations.filter((c) => c.organization_id === orgId);
    return orgConvs.map((conv) => {
      const customer = db.customers.find((c) => c.id === conv.customer_id) || {
        id: conv.customer_id,
        organization_id: orgId,
        name: "Unknown Customer",
        email: "unknown@company.com",
        phone: "+1 000 000 0000",
        source: "Website",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        online: false,
        created_at: conv.created_at
      };
      const messages = db.messages.filter((m) => m.conversation_id === conv.id);
      return { ...conv, customer, messages };
    });
  }

  static addMessage(msg: Omit<DBMessage, "id" | "timestamp">): DBMessage {
    const db = Database.loadDB();
    const newMsg: DBMessage = {
      ...msg,
      id: `m-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    db.messages.push(newMsg);

    // Update parent conversation last message
    const conv = db.conversations.find((c) => c.id === msg.conversation_id);
    if (conv) {
      conv.last_message = msg.content;
      conv.last_message_at = newMsg.timestamp;
      if (msg.agent_type) {
        conv.assigned_agent = msg.agent_type;
      }
    }

    Database.saveDB(db);
    return newMsg;
  }

  static updateConversationStatus(
    convId: string,
    status: DBConversation["status"]
  ): DBConversation {
    const db = Database.loadDB();
    const conv = db.conversations.find((c) => c.id === convId);
    if (conv) {
      conv.status = status;
      Database.saveDB(db);
      return conv;
    }
    throw new Error(`Conversation ${convId} not found`);
  }

  static getLeads(orgId: string): DBLead[] {
    return Database.loadDB().leads.filter((l) => l.organization_id === orgId);
  }

  static createLead(lead: Omit<DBLead, "id" | "created_at">): DBLead {
    const db = Database.loadDB();
    const newLead: DBLead = {
      ...lead,
      id: `lead-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    db.leads.unshift(newLead);
    Database.saveDB(db);
    return newLead;
  }

  static updateLead(leadId: string, updates: Partial<DBLead>): DBLead {
    const db = Database.loadDB();
    const index = db.leads.findIndex((l) => l.id === leadId);
    if (index !== -1) {
      db.leads[index] = { ...db.leads[index], ...updates };
      Database.saveDB(db);
      return db.leads[index];
    }
    throw new Error(`Lead ${leadId} not found`);
  }

  static getAppointments(orgId: string): DBAppointment[] {
    return Database.loadDB().appointments.filter((a) => a.organization_id === orgId);
  }

  static createAppointment(apt: Omit<DBAppointment, "id" | "created_at">): DBAppointment {
    const db = Database.loadDB();
    const newApt: DBAppointment = {
      ...apt,
      id: `apt-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    db.appointments.unshift(newApt);
    Database.saveDB(db);
    return newApt;
  }

  static updateAppointment(aptId: string, updates: Partial<DBAppointment>): DBAppointment {
    const db = Database.loadDB();
    const index = db.appointments.findIndex((a) => a.id === aptId);
    if (index !== -1) {
      db.appointments[index] = { ...db.appointments[index], ...updates };
      Database.saveDB(db);
      return db.appointments[index];
    }
    throw new Error(`Appointment ${aptId} not found`);
  }

  static getKnowledgeDocs(orgId: string): DBKnowledgeDoc[] {
    return Database.loadDB().knowledge_documents.filter((d) => d.organization_id === orgId);
  }

  static createKnowledgeDoc(doc: Omit<DBKnowledgeDoc, "id" | "last_updated">): DBKnowledgeDoc {
    const db = Database.loadDB();
    const newDoc: DBKnowledgeDoc = {
      ...doc,
      id: `doc-${Date.now()}`,
      last_updated: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    };
    db.knowledge_documents.unshift(newDoc);
    Database.saveDB(db);
    return newDoc;
  }

  static updateKnowledgeDoc(orgId: string, docId: string, updates: Partial<DBKnowledgeDoc>): DBKnowledgeDoc {
    const db = Database.loadDB();
    const index = db.knowledge_documents.findIndex((d) => d.id === docId && d.organization_id === orgId);
    if (index !== -1) {
      db.knowledge_documents[index] = {
        ...db.knowledge_documents[index],
        ...updates,
        last_updated: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      };
      Database.saveDB(db);
      return db.knowledge_documents[index];
    }
    throw new Error(`Knowledge document ${docId} not found`);
  }

  static deleteKnowledgeDoc(orgId: string, docId: string): boolean {
    const db = Database.loadDB();
    const initialLen = db.knowledge_documents.length;
    db.knowledge_documents = db.knowledge_documents.filter((d) => !(d.id === docId && d.organization_id === orgId));
    if (db.knowledge_documents.length !== initialLen) {
      Database.saveDB(db);
      return true;
    }
    return false;
  }

  static getIntegrations(orgId: string): DBIntegration[] {
    return Database.loadDB().integrations.filter((i) => i.organization_id === orgId);
  }

  static toggleIntegration(orgId: string, provider: string): DBIntegration {
    const db = Database.loadDB();
    const item = db.integrations.find(
      (i) => i.organization_id === orgId && i.provider === provider
    );
    if (item) {
      item.connected = !item.connected;
      item.status = item.connected ? "active" : "disconnected";
      if (item.connected) {
        item.last_synced_at = new Date().toISOString();
      }
      Database.saveDB(db);
      return item;
    }
    throw new Error(`Integration ${provider} not found`);
  }

  static updateIntegration(orgId: string, provider: string, data: Partial<DBIntegration>): DBIntegration {
    const db = Database.loadDB();
    const item = db.integrations.find(
      (i) => i.organization_id === orgId && i.provider === provider
    );
    if (item) {
      Object.assign(item, data);
      Database.saveDB(db);
      return item;
    }
    throw new Error(`Integration ${provider} not found`);
  }
}
