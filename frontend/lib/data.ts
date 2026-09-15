export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  unreadCount?: number;
  companyId?: string;
  companyName?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  owner?: string;
}

export interface Message {
  id: string;
  sender: 'customer' | 'agent' | 'system';
  agentType?: 'support' | 'sales' | 'appointment' | 'human';
  content: string;
  timestamp: string;
  type?: 'text' | 'order_card' | 'product_card' | 'appointment_card';
  metadata?: any;
}

export interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  status: 'active' | 'pending' | 'resolved';
  channel: 'web' | 'whatsapp' | 'email';
  assignedAgent: 'support' | 'sales' | 'appointment' | 'human';
  online: boolean;
  messages: Message[];
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: 'Website' | 'Facebook' | 'Google Ads' | 'Referral' | 'Other';
  status: 'New' | 'Contacted' | 'Qualified' | 'Hot' | 'Won' | 'Lost';
  score: number;
  avatar: string;
  company?: string;
  companyId?: string;
  notes?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  owner?: string;
  opportunityValue?: number;
  lastContactedAt?: string;
}

export interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  customerName: string;
  customerId?: string;
  avatar: string;
  service: string;
  provider: 'Google Calendar' | 'Outlook';
  status: 'Confirmed' | 'Pending' | 'Rescheduled' | 'Cancelled';
  color: string;
}

// --- GHL CRM & WORKFLOW EXTENSIONS ---

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  probability: number; // Win probability %
  order: number;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  stages: PipelineStage[];
}

export interface Opportunity {
  id: string;
  title: string;
  pipelineId: string;
  stageId: string;
  contactId: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  contactAvatar?: string;
  companyId?: string;
  companyName?: string;
  value: number;
  probability: number;
  expectedCloseDate?: string;
  owner: string;
  source: string;
  tags: string[];
  notes?: string;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  contactId?: string;
  contactName?: string;
  opportunityId?: string;
  opportunityTitle?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  reminder?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  website: string;
  phone: string;
  address: string;
  annualRevenue?: string;
  size?: string;
  contactCount: number;
  totalDealValue: number;
  openDealsCount: number;
  owner: string;
  logo?: string;
  createdAt: string;
}

export interface CustomFieldDefinition {
  id: string;
  key: string;
  label: string;
  type: 'text' | 'number' | 'dropdown' | 'date' | 'checkbox';
  options?: string[];
  entity: 'contact' | 'opportunity' | 'company';
  required?: boolean;
}

export interface SmartList {
  id: string;
  name: string;
  description: string;
  icon?: string;
  filters: {
    minScore?: number;
    tags?: string[];
    status?: string[];
    sources?: string[];
    hasOpportunity?: boolean;
    owner?: string;
  };
  count?: number;
}

export interface ActivityTimelineEvent {
  id: string;
  contactId: string;
  type: 'chat' | 'call' | 'note' | 'appointment' | 'task' | 'form_submission' | 'stage_change' | 'workflow';
  title: string;
  description: string;
  timestamp: string;
  author: string;
  icon?: string;
  badge?: string;
  metadata?: Record<string, any>;
}

export interface WorkflowTrigger {
  id: string;
  type: 'lead_created' | 'form_submitted' | 'opportunity_stage_changed' | 'tag_added' | 'appointment_booked' | 'chat_inbound';
  label: string;
  config: Record<string, any>;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'is_set';
  value: any;
}

export interface WorkflowAction {
  id: string;
  type: 'send_email' | 'send_sms' | 'add_tag' | 'remove_tag' | 'create_opportunity' | 'create_task' | 'assign_user' | 'wait_delay' | 'ai_autonomous_followup' | 'webhook';
  title: string;
  description: string;
  config: Record<string, any>;
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay' | 'if_else' | 'goal';
  label: string;
  sublabel?: string;
  config: Record<string, any>;
  yesBranch?: WorkflowNode[];
  noBranch?: WorkflowNode[];
  next?: WorkflowNode;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  nodes: WorkflowNode[];
  totalEnrolled: number;
  totalCompleted: number;
  successRate: number;
  updatedAt: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  contactName: string;
  contactEmail: string;
  status: 'running' | 'completed' | 'failed' | 'waiting';
  startedAt: string;
  currentStep: string;
  logs: Array<{ timestamp: string; step: string; status: 'ok' | 'warn' | 'error'; message: string }>;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  rating: number;
  badge?: string;
  category?: string;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  type: 'Policy' | 'Product' | 'FAQ' | 'Legal';
  lastUpdated: string;
  status: 'Active' | 'Processing' | 'Inactive' | 'Failed';
  size: string;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'calendar' | 'crm' | 'ecommerce' | 'messaging';
  connected: boolean;
  icon: string;
  badge?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Agent' | 'Viewer';
  avatar: string;
  status: 'active' | 'invited';
}

export const initialConversations: Conversation[] = [
  {
    id: 'conv-1',
    customerId: 'cust-1',
    customerName: 'Sarah Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    lastMessage: 'I want to know about your premium plan...',
    timestamp: '10:24 AM',
    status: 'active',
    channel: 'web',
    assignedAgent: 'sales',
    online: true,
    messages: [
      {
        id: 'm1',
        sender: 'customer',
        content: 'I want to know about your premium plan.',
        timestamp: '10:24 AM'
      },
      {
        id: 'm2',
        sender: 'agent',
        agentType: 'sales',
        content: 'Great! Our premium plan starts at $49/month, including all core features plus advanced analytics, priority support, and more. Would you like me to show you a detailed comparison?',
        timestamp: '10:25 AM'
      },
      {
        id: 'm3',
        sender: 'customer',
        content: 'Yes, please. Also, can you tell me if there is a discount for annual plans?',
        timestamp: '10:26 AM'
      },
      {
        id: 'm4',
        sender: 'agent',
        agentType: 'sales',
        content: 'Sure! We offer a 20% discount on annual plans. Would you like me to send you the plan comparison and pricing details?',
        timestamp: '10:28 AM'
      }
    ]
  },
  {
    id: 'conv-2',
    customerId: 'cust-2',
    customerName: 'Mike Wilson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    lastMessage: 'Where is my order #12345?',
    timestamp: '5m',
    status: 'pending',
    channel: 'web',
    assignedAgent: 'support',
    online: true,
    messages: [
      {
        id: 'mw1',
        sender: 'customer',
        content: 'Where is my order #12345?',
        timestamp: '10:14 AM'
      },
      {
        id: 'mw2',
        sender: 'agent',
        agentType: 'support',
        content: "Let me check that for you. I found your order #12345. It's currently out for delivery and is expected to arrive tomorrow, Apr 29, 2025.\n\nYou can track it here:",
        timestamp: '10:15 AM'
      },
      {
        id: 'mw3',
        sender: 'customer',
        content: 'Thank you!',
        timestamp: '10:17 AM'
      }
    ]
  },
  {
    id: 'conv-3',
    customerId: 'cust-3',
    customerName: 'Emma Davis',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    lastMessage: 'Can you help me book a demo?',
    timestamp: '18m',
    status: 'active',
    channel: 'web',
    assignedAgent: 'appointment',
    online: true,
    messages: [
      {
        id: 'ed1',
        sender: 'customer',
        content: 'I want to book a demo.',
        timestamp: '10:20 AM'
      },
      {
        id: 'ed2',
        sender: 'agent',
        agentType: 'appointment',
        content: 'Sure! I would be happy to help you book a demo. What day works best for you?',
        timestamp: '10:21 AM'
      },
      {
        id: 'ed3',
        sender: 'customer',
        content: 'Tomorrow works for me.',
        timestamp: '10:22 AM'
      },
      {
        id: 'ed4',
        sender: 'agent',
        agentType: 'appointment',
        content: 'Here are the available slots for tomorrow:\n• 10:00 AM\n• 11:30 AM\n• 2:00 PM\n• 4:30 PM\nWhich one would you like to choose?',
        timestamp: '10:23 AM'
      },
      {
        id: 'ed5',
        sender: 'customer',
        content: '2:00 PM',
        timestamp: '10:24 AM'
      },
      {
        id: 'ed6',
        sender: 'agent',
        agentType: 'appointment',
        content: 'Perfect! Your demo is booked for tomorrow at 2:00 PM. You will receive a calendar invite shortly.',
        timestamp: '10:25 AM'
      }
    ]
  },
  {
    id: 'conv-4',
    customerId: 'cust-4',
    customerName: 'James Miller',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    lastMessage: 'What are your shipping options?',
    timestamp: '22m',
    status: 'active',
    channel: 'web',
    assignedAgent: 'support',
    online: false,
    messages: [
      {
        id: 'jm1',
        sender: 'customer',
        content: 'What are your shipping options?',
        timestamp: '9:45 AM'
      },
      {
        id: 'jm2',
        sender: 'agent',
        agentType: 'support',
        content: 'We offer standard shipping (3-5 business days) for $4.99 or free on orders over $50, and express next-day delivery via UPS for $14.99.',
        timestamp: '9:46 AM'
      }
    ]
  },
  {
    id: 'conv-5',
    customerId: 'cust-5',
    customerName: 'Olivia Brown',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    lastMessage: 'Do you have this product in stock?',
    timestamp: '38m',
    status: 'pending',
    channel: 'web',
    assignedAgent: 'sales',
    online: true,
    messages: [
      {
        id: 'ob1',
        sender: 'customer',
        content: "I'm looking for a laptop for work and casual use.",
        timestamp: '10:10 AM'
      },
      {
        id: 'ob2',
        sender: 'agent',
        agentType: 'sales',
        content: "Great! I can help you find the perfect laptop. What's your budget range and what features are most important to you (e.g., performance, battery life, portability)?",
        timestamp: '10:11 AM'
      },
      {
        id: 'ob3',
        sender: 'customer',
        content: 'My budget is around $800 and I need good battery life.',
        timestamp: '10:14 AM'
      },
      {
        id: 'ob4',
        sender: 'agent',
        agentType: 'sales',
        content: "Here are a few options that fit your needs:\n1. MacBook Air M1 — $799 (Up to 18 hours battery, lightweight & powerful)\n2. Dell Inspiron 15 — $749 (10 hours battery, great value for money)\n\nWould you like me to add any of these to your cart or book a quick call to discuss more options?",
        timestamp: '10:15 AM'
      }
    ]
  },
  {
    id: 'conv-6',
    customerId: 'cust-6',
    customerName: 'Daniel Taylor',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80',
    lastMessage: 'I need help with my account...',
    timestamp: '1h',
    status: 'active',
    channel: 'web',
    assignedAgent: 'support',
    online: false,
    messages: [
      {
        id: 'dt1',
        sender: 'customer',
        content: 'I need help resetting my multi-factor authentication device.',
        timestamp: '9:00 AM'
      },
      {
        id: 'dt2',
        sender: 'agent',
        agentType: 'support',
        content: 'For security reasons, MFA reset requests require verification. I have sent an authorization PIN to your registered email address ending in @gmail.com.',
        timestamp: '9:02 AM'
      }
    ]
  }
];

export const initialLeads: Lead[] = [
  {
    id: 'lead-1',
    name: 'Sarah Johnson',
    email: 'sarah@company.com',
    phone: '+1 234 567 8901',
    source: 'Website',
    status: 'Hot',
    score: 85,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    company: 'Acme Growth Labs',
    notes: 'Interested in annual Enterprise license. Decision maker.'
  },
  {
    id: 'lead-2',
    name: 'Mike Wilson',
    email: 'mike@company.com',
    phone: '+1 234 567 8902',
    source: 'Facebook',
    status: 'Hot',
    score: 72,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    company: 'Wilson & Co',
    notes: 'Inquired about order tracking and e-commerce plugin.'
  },
  {
    id: 'lead-3',
    name: 'Emma Davis',
    email: 'emma@company.com',
    phone: '+1 234 567 8903',
    source: 'Google Ads',
    status: 'Qualified',
    score: 55,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    company: 'Davis Logistics',
    notes: 'Booked demo call for Tuesday 2:00 PM.'
  },
  {
    id: 'lead-4',
    name: 'James Miller',
    email: 'james@company.com',
    phone: '+1 234 567 8904',
    source: 'Website',
    status: 'New',
    score: 32,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    company: 'Miller Retail',
    notes: 'First inquiry regarding bulk shipping rates.'
  },
  {
    id: 'lead-5',
    name: 'Olivia Brown',
    email: 'olivia@company.com',
    phone: '+1 234 567 8905',
    source: 'Referral',
    status: 'Qualified',
    score: 68,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    company: 'Brown Creative Studio',
    notes: 'Looking for 5-10 seat hardware bundles.'
  }
];

export const initialAppointments: Appointment[] = [
  {
    id: 'apt-1',
    title: 'Demo Call',
    date: 'Apr 29, 2025',
    time: '2:00 PM - 2:30 PM',
    customerName: 'Sarah Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    service: 'Enterprise Demo',
    provider: 'Google Calendar',
    status: 'Confirmed',
    color: '#20B486'
  },
  {
    id: 'apt-2',
    title: 'Client Call',
    date: 'Apr 29, 2025',
    time: '10:00 AM - 11:00 AM',
    customerName: 'Mike Wilson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    service: 'Integration Review',
    provider: 'Google Calendar',
    status: 'Confirmed',
    color: '#1677FF'
  },
  {
    id: 'apt-3',
    title: 'Follow Up',
    date: 'Apr 29, 2025',
    time: '4:30 PM - 5:00 PM',
    customerName: 'Emma Davis',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    service: 'Service Onboarding',
    provider: 'Outlook',
    status: 'Confirmed',
    color: '#8B5CF6'
  },
  {
    id: 'apt-4',
    title: 'Team Meeting',
    date: 'Apr 30, 2025',
    time: '11:00 AM - 12:00 PM',
    customerName: 'Internal Ops',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80',
    service: 'Pipeline Review',
    provider: 'Google Calendar',
    status: 'Confirmed',
    color: '#F5B942'
  },
  {
    id: 'apt-5',
    title: 'Product Demo',
    date: 'May 02, 2025',
    time: '4:00 PM - 5:00 PM',
    customerName: 'James Miller',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    service: 'Product Showcase',
    provider: 'Outlook',
    status: 'Confirmed',
    color: '#EF5350'
  }
];

export const productsList: Product[] = [
  {
    id: 'prod-1',
    name: 'MacBook Air M1',
    price: 799,
    description: 'Up to 18 hours battery life, lightweight & powerful for work and creative tasks.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
    rating: 4.9,
    badge: 'Popular'
  },
  {
    id: 'prod-2',
    name: 'Dell Inspiron 15',
    price: 749,
    description: '10 hours battery life, Intel Core i7, brilliant 15.6" anti-glare display.',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80',
    rating: 4.7,
    badge: 'Value Pick'
  },
  {
    id: 'prod-3',
    name: 'Lenovo ThinkPad E14',
    price: 829,
    description: 'Military-grade durability, legendary keyboard comfort, and fast USB-C charge.',
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=400&q=80',
    rating: 4.8
  }
];

export const initialKnowledgeDocs: KnowledgeDoc[] = [
  {
    id: 'doc-1',
    title: 'Shipping Policy.pdf',
    type: 'Policy',
    lastUpdated: 'Apr 30, 2025',
    status: 'Active',
    size: '1.4 MB'
  },
  {
    id: 'doc-2',
    title: 'Return Policy.pdf',
    type: 'Policy',
    lastUpdated: 'Apr 28, 2025',
    status: 'Active',
    size: '840 KB'
  },
  {
    id: 'doc-3',
    title: 'Product Catalog.pdf',
    type: 'Product',
    lastUpdated: 'Apr 15, 2025',
    status: 'Active',
    size: '12.8 MB'
  },
  {
    id: 'doc-4',
    title: 'Company FAQ.docx',
    type: 'FAQ',
    lastUpdated: 'Apr 12, 2025',
    status: 'Active',
    size: '520 KB'
  },
  {
    id: 'doc-5',
    title: 'Terms & Conditions.pdf',
    type: 'Legal',
    lastUpdated: 'Apr 10, 2025',
    status: 'Active',
    size: '2.1 MB'
  }
];

export const initialIntegrations: Integration[] = [
  {
    id: 'int-1',
    name: 'Google Calendar',
    description: 'Sync customer appointments and real-time scheduling slots directly with Google Workspace.',
    category: 'calendar',
    connected: true,
    icon: 'calendar',
    badge: 'Connected'
  },
  {
    id: 'int-2',
    name: 'Shopify',
    description: 'Synchronize store catalog, real-time stock levels, and automated order status lookups.',
    category: 'ecommerce',
    connected: false,
    icon: 'shopping-bag'
  },
  {
    id: 'int-3',
    name: 'WooCommerce',
    description: 'Connect your WordPress online store to trigger cart recovery and product suggestions.',
    category: 'ecommerce',
    connected: false,
    icon: 'store'
  },
  {
    id: 'int-4',
    name: 'HubSpot',
    description: 'Push qualified conversation leads, contact records, and tags directly to your CRM.',
    category: 'crm',
    connected: false,
    icon: 'database'
  },
  {
    id: 'int-5',
    name: 'WhatsApp',
    description: 'Deploy AI agents on WhatsApp Business Cloud API with official templates and quick replies.',
    category: 'messaging',
    connected: false,
    icon: 'message-circle'
  },
  {
    id: 'int-6',
    name: 'SMS (Twilio)',
    description: 'Send SMS appointment reminders, tracking updates, and one-click confirmation links.',
    category: 'messaging',
    connected: false,
    icon: 'phone'
  },
  {
    id: 'int-7',
    name: 'Outlook',
    description: 'Synchronize appointments with Microsoft 365 Outlook calendars and Teams meetings.',
    category: 'calendar',
    connected: false,
    icon: 'mail'
  }
];

export const teamMembersList: TeamMember[] = [
  {
    id: 'team-1',
    name: 'John Doe',
    email: 'john@acme.com',
    role: 'Admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
    status: 'active'
  },
  {
    id: 'team-2',
    name: 'Sarah Wilson',
    email: 'sarah@acme.com',
    role: 'Manager',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    status: 'active'
  },
  {
    id: 'team-3',
    name: 'Mike Johnson',
    email: 'mike@acme.com',
    role: 'Agent',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    status: 'active'
  },
  {
    id: 'team-4',
    name: 'Emily Davis',
    email: 'emily@acme.com',
    role: 'Agent',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    status: 'active'
  }
];

export const recentActivities = [
  {
    id: 'act-1',
    type: 'lead',
    title: 'New lead from Website Chat',
    time: '2 min ago',
    icon: 'user-plus',
    color: '#1677FF'
  },
  {
    id: 'act-2',
    type: 'appointment',
    title: 'Appointment booked',
    time: '5 min ago',
    icon: 'calendar-check',
    color: '#8B5CF6'
  },
  {
    id: 'act-3',
    type: 'support',
    title: 'Customer support resolved',
    time: '12 min ago',
    icon: 'check-circle-2',
    color: '#20B486'
  },
  {
    id: 'act-4',
    type: 'sale',
    title: 'New sale — $799.00',
    time: '24 min ago',
    icon: 'dollar-sign',
    color: '#10C8C8'
  },
  {
    id: 'act-5',
    type: 'chat',
    title: 'New conversation started',
    time: '38 min ago',
    icon: 'message-square',
    color: '#071B3A'
  }
];

export const trendData = [
  { day: 'Apr 28', conversations: 2300, leads: 480 },
  { day: 'Apr 29', conversations: 2450, leads: 520 },
  { day: 'Apr 30', conversations: 2847, leads: 642 },
  { day: 'May 1', conversations: 2700, leads: 590 },
  { day: 'May 2', conversations: 3100, leads: 690 },
  { day: 'May 3', conversations: 2900, leads: 630 },
  { day: 'May 4', conversations: 3200, leads: 710 },
  { day: 'May 5', conversations: 3350, leads: 740 },
];

export const initialPipelines: Pipeline[] = [
  {
    id: 'pipe-sales',
    name: 'Primary Sales Pipeline',
    description: 'HighLevel direct sales inbound & outbound deal pipeline',
    isDefault: true,
    stages: [
      { id: 'stg-new', name: 'New Lead', color: '#64748B', probability: 10, order: 1 },
      { id: 'stg-qual', name: 'Qualified', color: '#3B82F6', probability: 30, order: 2 },
      { id: 'stg-appt', name: 'Appointment Scheduled', color: '#8B5CF6', probability: 50, order: 3 },
      { id: 'stg-prop', name: 'Proposal Sent', color: '#F59E0B', probability: 70, order: 4 },
      { id: 'stg-nego', name: 'Negotiation', color: '#EC4899', probability: 85, order: 5 },
      { id: 'stg-won', name: 'Won', color: '#10B981', probability: 100, order: 6 },
      { id: 'stg-lost', name: 'Lost', color: '#EF4444', probability: 0, order: 7 }
    ]
  },
  {
    id: 'pipe-onboarding',
    name: 'Client Onboarding & VIP',
    description: 'Post-sales onboarding and high-touch account expansion',
    isDefault: false,
    stages: [
      { id: 'onb-kickoff', name: 'Kickoff Call', color: '#3B82F6', probability: 25, order: 1 },
      { id: 'onb-setup', name: 'Tech Integration', color: '#F59E0B', probability: 50, order: 2 },
      { id: 'onb-training', name: 'Team Training', color: '#8B5CF6', probability: 75, order: 3 },
      { id: 'onb-live', name: 'Go-Live Successful', color: '#10B981', probability: 100, order: 4 }
    ]
  }
];

export const initialCompanies: Company[] = [
  {
    id: 'comp-1',
    name: 'Apex Global Logistics',
    industry: 'Supply Chain & Logistics',
    website: 'https://apexlogistics.io',
    phone: '+1 (555) 234-9988',
    address: '100 Enterprise Way, Suite 400, Chicago IL',
    annualRevenue: '$15M - $25M',
    size: '150-300 employees',
    contactCount: 3,
    totalDealValue: 48500,
    openDealsCount: 2,
    owner: 'Sarah Wilson',
    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=120&q=80',
    createdAt: '2025-01-15T09:00:00Z'
  },
  {
    id: 'comp-2',
    name: 'Vertex Dental Care Network',
    industry: 'Healthcare & Clinics',
    website: 'https://vertexdental.health',
    phone: '+1 (555) 887-2211',
    address: '450 Health Parkway, Austin TX',
    annualRevenue: '$5M - $10M',
    size: '50-100 employees',
    contactCount: 2,
    totalDealValue: 24000,
    openDealsCount: 1,
    owner: 'John Doe',
    logo: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=120&q=80',
    createdAt: '2025-02-01T11:30:00Z'
  },
  {
    id: 'comp-3',
    name: 'Solaris Cloud SaaS',
    industry: 'Software & Technology',
    website: 'https://solariscloud.dev',
    phone: '+1 (555) 901-4433',
    address: '77 Silicon Ave, San Francisco CA',
    annualRevenue: '$20M+',
    size: '200+ employees',
    contactCount: 4,
    totalDealValue: 72000,
    openDealsCount: 3,
    owner: 'Mike Johnson',
    logo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=120&q=80',
    createdAt: '2025-02-10T14:15:00Z'
  }
];

export const initialOpportunities: Opportunity[] = [
  {
    id: 'opp-1',
    title: 'Enterprise AI Suite Expansion — 100 Seats',
    pipelineId: 'pipe-sales',
    stageId: 'stg-prop',
    contactId: 'cust-1',
    contactName: 'Sarah Johnson',
    contactEmail: 'sarah@company.com',
    contactPhone: '+1 234 567 8901',
    contactAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    companyId: 'comp-1',
    companyName: 'Apex Global Logistics',
    value: 28500,
    probability: 70,
    expectedCloseDate: '2025-05-15',
    owner: 'Sarah Wilson',
    source: 'Website Live Chat',
    tags: ['Hot Lead', 'Enterprise', 'Annual Plan'],
    notes: 'Requested custom SLA agreement and team onboarding quote.',
    status: 'open',
    createdAt: '2025-04-20T10:00:00Z',
    updatedAt: '2025-04-28T14:30:00Z'
  },
  {
    id: 'opp-2',
    title: 'Clinic Automated Appointment Bot License',
    pipelineId: 'pipe-sales',
    stageId: 'stg-appt',
    contactId: 'cust-3',
    contactName: 'Emma Davis',
    contactEmail: 'emma@company.com',
    contactPhone: '+1 234 567 8903',
    contactAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    companyId: 'comp-2',
    companyName: 'Vertex Dental Care Network',
    value: 12000,
    probability: 50,
    expectedCloseDate: '2025-05-20',
    owner: 'John Doe',
    source: 'Google Ads',
    tags: ['Dental', 'Appointments', 'Demo Done'],
    notes: 'Demo booked for tomorrow 2:00 PM. Interested in calendar sync.',
    status: 'open',
    createdAt: '2025-04-25T11:20:00Z',
    updatedAt: '2025-04-28T16:00:00Z'
  },
  {
    id: 'opp-3',
    title: 'E-commerce Support Bot + WhatsApp Omnichannel',
    pipelineId: 'pipe-sales',
    stageId: 'stg-nego',
    contactId: 'cust-2',
    contactName: 'Mike Wilson',
    contactEmail: 'mike@company.com',
    contactPhone: '+1 234 567 8902',
    contactAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    companyId: 'comp-1',
    companyName: 'Apex Global Logistics',
    value: 20000,
    probability: 85,
    expectedCloseDate: '2025-05-08',
    owner: 'Sarah Wilson',
    source: 'Facebook Campaign',
    tags: ['High Priority', 'Negotiation', 'Q2 Deal'],
    notes: 'Final review of security & compliance doc.',
    status: 'open',
    createdAt: '2025-04-18T08:45:00Z',
    updatedAt: '2025-04-28T09:15:00Z'
  },
  {
    id: 'opp-4',
    title: 'Custom AI RAG Knowledge Base Integration',
    pipelineId: 'pipe-sales',
    stageId: 'stg-qual',
    contactId: 'cust-5',
    contactName: 'Olivia Brown',
    contactEmail: 'olivia@company.com',
    contactPhone: '+1 234 567 8905',
    contactAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    companyId: 'comp-3',
    companyName: 'Solaris Cloud SaaS',
    value: 35000,
    probability: 30,
    expectedCloseDate: '2025-05-30',
    owner: 'Mike Johnson',
    source: 'Partner Referral',
    tags: ['VIP', 'Custom RAG'],
    notes: 'Wants vector embeddings integration with Notion and Zendesk.',
    status: 'open',
    createdAt: '2025-04-27T15:00:00Z',
    updatedAt: '2025-04-28T11:00:00Z'
  },
  {
    id: 'opp-5',
    title: 'Starter Sales AI Agent — Annual',
    pipelineId: 'pipe-sales',
    stageId: 'stg-won',
    contactId: 'cust-6',
    contactName: 'Daniel Taylor',
    contactEmail: 'daniel@company.com',
    contactPhone: '+1 234 567 8906',
    contactAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80',
    companyId: 'comp-3',
    companyName: 'Solaris Cloud SaaS',
    value: 9600,
    probability: 100,
    expectedCloseDate: '2025-04-26',
    owner: 'Emily Davis',
    source: 'Website Chat',
    tags: ['Closed Won', 'Quick Close'],
    notes: 'Paid via Stripe invoice.',
    status: 'won',
    createdAt: '2025-04-22T14:00:00Z',
    updatedAt: '2025-04-26T17:00:00Z'
  }
];

export const initialTasks: Task[] = [
  {
    id: 'tsk-1',
    title: 'Prepare custom enterprise security addendum for Sarah',
    description: 'Ensure SOC2 and HIPAA compliance riders are attached for Apex Logistics.',
    assignedTo: 'Sarah Wilson',
    contactId: 'cust-1',
    contactName: 'Sarah Johnson',
    opportunityId: 'opp-1',
    opportunityTitle: 'Enterprise AI Suite Expansion — 100 Seats',
    dueDate: '2025-04-30',
    priority: 'high',
    status: 'pending',
    reminder: '1 day before',
    createdAt: '2025-04-28T09:00:00Z'
  },
  {
    id: 'tsk-2',
    title: 'Follow up after Demo meeting with Emma Davis',
    description: 'Send calendar recording and pricing breakdown for appointment bot.',
    assignedTo: 'John Doe',
    contactId: 'cust-3',
    contactName: 'Emma Davis',
    opportunityId: 'opp-2',
    opportunityTitle: 'Clinic Automated Appointment Bot License',
    dueDate: '2025-04-29',
    priority: 'urgent',
    status: 'pending',
    reminder: 'At time of event',
    createdAt: '2025-04-28T10:30:00Z'
  },
  {
    id: 'tsk-3',
    title: 'Send contract signature link via DocuSign',
    description: 'Contract approved by legal. Send to Mike Wilson for signature.',
    assignedTo: 'Sarah Wilson',
    contactId: 'cust-2',
    contactName: 'Mike Wilson',
    opportunityId: 'opp-3',
    opportunityTitle: 'E-commerce Support Bot + WhatsApp Omnichannel',
    dueDate: '2025-05-02',
    priority: 'medium',
    status: 'in_progress',
    reminder: '2 hours before',
    createdAt: '2025-04-27T16:20:00Z'
  },
  {
    id: 'tsk-4',
    title: 'Initial discovery call with Olivia Brown',
    description: 'Map out existing documentation and vector chunking requirements.',
    assignedTo: 'Mike Johnson',
    contactId: 'cust-5',
    contactName: 'Olivia Brown',
    opportunityId: 'opp-4',
    opportunityTitle: 'Custom AI RAG Knowledge Base Integration',
    dueDate: '2025-05-04',
    priority: 'low',
    status: 'pending',
    createdAt: '2025-04-28T14:10:00Z'
  }
];

export const initialSmartLists: SmartList[] = [
  {
    id: 'list-all',
    name: 'All Contacts & Leads',
    description: 'Unified dynamic CRM directory across all sources',
    icon: 'users',
    filters: {}
  },
  {
    id: 'list-hot',
    name: '🔥 Hot Leads Needing Follow-up',
    description: 'Score > 70 with active inquiries in the last 72 hours',
    icon: 'flame',
    filters: { minScore: 70, tags: ['Hot Lead'] }
  },
  {
    id: 'list-opps',
    name: '💼 Open Deals & Proposals',
    description: 'Contacts associated with active sales pipeline opportunities',
    icon: 'briefcase',
    filters: { hasOpportunity: true }
  },
  {
    id: 'list-vip',
    name: '⭐ VIP & Enterprise Accounts',
    description: 'High-value customer accounts with premium SLA tags',
    icon: 'star',
    filters: { tags: ['VIP', 'Enterprise'] }
  }
];

export const initialCustomFields: CustomFieldDefinition[] = [
  { id: 'cf-budget', key: 'budget_range', label: 'Budget Range', type: 'dropdown', options: ['$1k - $5k', '$5k - $15k', '$15k - $50k', '$50k+'], entity: 'contact' },
  { id: 'cf-service', key: 'preferred_service', label: 'Target Solution', type: 'dropdown', options: ['AI Sales Bot', 'Support Automation', 'Appointment Booking', 'Full Custom Suite'], entity: 'contact' },
  { id: 'cf-decision', key: 'decision_timeframe', label: 'Decision Timeframe', type: 'dropdown', options: ['Immediately', 'Within 2 weeks', 'This Quarter', 'Exploring'], entity: 'contact' },
  { id: 'cf-deal-notes', key: 'executive_sponsor', label: 'Executive Sponsor', type: 'text', entity: 'opportunity' }
];

export const initialTimelineEvents: ActivityTimelineEvent[] = [
  {
    id: 'tl-1',
    contactId: 'cust-1',
    type: 'chat',
    title: 'Live Chat Conversation Completed',
    description: 'Customer inquired about 100-seat enterprise annual billing and SLA terms.',
    timestamp: 'Today at 10:28 AM',
    author: 'AI Sales Agent (Nexa)',
    badge: 'Live Chat'
  },
  {
    id: 'tl-2',
    contactId: 'cust-1',
    type: 'stage_change',
    title: 'Opportunity Stage Moved',
    description: 'Moved deal "Enterprise AI Suite Expansion" from Qualified to Proposal Sent.',
    timestamp: 'Today at 10:30 AM',
    author: 'Sarah Wilson',
    badge: 'Proposal Sent'
  },
  {
    id: 'tl-3',
    contactId: 'cust-1',
    type: 'note',
    title: 'Internal Note Added',
    description: 'Sarah mentioned that their CFO will sign off if annual discount is locked at 20%.',
    timestamp: 'Today at 11:15 AM',
    author: 'Sarah Wilson',
    badge: 'Internal Note'
  },
  {
    id: 'tl-4',
    contactId: 'cust-1',
    type: 'task',
    title: 'Task Created',
    description: 'Prepare custom enterprise security addendum (Due Apr 30).',
    timestamp: 'Today at 11:16 AM',
    author: 'Sarah Wilson',
    badge: 'Task'
  },
  {
    id: 'tl-5',
    contactId: 'cust-3',
    type: 'appointment',
    title: 'Appointment Scheduled',
    description: '30-minute Product Demo booked for tomorrow at 2:00 PM.',
    timestamp: 'Today at 10:25 AM',
    author: 'AI Appointment Agent',
    badge: 'Google Calendar'
  },
  {
    id: 'tl-6',
    contactId: 'cust-3',
    type: 'workflow',
    title: 'Speed-to-Lead Workflow Executed',
    description: 'Triggered "Speed to Lead: Auto SMS + Task" — Confirmation SMS sent via Twilio.',
    timestamp: 'Today at 10:26 AM',
    author: 'Workflow Engine',
    badge: 'Automated'
  }
];

export const initialWorkflows: Workflow[] = [
  {
    id: 'wf-1',
    name: '🔥 Speed-to-Lead Instant AI Response & Task',
    description: 'When a new lead arrives from chat or web forms, send auto SMS, add Tag, and assign follow-up task if score > 70.',
    isActive: true,
    trigger: {
      id: 'trig-1',
      type: 'lead_created',
      label: 'New Lead Created / Form Submitted',
      config: { source: 'all' }
    },
    conditions: [
      { field: 'score', operator: 'greater_than', value: 70 }
    ],
    nodes: [
      {
        id: 'node-1',
        type: 'trigger',
        label: 'Trigger: New Lead Created',
        sublabel: 'Captures web forms, live chat, or Facebook ads',
        config: {}
      },
      {
        id: 'node-2',
        type: 'if_else',
        label: 'Condition: Lead Score > 70?',
        sublabel: 'High-intent lead qualification branch',
        config: { field: 'score', operator: 'gt', value: 70 },
        yesBranch: [
          {
            id: 'node-2a',
            type: 'action',
            label: 'Action: Create Opportunity ($5,000)',
            sublabel: 'Stage: Qualified → Primary Sales Pipeline',
            config: { stage: 'stg-qual', value: 5000 }
          },
          {
            id: 'node-2b',
            type: 'action',
            label: 'Action: Send Instant SMS Follow-up',
            sublabel: 'Twilio: "Hi {{contact.name}}, thanks for reaching out! Book demo here..."',
            config: { template: 'speed_to_lead_sms' }
          },
          {
            id: 'node-2c',
            type: 'delay',
            label: 'Wait: 15 Minutes',
            sublabel: 'Awaiting customer response or click',
            config: { minutes: 15 }
          },
          {
            id: 'node-2d',
            type: 'action',
            label: 'Action: Create Urgent SDR Call Task',
            sublabel: 'Assign to: Sarah Wilson (Priority: High)',
            config: { assignee: 'Sarah Wilson', priority: 'high' }
          }
        ],
        noBranch: [
          {
            id: 'node-2e',
            type: 'action',
            label: 'Action: Add Tag "Nurture Lead"',
            sublabel: 'Enrolled in 5-day educational email sequence',
            config: { tag: 'Nurture Lead' }
          },
          {
            id: 'node-2f',
            type: 'action',
            label: 'Action: Send Welcome Value Email',
            sublabel: 'Email: AI Conversion & Sales Suite Overview',
            config: { template: 'welcome_nurture' }
          }
        ]
      }
    ],
    totalEnrolled: 184,
    totalCompleted: 172,
    successRate: 93.4,
    updatedAt: '2025-04-27T18:00:00Z'
  },
  {
    id: 'wf-2',
    name: '📅 Appointment Confirmation & No-Show Prevention',
    description: 'Auto-sends 24hr and 1hr reminder SMS/Email, creates Google Meet room, and triggers AI follow-up if cancelled.',
    isActive: true,
    trigger: {
      id: 'trig-2',
      type: 'appointment_booked',
      label: 'Appointment Scheduled',
      config: { calendar: 'Google Calendar' }
    },
    conditions: [],
    nodes: [
      {
        id: 'node-w2-1',
        type: 'trigger',
        label: 'Trigger: Appointment Scheduled',
        sublabel: 'Google Calendar or Nexa Appointment Bot',
        config: {}
      },
      {
        id: 'node-w2-2',
        type: 'action',
        label: 'Action: Move Opportunity Stage',
        sublabel: 'Stage: Appointment Scheduled',
        config: { stage: 'stg-appt' }
      },
      {
        id: 'node-w2-3',
        type: 'action',
        label: 'Action: Send Calendar Invite & SMS Confirmation',
        sublabel: 'Twilio SMS + ICS Calendar attachment',
        config: { sendIcs: true }
      },
      {
        id: 'node-w2-4',
        type: 'delay',
        label: 'Wait: 2 Hours Before Meeting',
        sublabel: 'Dynamic delay based on appointment start time',
        config: { beforeMinutes: 120 }
      },
      {
        id: 'node-w2-5',
        type: 'action',
        label: 'Action: Send 2-Hour Quick Reminder SMS',
        sublabel: '"Looking forward to our demo at {{appointment.time}}!"',
        config: { template: 'reminder_2hr' }
      }
    ],
    totalEnrolled: 96,
    totalCompleted: 89,
    successRate: 92.7,
    updatedAt: '2025-04-26T12:00:00Z'
  },
  {
    id: 'wf-3',
    name: '🏆 Won Deal Customer Onboarding & Slack Notification',
    description: 'When an opportunity moves to "Won", automatically tag customer VIP, notify sales channel, and create kickoff task.',
    isActive: true,
    trigger: {
      id: 'trig-3',
      type: 'opportunity_stage_changed',
      label: 'Opportunity Stage == Won',
      config: { stage: 'stg-won' }
    },
    conditions: [],
    nodes: [
      {
        id: 'node-w3-1',
        type: 'trigger',
        label: 'Trigger: Deal Closed Won',
        sublabel: 'Opportunity moved to Won stage',
        config: {}
      },
      {
        id: 'node-w3-2',
        type: 'action',
        label: 'Action: Add Tag "VIP Customer"',
        sublabel: 'Apply VIP status and unlock priority support',
        config: { tag: 'VIP Customer' }
      },
      {
        id: 'node-w3-3',
        type: 'action',
        label: 'Action: Create Kickoff Onboarding Task',
        sublabel: 'Assigned to Customer Success Lead (Due in 24h)',
        config: { assignee: 'Sarah Wilson', priority: 'urgent' }
      },
      {
        id: 'node-w3-4',
        type: 'action',
        label: 'Action: Webhook to Slack #sales-wins',
        sublabel: 'Post rich notification with deal value and rep name',
        config: { webhook: 'https://hooks.slack.com/services/...' }
      }
    ],
    totalEnrolled: 42,
    totalCompleted: 42,
    successRate: 100,
    updatedAt: '2025-04-25T09:30:00Z'
  }
];

export const initialWorkflowExecutions: WorkflowExecution[] = [
  {
    id: 'exec-1',
    workflowId: 'wf-1',
    workflowName: '🔥 Speed-to-Lead Instant AI Response & Task',
    contactName: 'Sarah Johnson',
    contactEmail: 'sarah@company.com',
    status: 'completed',
    startedAt: '2025-04-28T10:24:00Z',
    currentStep: 'Goal Achieved',
    logs: [
      { timestamp: '10:24:01', step: 'Trigger', status: 'ok', message: 'Inbound chat qualified with score 94' },
      { timestamp: '10:24:02', step: 'Condition', status: 'ok', message: 'Score 94 > 70 → Evaluated YES branch' },
      { timestamp: '10:24:03', step: 'Opportunity', status: 'ok', message: 'Created opportunity $28,500 in stage Qualified' },
      { timestamp: '10:24:04', step: 'SMS', status: 'ok', message: 'Sent Speed-to-Lead SMS to +1 234 567 8901' },
      { timestamp: '10:24:05', step: 'Task', status: 'ok', message: 'Created follow-up task for Sarah Wilson' }
    ]
  },
  {
    id: 'exec-2',
    workflowId: 'wf-2',
    workflowName: '📅 Appointment Confirmation & No-Show Prevention',
    contactName: 'Emma Davis',
    contactEmail: 'emma@company.com',
    status: 'waiting',
    startedAt: '2025-04-28T10:25:00Z',
    currentStep: 'Wait: 2 Hours Before Meeting',
    logs: [
      { timestamp: '10:25:10', step: 'Trigger', status: 'ok', message: 'Booking confirmed for Apr 29, 2:00 PM' },
      { timestamp: '10:25:12', step: 'Stage Change', status: 'ok', message: 'Moved deal to Appointment Scheduled' },
      { timestamp: '10:25:15', step: 'SMS', status: 'ok', message: 'Sent calendar invite & confirmation SMS' },
      { timestamp: '10:25:16', step: 'Delay', status: 'ok', message: 'Scheduled 2-hour reminder for Apr 29, 12:00 PM' }
    ]
  }
];
