/**
 * src/app/shared/models/application.model.ts
 *
 * TypeScript models representing Admission Applications.
 * Matches backend Mongoose schema in Application.model.js.
 */

export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected';

export type ProgramChoice = string;

export interface ProgramConfig {
  code: string;
  name: string;
  level: string;
  duration: string;
  departments: string[];
  requiredDocuments: string[];
}

export interface ProgramsConfigResponse {
  academicSession: string;
  availableSessions: string[];
  admissionCategories: string[];
  programs: ProgramConfig[];
  documentCategoryLabels: Record<string, string>;
  documentRequirements: Record<string, { label: string; required: boolean; formats: string; maxSize: string; description: string }>;
}

export interface ProgramSelection {
  programName: string;
  department: string;
  session: string;
  category: string;
}

export interface PersonalDetails {
  fullName: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say' | '';
  nationality: string;
  category: 'General' | 'OBC-A' | 'OBC-B' | 'SC' | 'ST' | 'EWS' | 'Other' | '';
  bloodGroup?: string;
  religion?: string;
  maritalStatus?: string;
}

export interface AddressBlock {
  addressLine: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface ContactDetails {
  primaryMobile: string;
  alternateMobile?: string;
  email: string;
  sameAsPermanent?: boolean;
  permanentAddress: AddressBlock;
  presentAddress: AddressBlock;
}

export interface GuardianDetails {
  fatherName?: string;
  fatherOccupation?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  motherName?: string;
  motherOccupation?: string;
  motherPhone?: string;
  annualIncome?: string;
}

export interface Class10Record {
  board: string;
  schoolName: string;
  passingYear: number | null;
  rollNumber: string;
  totalMarks: number | null;
  marksObtained: number | null;
  percentage: number | null;
}

export interface Class12Record {
  board: string;
  schoolName: string;
  passingYear: number | null;
  rollNumber: string;
  stream: string;
  physicsMarks: number | null;
  chemistryMarks: number | null;
  mathMarks: number | null;
  totalMarks: number | null;
  marksObtained: number | null;
  percentage: number | null;
}

export interface DiplomaRecord {
  hasDiploma?: boolean;
  boardUniversity?: string;
  instituteName?: string;
  branch?: string;
  passingYear?: number | null;
  percentage?: number | null;
}

export interface AcademicDetails {
  class10: Class10Record;
  class12: Class12Record;
  diploma?: DiplomaRecord;
}

export interface EntranceExamRecord {
  examName: string;
  examYear: number | null;
  rollNumber: string;
  rank: string;
  scorePercentile: string;
}

export interface AdditionalInformation {
  previousInstitution?: string;
  preferredCommunication?: 'Email' | 'SMS' | 'WhatsApp' | 'Phone Call';
  disabilityAccommodation?: string;
  achievements?: string;
}

export interface Application {
  _id: string;
  applicant: {
    _id: string;
    fullName: string;
    email: string;
  };
  applicationNumber?: string;
  academicSession?: string;
  programApplied: string;
  department?: string;
  admissionCategory?: string;

  programSelection?: ProgramSelection;
  personalDetails?: PersonalDetails;
  contactDetails?: ContactDetails;
  guardianDetails?: GuardianDetails;
  academicDetails?: AcademicDetails;
  entranceExaminations?: EntranceExamRecord[];
  additionalInformation?: AdditionalInformation;

  status: ApplicationStatus;
  adminRemarks?: string;
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;

  // Legacy compatibility getters / properties
  personalInfo?: any;
  academicInfo?: any;
}

export interface ApplicationPayload {
  programSelection?: Partial<ProgramSelection>;
  personalDetails?: Partial<PersonalDetails>;
  contactDetails?: Partial<ContactDetails>;
  guardianDetails?: Partial<GuardianDetails>;
  academicDetails?: Partial<AcademicDetails>;
  entranceExaminations?: EntranceExamRecord[];
  additionalInformation?: Partial<AdditionalInformation>;
  programApplied?: string;
  academicSession?: string;
}

export interface DocumentStatusItem {
  key: string;
  label: string;
  required: boolean;
  uploaded: boolean;
  document?: {
    _id: string;
    fileName: string;
    fileSize?: number;
    mimeType?: string;
    createdAt?: string;
  };
}

export interface DocumentsStatusResponse {
  applicationId: string;
  program: string;
  totalRequired: number;
  uploadedRequired: number;
  allRequiredUploaded: boolean;
  isComplete?: boolean;
  requiredTypes?: string[];
  uploadedTypes?: string[];
  missingRequired: string[];
  checklist?: DocumentStatusItem[];
  totalUploaded?: number;
}
