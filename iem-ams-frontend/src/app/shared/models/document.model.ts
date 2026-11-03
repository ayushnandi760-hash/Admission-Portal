/**
 * src/app/shared/models/document.model.ts
 *
 * Defines models and types for uploaded verification documents.
 * Corresponds to Document.model.js in the backend.
 */

export type DocType =
  | 'class_10_admit'
  | 'class_10_marksheet'
  | 'class_12_marksheet'
  | 'entrance_rank_card'
  | 'photo'
  | 'signature'
  | 'id_proof'
  | 'migration_certificate'
  | 'caste_certificate'
  | 'domicile_certificate'
  | 'income_certificate'
  | 'antiragging_affidavit'
  | 'marksheet'
  | 'certificate'
  | 'other';

export interface DocumentItem {
  _id: string;
  application: string;
  uploader: string;
  docType: DocType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt?: string;
}

export interface DocumentTypeOption {
  value: DocType;
  label: string;
  description: string;
  icon: string;
  group?: 'Academic' | 'Identity' | 'Certificates & Affidavits';
}

export const DOCUMENT_TYPES: DocumentTypeOption[] = [
  // ─── Academic Documents ──────────────────────────────────────────────────
  {
    value: 'entrance_rank_card',
    label: 'Entrance Exam Rank Card (WBJEE / JEE Main / GATE / CAT)',
    description: 'Scorecard / rank card showing your merit rank in qualifying entrance examination',
    icon: '🎯',
    group: 'Academic'
  },
  {
    value: 'class_12_marksheet',
    label: 'Class 12 (Higher Secondary) Marksheet',
    description: '10+2 board marksheet (CBSE / ISC / WBCHSE or state board)',
    icon: '📜',
    group: 'Academic'
  },
  {
    value: 'class_10_marksheet',
    label: 'Class 10 (Secondary) Marksheet',
    description: 'Class 10 grade card / mark statement',
    icon: '📄',
    group: 'Academic'
  },
  {
    value: 'class_10_admit',
    label: 'Class 10 Admit Card / Birth Certificate (Proof of Age)',
    description: 'Official document verifying candidate date of birth',
    icon: '🎂',
    group: 'Academic'
  },
  {
    value: 'migration_certificate',
    label: 'Migration / School Leaving / Transfer Certificate',
    description: 'Transfer certificate (TC) or migration certificate from previous school/college',
    icon: '🏫',
    group: 'Academic'
  },

  // ─── Identity & Biometrics ───────────────────────────────────────────────
  {
    value: 'photo',
    label: 'Passport Size Photograph',
    description: 'Recent clear photograph with light background',
    icon: '👤',
    group: 'Identity'
  },
  {
    value: 'signature',
    label: 'Candidate Signature Specimen',
    description: 'Clear signature on white paper (scanned or photo)',
    icon: '✍️',
    group: 'Identity'
  },
  {
    value: 'id_proof',
    label: 'Government ID Proof (Aadhaar / Voter ID / Passport)',
    description: 'Photo ID issued by Government of India',
    icon: '🪪',
    group: 'Identity'
  },

  // ─── Certificates & Affidavits ───────────────────────────────────────────
  {
    value: 'caste_certificate',
    label: 'Category / Caste Certificate (SC / ST / OBC / EWS)',
    description: 'Competent authority reservation certificate (if applicable)',
    icon: '🏛️',
    group: 'Certificates & Affidavits'
  },
  {
    value: 'domicile_certificate',
    label: 'Domicile / Residential Certificate',
    description: 'State domicile certificate for West Bengal quota eligibility',
    icon: '📍',
    group: 'Certificates & Affidavits'
  },
  {
    value: 'income_certificate',
    label: 'Family Income Certificate (TFW Scheme)',
    description: 'Annual family income certificate for Tuition Fee Waiver (TFW)',
    icon: '💰',
    group: 'Certificates & Affidavits'
  },
  {
    value: 'antiragging_affidavit',
    label: 'Anti-Ragging Undertaking / Affidavit',
    description: 'Signed anti-ragging declaration as mandated by AICTE/UGC',
    icon: '🛡️',
    group: 'Certificates & Affidavits'
  },
  {
    value: 'other',
    label: 'Other Supporting Document',
    description: 'Any additional co-curricular or achievement certificate',
    icon: '📁',
    group: 'Certificates & Affidavits'
  }
];

export function getDocumentLabel(docType: string): string {
  const found = DOCUMENT_TYPES.find(d => d.value === docType);
  if (found) return found.label;

  // Fallback for legacy categories
  switch (docType) {
    case 'marksheet': return 'Class 10/12 Marksheet';
    case 'certificate': return 'Achievement / Category Certificate';
    default: return docType;
  }
}
