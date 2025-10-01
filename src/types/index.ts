import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export interface User extends FirebaseUser {}

export type Folder = {
  id: string;
  name: string;
  icon: string;
  userId: string;
  createdAt: Timestamp;
};

export type Task = {
  id: string;
  title: string;
  deadline?: Timestamp;
  priority?: 'High' | 'Medium' | 'Low';
  completed: boolean;
  completedAt?: Timestamp | null;
  folderId: string;
  userId: string;
  order: number;
  createdAt: Timestamp;
};

// Made by Gebin George. Check out my other work on gebin.net
