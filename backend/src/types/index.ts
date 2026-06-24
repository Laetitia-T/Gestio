export interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  created_at: Date;
}

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type ListRole = "owner" | "member" | "guest";

export interface TaskList {
  id: number;
  name: string;
  owner_id: number;
  created_at: Date;
}

export interface ListMember {
  list_id: number;
  user_id: number;
  role: ListRole;
}

export interface Task {
  id: number;
  list_id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: Date | null;
  assigned_to: number | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}
