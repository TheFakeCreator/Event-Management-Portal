// Recruitment related types and interfaces

export type FormFieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'date';

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select, radio, checkbox fields
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface Recruitment {
  _id: string;
  title: string;
  description: string;
  club: string; // Club ID
  deadline: Date;
  applicationForm: FormField[];
  isActive: boolean; // Virtual field
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRecruitmentRequest {
  title: string;
  description: string;
  club: string; // Club ID
  deadline: Date;
  applicationForm?: FormField[];
}

export interface UpdateRecruitmentRequest {
  title?: string;
  description?: string;
  deadline?: Date;
  applicationForm?: FormField[];
}

export interface RecruitmentFilterOptions {
  club?: string;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
}

// Controller request interfaces
export interface RecruitmentCreateRequest {
  title: string;
  description: string;
  deadline: string;
  clubId: string;
  applicationForm?: string; // JSON string of FormField[]
}

export interface RecruitmentApplicationRequest {
  name: string;
  email: string;
  [key: string]: any; // For custom form fields
}

// Response interfaces with populated fields
export interface RecruitmentWithDetails extends Omit<Recruitment, 'club'> {
  club: {
    _id: string;
    name: string;
  };
  totalApplicants?: number;
}
