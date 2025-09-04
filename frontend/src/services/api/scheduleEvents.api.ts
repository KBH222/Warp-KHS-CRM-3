import { apiClient } from './index';

export interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  eventType: 'personal' | 'work';
  startDate: string;
  endDate: string;
  customerId?: string;
  customer?: {
    id: string;
    name: string;
    reference: string;
  };
  workers?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleEventDto {
  title: string;
  description?: string;
  eventType: 'personal' | 'work';
  startDate: string;
  endDate: string;
  customerId?: string;
  workers?: string[];
}

export interface UpdateScheduleEventDto extends Partial<CreateScheduleEventDto> {}

export interface ScheduleEventFilters {
  startDate?: string;
  endDate?: string;
  eventType?: 'personal' | 'work';
}

export const scheduleEventsApi = {
  // Get all schedule events with optional filters
  getAll: async (filters?: ScheduleEventFilters): Promise<ScheduleEvent[]> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.eventType) params.append('eventType', filters.eventType);
    
    const queryString = params.toString();
    const response = await apiClient.get<ScheduleEvent[]>(
      `/api/schedule-events${queryString ? `?${queryString}` : ''}`
    );
    return response.data;
  },

  // Get a single schedule event by ID
  getById: async (id: string): Promise<ScheduleEvent> => {
    const response = await apiClient.get<ScheduleEvent>(`/api/schedule-events/${id}`);
    return response.data;
  },

  // Create a new schedule event
  create: async (data: CreateScheduleEventDto): Promise<ScheduleEvent> => {
    const response = await apiClient.post<ScheduleEvent>('/api/schedule-events', data);
    return response.data;
  },

  // Update an existing schedule event
  update: async (id: string, data: UpdateScheduleEventDto): Promise<ScheduleEvent> => {
    const response = await apiClient.put<ScheduleEvent>(`/api/schedule-events/${id}`, data);
    return response.data;
  },

  // Delete a schedule event
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/schedule-events/${id}`);
  }
};