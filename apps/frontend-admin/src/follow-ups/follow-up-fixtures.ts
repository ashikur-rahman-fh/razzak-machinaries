import type {
  CustomerFollowUp,
  CustomerFollowUpsResponse,
  DashboardFollowUpsResponse,
} from '@razzak-machinaries/shared/api';

export const sampleActiveFollowUp: CustomerFollowUp = {
  id: 1,
  customerId: 42,
  followUpDate: '2026-06-26',
  status: 'pending',
  note: 'Call about payment',
  completionNote: '',
  assignedToId: 1,
  assignedToName: 'Admin User',
  createdById: 1,
  createdByName: 'Admin User',
  completedById: null,
  completedByName: null,
  completedAt: null,
  rescheduledFromId: null,
  createdAt: '2026-06-25T10:00:00Z',
  updatedAt: '2026-06-25T10:00:00Z',
  isOverdue: false,
  isToday: true,
};

export const sampleFollowUpHistory: CustomerFollowUp[] = [
  {
    id: 2,
    customerId: 42,
    followUpDate: '2026-06-20',
    status: 'rescheduled',
    note: 'Earlier follow-up',
    completionNote: '',
    assignedToId: 1,
    assignedToName: 'Admin User',
    createdById: 1,
    createdByName: 'Admin User',
    completedById: null,
    completedByName: null,
    completedAt: null,
    rescheduledFromId: null,
    createdAt: '2026-06-18T10:00:00Z',
    updatedAt: '2026-06-20T10:00:00Z',
    isOverdue: false,
    isToday: false,
  },
];

export const sampleCustomerFollowUpsResponse: CustomerFollowUpsResponse = {
  active: sampleActiveFollowUp,
  history: sampleFollowUpHistory,
};

export const sampleEmptyCustomerFollowUpsResponse: CustomerFollowUpsResponse = {
  active: null,
  history: [],
};

export const sampleDashboardFollowUpsResponse: DashboardFollowUpsResponse = {
  items: [
    {
      id: 10,
      followUpDate: '2026-06-20',
      isOverdue: true,
      isToday: false,
      note: 'Overdue payment reminder',
      assignedToName: 'Admin User',
      createdByName: 'Admin User',
      customer: {
        id: 42,
        fullNameBn: 'রহিম উদ্দিন',
        fullNameEn: 'Rahim Uddin',
        phone: '+8801712345678',
        addressBn: 'ঢাকা',
        addressEn: 'Dhaka',
        currentBalance: '1500.00',
      },
    },
    {
      id: 11,
      followUpDate: '2026-06-26',
      isOverdue: false,
      isToday: true,
      note: 'Today follow-up',
      assignedToName: 'Admin User',
      createdByName: 'Admin User',
      customer: {
        id: 43,
        fullNameBn: 'করিম',
        fullNameEn: 'Karim',
        phone: '+8801711111111',
        addressBn: 'চট্টগ্রাম',
        addressEn: 'Chittagong',
        currentBalance: '500.00',
      },
    },
  ],
};

export const sampleEmptyDashboardFollowUpsResponse: DashboardFollowUpsResponse = {
  items: [],
};
