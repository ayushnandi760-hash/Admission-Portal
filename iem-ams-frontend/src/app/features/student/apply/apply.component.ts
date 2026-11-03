/**
 * src/app/features/student/apply/apply.component.ts
 *
 * Professional Multi-Step Admission Application Wizard for IEM Kolkata.
 * Features:
 * - 6-Step Wizard:
 *    Step 1: Program Selection
 *    Step 2: Personal Information
 *    Step 3: Contact & Guardian Information
 *    Step 4: Academic History (10th, 12th, and conditional Diploma)
 *    Step 5: Entrance Examinations & Additional Information
 *    Step 6: Review & Continue to Documents
 * - Dynamic program, session, category & department loading from backend configuration
 * - Address synchronization (Present address same as Permanent address)
 * - Step-by-step validation and progress tracking
 * - Explicit draft persistence to MongoDB
 * - Transitions to dedicated document upload page (/application/documents/:applicationId)
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApplicationService } from '../../../core/services/application.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  Application,
  ProgramConfig,
  ProgramsConfigResponse,
} from '../../../shared/models/application.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-apply',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, StatusBadgeComponent],
  templateUrl: './apply.component.html',
  styleUrls: ['./apply.component.css'],
})
export class ApplyComponent implements OnInit {
  private fb = inject(FormBuilder);
  private appService = inject(ApplicationService);
  public authService = inject(AuthService);
  private router = inject(Router);

  applicationForm!: FormGroup;
  existingApp: Application | null = null;

  currentStep = 1;
  totalSteps = 6;

  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  // Config data from backend
  config: ProgramsConfigResponse | null = null;
  availablePrograms: ProgramConfig[] = [];
  availableDepartments: string[] = [];
  availableSessions: string[] = ['2026-2027', '2027-2028'];
  admissionCategories: string[] = [
    'WBJEE General Quota',
    'JEE Main All India Quota',
    'WB-JECA (for MCA)',
    'Management / Institutional Merit Quota',
    'TFW (Tuition Fee Waiver) Scheme',
    'Direct Admission (Qualifying Exam Merit)',
  ];

  genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
  categoryOptions = ['General', 'OBC-A', 'OBC-B', 'SC', 'ST', 'EWS', 'Other'];
  bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  maritalStatusOptions = ['Single', 'Married', 'Other'];
  streamOptions = ['Science (PCM)', 'Science (PCB)', 'Commerce', 'Arts / Humanities', 'Vocational / Technical'];
  commonBoards = ['CBSE', 'CISCE / ISC', 'WBCHSE / WBBSE', 'State Board (Other)', 'NIOS / International'];
  communicationOptions = ['Email', 'SMS', 'WhatsApp', 'Phone Call'];

  ngOnInit(): void {
    this.buildForm();
    this.loadBackendConfig();
  }

  get entranceExams(): FormArray {
    return this.applicationForm.get('entranceExaminations') as FormArray;
  }

  private buildForm(): void {
    this.applicationForm = this.fb.group({
      // Step 1: Program Selection
      programSelection: this.fb.group({
        programName: ['B.Tech', Validators.required],
        department: ['Computer Science & Engineering (CSE)', Validators.required],
        session: ['2026-2027', Validators.required],
        category: ['WBJEE General Quota', Validators.required],
      }),

      // Step 2: Personal Information
      personalDetails: this.fb.group({
        fullName: ['', [Validators.required, Validators.minLength(2)]],
        fatherName: ['', Validators.required],
        motherName: ['', Validators.required],
        dateOfBirth: ['', Validators.required],
        gender: ['Male', Validators.required],
        nationality: ['Indian', Validators.required],
        category: ['General', Validators.required],
        bloodGroup: [''],
        religion: [''],
        maritalStatus: ['Single'],
      }),

      // Step 3: Contact & Guardian Information
      contactDetails: this.fb.group({
        primaryMobile: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
        alternateMobile: ['', [Validators.pattern(/^\d{10}$/)]],
        email: ['', [Validators.required, Validators.email]],
        sameAsPermanent: [false],
        permanentAddress: this.fb.group({
          addressLine: ['', Validators.required],
          city: ['', Validators.required],
          state: ['', Validators.required],
          country: ['India', Validators.required],
          pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
        }),
        presentAddress: this.fb.group({
          addressLine: ['', Validators.required],
          city: ['', Validators.required],
          state: ['', Validators.required],
          country: ['India', Validators.required],
          pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
        }),
      }),

      guardianDetails: this.fb.group({
        fatherName: [''],
        fatherOccupation: [''],
        fatherPhone: ['', [Validators.pattern(/^\d{10}$/)]],
        fatherEmail: ['', [Validators.email]],
        motherName: [''],
        motherOccupation: [''],
        motherPhone: ['', [Validators.pattern(/^\d{10}$/)]],
        annualIncome: [''],
      }),

      // Step 4: Academic History
      academicDetails: this.fb.group({
        class10: this.fb.group({
          board: ['CBSE', Validators.required],
          schoolName: ['', Validators.required],
          passingYear: [
            2022,
            [Validators.required, Validators.min(2000), Validators.max(2030)],
          ],
          rollNumber: ['', Validators.required],
          totalMarks: [500],
          marksObtained: [445],
          percentage: [
            89.0,
            [Validators.required, Validators.min(0), Validators.max(100)],
          ],
        }),
        class12: this.fb.group({
          board: ['CBSE', Validators.required],
          schoolName: ['', Validators.required],
          passingYear: [
            2024,
            [Validators.required, Validators.min(2000), Validators.max(2030)],
          ],
          rollNumber: ['', Validators.required],
          stream: ['Science (PCM)', Validators.required],
          physicsMarks: [88, [Validators.min(0), Validators.max(100)]],
          chemistryMarks: [85, [Validators.min(0), Validators.max(100)]],
          mathMarks: [92, [Validators.min(0), Validators.max(100)]],
          totalMarks: [500],
          marksObtained: [450],
          percentage: [
            90.0,
            [Validators.required, Validators.min(0), Validators.max(100)],
          ],
        }),
        diploma: this.fb.group({
          hasDiploma: [false],
          boardUniversity: [''],
          instituteName: [''],
          branch: [''],
          passingYear: [null],
          percentage: [null],
        }),
      }),

      // Step 5: Entrance Exam & Additional Information
      entranceExaminations: this.fb.array([]),

      additionalInformation: this.fb.group({
        previousInstitution: [''],
        preferredCommunication: ['Email'],
        disabilityAccommodation: [''],
        achievements: [''],
      }),
    });

    // Listen to Program Name change to dynamically update Department list
    this.applicationForm
      .get('programSelection.programName')
      ?.valueChanges.subscribe((pName) => {
        this.updateDepartmentsForProgram(pName);
      });

    // Listen to "sameAsPermanent" checkbox to auto copy address
    this.applicationForm
      .get('contactDetails.sameAsPermanent')
      ?.valueChanges.subscribe((same) => {
        if (same) {
          const perm = this.applicationForm.get('contactDetails.permanentAddress')?.value;
          this.applicationForm.get('contactDetails.presentAddress')?.patchValue(perm);
        }
      });

    // Listen to permanentAddress changes when sameAsPermanent is active
    this.applicationForm
      .get('contactDetails.permanentAddress')
      ?.valueChanges.subscribe((perm) => {
        if (this.applicationForm.get('contactDetails.sameAsPermanent')?.value) {
          this.applicationForm.get('contactDetails.presentAddress')?.patchValue(perm);
        }
      });
  }

  private loadBackendConfig(): void {
    this.appService.getProgramsConfig().subscribe({
      next: (res) => {
        if (res.data) {
          this.config = res.data;
          this.availablePrograms = res.data.programs || [];
          this.availableSessions = res.data.availableSessions || ['2026-2027'];
          this.admissionCategories = res.data.admissionCategories || this.admissionCategories;
          this.updateDepartmentsForProgram(
            this.applicationForm.get('programSelection.programName')?.value || 'B.Tech'
          );
        }
        this.loadApplication();
      },
      error: () => {
        // Fallback default options
        this.loadApplication();
      },
    });
  }

  private updateDepartmentsForProgram(programName: string): void {
    const found = this.availablePrograms.find((p) => p.code === programName || p.name === programName);
    if (found && found.departments && found.departments.length > 0) {
      this.availableDepartments = found.departments;
      const currentDept = this.applicationForm.get('programSelection.department')?.value;
      if (!found.departments.includes(currentDept)) {
        this.applicationForm.get('programSelection.department')?.setValue(found.departments[0]);
      }
    } else {
      this.availableDepartments = [
        'Computer Science & Engineering (CSE)',
        'Information Technology (IT)',
        'Electronics & Communication Engineering (ECE)',
        'Electrical Engineering (EE)',
        'Mechanical Engineering (ME)',
      ];
    }
  }

  private loadApplication(): void {
    this.isLoading = true;
    this.appService.getMyApplication().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.data) {
          this.existingApp = res.data;
          this.patchApplicationData(res.data);

          if (this.existingApp.status !== 'draft') {
            this.applicationForm.disable();
          }
        } else {
          // Pre-populate student name and email from logged in profile
          this.authService.currentUser$.subscribe((u) => {
            if (u) {
              this.applicationForm.patchValue({
                personalDetails: { fullName: u.fullName },
                contactDetails: { email: u.email },
              });
            }
          });
        }
      },
      error: () => {
        this.isLoading = false;
        this.authService.currentUser$.subscribe((u) => {
          if (u) {
            this.applicationForm.patchValue({
              personalDetails: { fullName: u.fullName },
              contactDetails: { email: u.email },
            });
          }
        });
      },
    });
  }

  private patchApplicationData(app: Application): void {
    if (app.programSelection) {
      this.applicationForm.get('programSelection')?.patchValue({
        programName: app.programSelection.programName || app.programApplied || 'B.Tech',
        department: app.programSelection.department || app.department || '',
        session: app.programSelection.session || app.academicSession || '2026-2027',
        category: app.programSelection.category || app.admissionCategory || 'WBJEE General Quota',
      });
      this.updateDepartmentsForProgram(this.applicationForm.get('programSelection.programName')?.value);
    } else if (app.programApplied) {
      this.applicationForm.get('programSelection')?.patchValue({
        programName: app.programApplied,
        department: app.department || '',
        session: app.academicSession || '2026-2027',
      });
      this.updateDepartmentsForProgram(app.programApplied);
    }

    if (app.personalDetails) {
      const dob = app.personalDetails.dateOfBirth
        ? new Date(app.personalDetails.dateOfBirth).toISOString().substring(0, 10)
        : '';
      this.applicationForm.get('personalDetails')?.patchValue({
        ...app.personalDetails,
        dateOfBirth: dob,
      });
    }

    if (app.contactDetails) {
      this.applicationForm.get('contactDetails')?.patchValue(app.contactDetails);
    }

    if (app.guardianDetails) {
      this.applicationForm.get('guardianDetails')?.patchValue(app.guardianDetails);
    }

    if (app.academicDetails) {
      this.applicationForm.get('academicDetails')?.patchValue(app.academicDetails);
    }

    if (app.entranceExaminations && app.entranceExaminations.length > 0) {
      this.entranceExams.clear();
      app.entranceExaminations.forEach((exam) => {
        this.entranceExams.push(
          this.fb.group({
            examName: [exam.examName || '', Validators.required],
            examYear: [exam.examYear || new Date().getFullYear()],
            rollNumber: [exam.rollNumber || ''],
            rank: [exam.rank || ''],
            scorePercentile: [exam.scorePercentile || ''],
          })
        );
      });
    } else if (this.entranceExams.length === 0) {
      this.addEntranceExam('WBJEE');
    }

    if (app.additionalInformation) {
      this.applicationForm.get('additionalInformation')?.patchValue(app.additionalInformation);
    }
  }

  addEntranceExam(defaultName = 'WBJEE'): void {
    this.entranceExams.push(
      this.fb.group({
        examName: [defaultName, Validators.required],
        examYear: [new Date().getFullYear(), [Validators.min(2018), Validators.max(2030)]],
        rollNumber: [''],
        rank: [''],
        scorePercentile: [''],
      })
    );
  }

  removeEntranceExam(index: number): void {
    if (this.entranceExams.length > 1) {
      this.entranceExams.removeAt(index);
    }
  }

  // Navigation between steps
  goToStep(step: number): void {
    if (step < 1 || step > this.totalSteps) return;

    // If moving forward, validate current section
    if (step > this.currentStep) {
      if (!this.validateCurrentStep()) {
        return;
      }
      // Save draft automatically as student progresses
      this.saveDraft(false);
    }

    this.currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.goToStep(this.currentStep + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  validateCurrentStep(): boolean {
    let group: FormGroup | null = null;
    this.errorMessage = '';

    if (this.currentStep === 1) {
      group = this.applicationForm.get('programSelection') as FormGroup;
    } else if (this.currentStep === 2) {
      group = this.applicationForm.get('personalDetails') as FormGroup;
    } else if (this.currentStep === 3) {
      group = this.applicationForm.get('contactDetails') as FormGroup;
    } else if (this.currentStep === 4) {
      const acad = this.applicationForm.get('academicDetails') as FormGroup;
      const c10 = acad.get('class10') as FormGroup;
      const c12 = acad.get('class12') as FormGroup;
      if (c10.invalid || c12.invalid) {
        c10.markAllAsTouched();
        c12.markAllAsTouched();
        this.errorMessage = 'Please complete all required academic fields (Class 10 & 12).';
        return false;
      }
      return true;
    } else if (this.currentStep === 5) {
      // Optional fields in Step 5
      return true;
    }

    if (group && group.invalid) {
      group.markAllAsTouched();
      this.errorMessage = 'Please complete all required fields highlighted in red before proceeding.';
      return false;
    }

    return true;
  }

  get isDraft(): boolean {
    return !this.existingApp || this.existingApp.status === 'draft';
  }

  saveDraft(showNotice = true): void {
    this.isSaving = true;
    if (showNotice) {
      this.errorMessage = '';
      this.successMessage = '';
    }

    const raw = this.applicationForm.getRawValue();

    // Prepare payload matching backend
    const payload = {
      programApplied: raw.programSelection.programName,
      academicSession: raw.programSelection.session,
      programSelection: raw.programSelection,
      personalDetails: raw.personalDetails,
      contactDetails: raw.contactDetails,
      guardianDetails: raw.guardianDetails,
      academicDetails: raw.academicDetails,
      entranceExaminations: raw.entranceExaminations,
      additionalInformation: raw.additionalInformation,
    };

    if (this.existingApp) {
      this.appService.updateApplication(this.existingApp._id, payload).subscribe({
        next: (res) => {
          this.isSaving = false;
          this.existingApp = res.data;
          if (showNotice) {
            this.successMessage = 'Application draft saved successfully in MongoDB!';
          }
        },
        error: (err) => {
          this.isSaving = false;
          if (showNotice) {
            this.errorMessage = err.error?.message || 'Failed to save draft.';
          }
        },
      });
    } else {
      this.appService.createApplication(payload).subscribe({
        next: (res) => {
          this.isSaving = false;
          this.existingApp = res.data;
          if (showNotice) {
            this.successMessage = 'Draft initialized successfully!';
          }
        },
        error: (err) => {
          this.isSaving = false;
          if (showNotice) {
            this.errorMessage = err.error?.message || 'Failed to initialize draft.';
          }
        },
      });
    }
  }

  /**
   * Called when student finishes reviewing in Step 6 and clicks "Continue to Documents →"
   * Saves latest draft and redirects to the dedicated document upload page
   */
  proceedToDocuments(): void {
    if (this.applicationForm.invalid) {
      this.applicationForm.markAllAsTouched();
      this.errorMessage = 'Please fill out all mandatory fields across all sections before uploading documents.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const raw = this.applicationForm.getRawValue();
    const payload = {
      programApplied: raw.programSelection.programName,
      academicSession: raw.programSelection.session,
      programSelection: raw.programSelection,
      personalDetails: raw.personalDetails,
      contactDetails: raw.contactDetails,
      guardianDetails: raw.guardianDetails,
      academicDetails: raw.academicDetails,
      entranceExaminations: raw.entranceExaminations,
      additionalInformation: raw.additionalInformation,
    };

    const saveObs = this.existingApp
      ? this.appService.updateApplication(this.existingApp._id, payload)
      : this.appService.createApplication(payload);

    saveObs.subscribe({
      next: (res) => {
        this.isSaving = false;
        const appId = res.data._id;
        // Navigate to dedicated Angular route: /student/application/documents/:applicationId
        this.router.navigate(['/student/application/documents', appId]);
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err.error?.message || 'Failed to save application draft.';
      },
    });
  }

  fillDemoData(): void {
    // Preserve logged in student's name and email if available
    let currentEmail = 'ayushnandi2024@gmail.com';
    let currentName = 'Ayush Kumar Nandi';

    this.authService.currentUser$.subscribe((u) => {
      if (u) {
        if (u.email) currentEmail = u.email;
        if (u.fullName) currentName = u.fullName;
      }
    });

    this.applicationForm.patchValue({
      programSelection: {
        programName: 'B.Tech',
        department: 'Computer Science & Engineering (CSE)',
        session: '2026-2027',
        category: 'WBJEE General Quota',
      },
      personalDetails: {
        fullName: currentName,
        fatherName: 'Aloke Nandi',
        motherName: 'Sulekha Nandi',
        dateOfBirth: '2005-06-18',
        gender: 'Male',
        nationality: 'Indian',
        category: 'General',
        bloodGroup: 'B+',
        religion: 'Hinduism',
        maritalStatus: 'Single',
      },
      contactDetails: {
        primaryMobile: '9830123456',
        alternateMobile: '9830987654',
        email: currentEmail,
        sameAsPermanent: true,
        permanentAddress: {
          addressLine: 'GN-34/2, Ashram Building, Sector V, Salt Lake',
          city: 'Kolkata',
          state: 'West Bengal',
          country: 'India',
          pincode: '700091',
        },
        presentAddress: {
          addressLine: 'GN-34/2, Ashram Building, Sector V, Salt Lake',
          city: 'Kolkata',
          state: 'West Bengal',
          country: 'India',
          pincode: '700091',
        },
      },
      guardianDetails: {
        fatherName: 'Aloke Nandi',
        fatherOccupation: 'Senior Technical Lead',
        fatherPhone: '9830987654',
        fatherEmail: 'aloke.nandi@example.com',
        motherName: 'Sulekha Nandi',
        motherOccupation: 'Assistant Professor',
        motherPhone: '9830555666',
        annualIncome: '12,00,000 INR',
      },
      academicDetails: {
        class10: {
          board: 'CBSE',
          schoolName: 'Delhi Public School, Ruby Park',
          passingYear: 2022,
          rollNumber: 'CBSE-10-847291',
          totalMarks: 500,
          marksObtained: 465,
          percentage: 93.0,
        },
        class12: {
          board: 'CBSE',
          schoolName: 'Delhi Public School, Ruby Park',
          passingYear: 2024,
          rollNumber: 'CBSE-12-928410',
          stream: 'Science (PCM)',
          physicsMarks: 94,
          chemistryMarks: 91,
          mathMarks: 96,
          totalMarks: 500,
          marksObtained: 468,
          percentage: 93.6,
        },
        diploma: {
          hasDiploma: false,
          boardUniversity: '',
          instituteName: '',
          branch: '',
          passingYear: null,
          percentage: null,
        },
      },
      additionalInformation: {
        previousInstitution: 'Delhi Public School, Ruby Park, Kolkata',
        preferredCommunication: 'Email',
        disabilityAccommodation: 'None',
        achievements: 'State Science Olympiad Rank 14, Winner of Inter-School Robotics Hackathon 2023',
      },
    });

    this.entranceExams.clear();
    this.entranceExams.push(
      this.fb.group({
        examName: ['WBJEE', Validators.required],
        examYear: [2024],
        rollNumber: ['WBJEE-2024-58291'],
        rank: '1420 (GMR)',
        scorePercentile: '97.8 Percentile',
      })
    );
    this.entranceExams.push(
      this.fb.group({
        examName: ['JEE Main', Validators.required],
        examYear: [2024],
        rollNumber: ['JEE-24018293'],
        rank: '18500 (CRL)',
        scorePercentile: '98.2 Percentile',
      })
    );

    this.errorMessage = '';
    this.successMessage = '⚡ Demo applicant details successfully loaded across all 6 sections!';
  }
}
