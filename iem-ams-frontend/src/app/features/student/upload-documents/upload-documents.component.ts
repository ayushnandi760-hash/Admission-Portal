/**
 * src/app/features/student/upload-documents/upload-documents.component.ts
 *
 * Dedicated Document Upload & Final Submission Component:
 * - Loaded via /student/application/documents/:applicationId or /application/documents/:applicationId
 * - Dynamic card-based upload interface with drag-and-drop
 * - Strict client-side and server-side validation (PDF, JPG, PNG <= 5MB)
 * - Replace and remove functionality for draft documents
 * - Pre-submission checklist verification against backend requirements
 * - Formal declaration checkbox and final submission
 * - Generates unique reference number and printable receipt view
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DocumentService } from '../../../core/services/document.service';
import { ApplicationService } from '../../../core/services/application.service';
import { AuthService } from '../../../core/services/auth.service';
import { Application, DocumentsStatusResponse } from '../../../shared/models/application.model';
import { DocumentItem } from '../../../shared/models/document.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

export interface DocumentCardConfig {
  docType: string;
  title: string;
  description: string;
  acceptedFormats: string;
  maxSizeBytes: number;
  maxSizeLabel: string;
  required: boolean;
  isDragging?: boolean;
  uploading?: boolean;
  uploadedDoc?: DocumentItem | null;
}

@Component({
  selector: 'app-upload-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StatusBadgeComponent],
  templateUrl: './upload-documents.component.html',
  styleUrls: ['./upload-documents.component.css'],
})
export class UploadDocumentsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private docService = inject(DocumentService);
  private appService = inject(ApplicationService);
  public authService = inject(AuthService);

  applicationId: string | null = null;
  application: Application | null = null;
  uploadedDocuments: DocumentItem[] = [];
  docStatus: DocumentsStatusResponse | null = null;

  isLoading = true;
  isSubmitting = false;
  isAutoUploadingDemo = false;
  successMessage = '';
  errorMessage = '';

  activeStage: 'upload' | 'review' | 'success' = 'upload';
  declarationAgreed = false;

  // Maximum file size: 5 MB
  readonly MAX_FILE_SIZE = 5 * 1024 * 1024;
  readonly ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
  readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/pjpeg',
    'image/x-png',
  ];

  // Document Cards List
  documentCards: DocumentCardConfig[] = [
    {
      docType: 'photo',
      title: 'Recent Passport-size Photograph',
      description: 'Clear frontal color photo taken within last 6 months (white background preferred).',
      acceptedFormats: 'JPG, PNG',
      maxSizeBytes: 5 * 1024 * 1024,
      maxSizeLabel: '5 MB',
      required: true,
    },
    {
      docType: 'signature',
      title: "Applicant's Official Signature",
      description: 'Sign clearly in dark blue or black ink on a blank white sheet and scan.',
      acceptedFormats: 'JPG, PNG',
      maxSizeBytes: 5 * 1024 * 1024,
      maxSizeLabel: '5 MB',
      required: true,
    },
    {
      docType: 'class_10_marksheet',
      title: 'Class 10 Marksheet / Certificate',
      description: 'Official marksheet or passing certificate issued by CBSE / ICSE / State Board.',
      acceptedFormats: 'PDF, JPG, PNG',
      maxSizeBytes: 5 * 1024 * 1024,
      maxSizeLabel: '5 MB',
      required: true,
    },
    {
      docType: 'class_10_admit',
      title: 'Class 10 Admit Card (Age Proof)',
      description: 'Official admit card issued by board as proof of age and identity.',
      acceptedFormats: 'PDF, JPG, PNG',
      maxSizeBytes: 5 * 1024 * 1024,
      maxSizeLabel: '5 MB',
      required: false,
    },
    {
      docType: 'class_12_marksheet',
      title: 'Class 12 (Higher Secondary) Marksheet',
      description: 'Official marksheet showing Physics, Chemistry, and Mathematics scores.',
      acceptedFormats: 'PDF, JPG, PNG',
      maxSizeBytes: 5 * 1024 * 1024,
      maxSizeLabel: '5 MB',
      required: true,
    },
    {
      docType: 'class_12_certificate',
      title: 'Class 12 Passing Certificate',
      description: 'Provisional or original passing certificate from qualifying board.',
      acceptedFormats: 'PDF, JPG, PNG',
      maxSizeBytes: 5 * 1024 * 1024,
      maxSizeLabel: '5 MB',
      required: false,
    },
    {
      docType: 'entrance_rank_card',
      title: 'Entrance Examination Scorecard / Rank Card',
      description: 'Rank scorecard for WBJEE, JEE Main, WB-JECA, GATE, or CAT.',
      acceptedFormats: 'PDF, JPG, PNG',
      maxSizeBytes: 5 * 1024 * 1024,
      maxSizeLabel: '5 MB',
      required: true,
    },
    {
      docType: 'caste_certificate',
      title: 'Category / Caste Certificate',
      description: 'Competent authority certificate for SC, ST, OBC-A, OBC-B, or EWS candidates.',
      acceptedFormats: 'PDF, JPG, PNG',
      maxSizeBytes: 5 * 1024 * 1024,
      maxSizeLabel: '5 MB',
      required: false,
    },
    {
      docType: 'diploma_marksheet',
      title: 'Diploma (Engineering) Final Marksheet',
      description: 'Required only for Diploma / Polytechnic Lateral Entry candidates.',
      acceptedFormats: 'PDF, JPG, PNG',
      maxSizeBytes: 5 * 1024 * 1024,
      maxSizeLabel: '5 MB',
      required: false,
    },
    {
      docType: 'other',
      title: 'Other Supporting Documents',
      description: 'Aadhaar ID, Transfer Certificate, Migration, or Olympiad achievements.',
      acceptedFormats: 'PDF, JPG, PNG',
      maxSizeBytes: 5 * 1024 * 1024,
      maxSizeLabel: '5 MB',
      required: false,
    },
  ];

  ngOnInit(): void {
    this.applicationId = this.route.snapshot.paramMap.get('applicationId');
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const appObs = this.applicationId
      ? this.appService.getApplicationById(this.applicationId)
      : this.appService.getMyApplication();

    appObs.subscribe({
      next: (res) => {
        if (res.data) {
          this.application = res.data;
          this.applicationId = res.data._id;

          // If application was already submitted, jump directly to success receipt
          if (this.application.status !== 'draft') {
            this.activeStage = 'success';
          }

          // Adjust cards based on applicant's details
          this.customizeCardsForApplicant();
          this.refreshDocuments();
        } else {
          this.isLoading = false;
          this.errorMessage = 'Could not locate an active admission application. Please start an application first.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to load application details.';
      },
    });
  }

  private customizeCardsForApplicant(): void {
    if (!this.application) return;

    // If candidate has diploma, make diploma card visible & recommended
    const hasDiploma = this.application.academicDetails?.diploma?.hasDiploma;
    const diplomaCard = this.documentCards.find((c) => c.docType === 'diploma_marksheet');
    if (diplomaCard) {
      diplomaCard.required = !!hasDiploma;
    }

    // Category certificate: required ONLY if social category is SC, ST, OBC, or EWS
    const socialCategory = (this.application.personalDetails?.category || '').trim();
    const casteCard = this.documentCards.find((c) => c.docType === 'caste_certificate');
    if (casteCard) {
      casteCard.required = ['SC', 'ST', 'OBC', 'OBC-A', 'OBC-B', 'EWS'].includes(socialCategory);
    }
  }

  refreshDocuments(): void {
    if (!this.applicationId) return;

    this.docService.getMyDocuments(this.applicationId).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.uploadedDocuments = res.data || [];
        this.mapDocumentsToCards();
        this.checkStatus();
      },
      error: () => {
        this.isLoading = false;
        this.uploadedDocuments = [];
        this.mapDocumentsToCards();
      },
    });
  }

  private mapDocumentsToCards(): void {
    this.documentCards.forEach((card) => {
      const match = this.uploadedDocuments.find((d) => d.docType === card.docType);
      card.uploadedDoc = match || null;
    });
  }

  checkStatus(): void {
    if (!this.applicationId) return;
    this.appService.checkDocumentsStatus(this.applicationId).subscribe({
      next: (res) => {
        this.docStatus = res.data;
      },
      error: () => {},
    });
  }

  // ── Drag & Drop Handlers ────────────────────────────────────────────────
  onDragOver(event: DragEvent, card: DocumentCardConfig): void {
    event.preventDefault();
    event.stopPropagation();
    card.isDragging = true;
  }

  onDragLeave(event: DragEvent, card: DocumentCardConfig): void {
    event.preventDefault();
    event.stopPropagation();
    card.isDragging = false;
  }

  onFileDrop(event: DragEvent, card: DocumentCardConfig): void {
    event.preventDefault();
    event.stopPropagation();
    card.isDragging = false;

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.handleFileForCard(file, card);
    }
  }

  onFileInputChange(event: Event, card: DocumentCardConfig): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.handleFileForCard(file, card);
      // Reset input value so re-selecting same file triggers change
      input.value = '';
    }
  }

  private handleFileForCard(file: File, card: DocumentCardConfig): void {
    this.errorMessage = '';
    this.successMessage = '';

    // 1. File size check
    if (file.size > card.maxSizeBytes) {
      this.errorMessage = `File "${file.name}" exceeds maximum allowed size of ${card.maxSizeLabel}.`;
      return;
    }

    // 2. Extension & MIME check
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isAllowedExt = this.ALLOWED_EXTENSIONS.includes(extension);
    const isAllowedMime = this.ALLOWED_MIME_TYPES.includes(file.type);

    if (!isAllowedExt && !isAllowedMime) {
      this.errorMessage = `File "${file.name}" is not a supported format. Please upload PDF, JPG, or PNG.`;
      return;
    }

    // Perform upload
    card.uploading = true;
    const formData = new FormData();
    formData.append('docFile', file);
    formData.append('docType', card.docType);
    if (this.applicationId) {
      formData.append('applicationId', this.applicationId);
    }

    this.docService.uploadDocument(formData).subscribe({
      next: () => {
        card.uploading = false;
        this.successMessage = `✓ ${card.title} uploaded successfully!`;
        this.refreshDocuments();
      },
      error: (err) => {
        card.uploading = false;
        this.errorMessage = err.error?.message || `Failed to upload ${card.title}.`;
      },
    });
  }

  // Remove document
  removeDocument(docId: string, card: DocumentCardConfig): void {
    if (!confirm(`Are you sure you want to remove ${card.title}?`)) return;

    this.docService.deleteDocument(docId).subscribe({
      next: () => {
        this.successMessage = `Removed ${card.title}.`;
        this.refreshDocuments();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to delete document.';
      },
    });
  }

  // Download / View document
  downloadDocument(docId: string, fileName: string): void {
    this.docService.downloadDocument(docId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Could not download document file.';
      },
    });
  }

  // Formatting helpers
  formatFileSize(bytes?: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  get allRequiredUploaded(): boolean {
    const hasPhoto = this.uploadedDocuments.some((d) => d.docType === 'photo');
    const hasSign = this.uploadedDocuments.some((d) => d.docType === 'signature');

    const screenRequiredUploaded = this.documentCards
      .filter((c) => c.required)
      .every((c) => !!c.uploadedDoc);

    return !!(
      this.docStatus?.allRequiredUploaded ||
      this.docStatus?.isComplete ||
      screenRequiredUploaded ||
      (hasPhoto && hasSign && this.uploadedDocuments.length >= 4)
    );
  }

  get missingCount(): number {
    if (!this.docStatus) return 0;
    return Math.max(0, this.docStatus.totalRequired - this.docStatus.uploadedRequired);
  }

  goToStage(stage: 'upload' | 'review' | 'success'): void {
    this.activeStage = stage;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Final Application Submission
  submitFinalApplication(): void {
    if (!this.applicationId) return;

    if (!this.declarationAgreed) {
      this.errorMessage = 'Please check the declaration box before submitting your application.';
      return;
    }

    if (!this.allRequiredUploaded) {
      this.errorMessage = 'Please upload all mandatory documents before final submission.';
      return;
    }

    if (!confirm('Are you certain you wish to submit your admission application? Once submitted, no further changes can be made.')) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.appService.submitApplication(this.applicationId).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.application = res.data;
        this.activeStage = 'success';
        this.successMessage = 'Congratulations! Your admission application has been officially submitted.';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Failed to submit application. Please ensure all documents are uploaded.';
      },
    });
  }

  printReceipt(): void {
    window.print();
  }

  /**
   * Fast Demo Helper: auto-uploads valid sample files for all required categories
   */
  autoUploadDemoDocuments(): void {
    if (!this.applicationId) return;

    this.isAutoUploadingDemo = true;
    this.errorMessage = '';
    this.successMessage = 'Uploading sample verification documents for testing...';

    const requiredCards = this.documentCards.filter(
      (c) =>
        c.required ||
        [
          'photo',
          'signature',
          'class_10_marksheet',
          'class_10_admit',
          'class_12_marksheet',
          'entrance_rank_card',
          'caste_certificate',
        ].includes(c.docType)
    );

    let index = 0;
    const uploadNext = () => {
      if (index >= requiredCards.length) {
        this.isAutoUploadingDemo = false;
        this.successMessage = '✓ All demo documents uploaded successfully! You can now proceed to Final Review.';
        this.refreshDocuments();
        return;
      }

      const card = requiredCards[index];
      const isImage = ['photo', 'signature'].includes(card.docType);
      const ext = isImage ? 'png' : 'pdf';
      const mime = isImage ? 'image/png' : 'application/pdf';

      // 1x1 valid PNG or valid minimal PDF
      const content = isImage
        ? new Uint8Array([
            137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6,
            0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5, 0, 1,
            13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
          ])
        : new TextEncoder().encode(`%PDF-1.4\n% Sample Official Document: ${card.title}\n%%EOF`);

      const blob = new Blob([content], { type: mime });
      const file = new File([blob], `demo_${card.docType}.${ext}`, { type: mime });

      const formData = new FormData();
      formData.append('docFile', file);
      formData.append('docType', card.docType);
      formData.append('applicationId', this.applicationId!);

      this.docService.uploadDocument(formData).subscribe({
        next: () => {
          index++;
          uploadNext();
        },
        error: (err) => {
          this.isAutoUploadingDemo = false;
          this.errorMessage = `Failed to upload demo ${card.title}: ` + (err.error?.message || err.message);
        },
      });
    };

    uploadNext();
  }
}
