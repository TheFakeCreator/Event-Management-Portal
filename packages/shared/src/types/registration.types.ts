// Registration related types and interfaces (for recruitment applications)

export interface RegistrationCustomFields {
  [fieldId: string]: string | number | boolean | string[] | Date;
}

export interface Registration {
  _id: string;
  recruitment: string; // Recruitment ID
  name: string;
  email: string;
  customFields: RegistrationCustomFields;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRegistrationRequest {
  recruitment: string; // Recruitment ID
  name: string;
  email: string;
  customFields?: RegistrationCustomFields;
}

export interface UpdateRegistrationRequest {
  name?: string;
  email?: string;
  customFields?: RegistrationCustomFields;
}

export interface RegistrationFilterOptions {
  recruitment?: string;
  email?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface RegistrationStats {
  total: number;
  byRecruitment: { [recruitmentId: string]: number };
  recent: number; // Last 7 days
}
