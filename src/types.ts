export enum DocumentType {
  RADIOGRAPHY = 'RADIOGRAPHY',
  PRESCRIPTION = 'PRESCRIPTION',
  EVOLUTION_NOTE = 'EVOLUTION_NOTE',
  OTHER = 'OTHER'
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Patient {
  id: string;
  name: string;
  lastName: string;
  dni: string;
  birthDate: string;
  phone: string;
  email: string;
  address?: string;
  createdAt: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  dentistId: string;
  date: number; // Unix timestamp
  reason: string;
  status: AppointmentStatus;
}

export interface ClinicalRecord {
  id: string;
  patientId: string;
  date: number;
  content: string;
  dentistName: string;
}

export interface MedicalDocument {
  id: string;
  patientId: string;
  type: DocumentType;
  title: string;
  url: string;
  createdAt: number;
  description?: string;
}

export enum DentalSurface {
  MESIAL = 'MESIAL',
  DISTAL = 'DISTAL',
  OCCLUSAL = 'OCCLUSAL',
  VESTIBULAR = 'VESTIBULAR',
  LINGUAL = 'LINGUAL',
  GENERAL = 'GENERAL'
}

export enum ToothCondition {
  CARIES = 'CARIES',
  FILLING = 'FILLING',
  ABSENCE = 'ABSENCE',
  CROWN = 'CROWN',
  ENDODONTICS = 'ENDODONTICS'
}

export interface ToothMarking {
  toothNumber: number;
  surfaces: DentalSurface[];
  condition: ToothCondition;
  notes?: string;
}

export interface Odontogram {
  id: string;
  patientId: string;
  dentistId: string;
  markings: ToothMarking[];
  updatedAt: number;
}

export interface BudgetItem {
  description: string;
  price: number;
  toothNumbers?: number[];
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface Budget {
  id: string;
  patientId: string;
  dentistId: string;
  items: BudgetItem[];
  total: number;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED';
  createdAt: number;
}
