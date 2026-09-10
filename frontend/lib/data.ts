export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  unreadCount?: number;
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
  notes?: string;
}

export interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  customerName: string;
  avatar: string;
  service: string;
  provider: 'Google Calendar' | 'Outlook';
  status: 'Confirmed' | 'Pending' | 'Rescheduled' | 'Cancelled';
  color: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  rating: number;
  badge?: string;
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
