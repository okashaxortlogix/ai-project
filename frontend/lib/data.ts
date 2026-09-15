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

export const initialConversations: Conversation[] = [];

export const initialLeads: Lead[] = [];

export const initialAppointments: Appointment[] = [];

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

export const recentActivities: any[] = [];

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

export const initialCompanies: Company[] = [];

export const initialOpportunities: Opportunity[] = [];

export const initialTasks: Task[] = [];

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
