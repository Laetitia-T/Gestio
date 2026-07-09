import client from "./client";

export const getTasks = (listId: number, filters?: { status?: string; priority?: string }) =>
  client.get(`/lists/${listId}/tasks`, { params: filters });

export const createTask = (listId: number, data: {
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
  assigned_to?: number;
}) => client.post(`/lists/${listId}/tasks`, data);

export const updateTask = (taskId: number, data: {
  title?: string;
  status?: string;
  priority?: string;
  description?: string;
  due_date?: string;
  assigned_to?: number;
}) => client.patch(`/tasks/${taskId}`, data);

export const deleteTask = (taskId: number) =>
  client.delete(`/tasks/${taskId}`);