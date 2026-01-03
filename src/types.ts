export enum Role {
  SEGNALATORE = 'SEGNALATORE',
  OPERATORE = 'OPERATORE',
}

export interface User {
  name: string;
  role: Role;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface MaintenancePOI {
  id: string;
  title: string;
  description: string;
  category: string;
  location: Coordinates;
  address?: string; // New field for human readable address
  priority: PriorityLevel; // New field for priority
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: number;
  createdBy: string;
  images: string[]; // Base64 strings
}

export interface Category {
  id: string;
  name: string;
}