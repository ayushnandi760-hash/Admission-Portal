/**
 * src/models/Application.model.js
 *
 * Mongoose schema for the `applications` collection.
 * Extended to represent a comprehensive university admission application:
 * - Program & Department selection
 * - Personal details (Father's name, Mother's name, Category, Blood Group, etc.)
 * - Contact details (Primary/Alternate phone, Permanent & Present address with auto-copy)
 * - Parent / Guardian details
 * - Academic qualifications (Class 10, Class 12 with subject marks, optional Diploma)
 * - Entrance examination details (WBJEE / JEE Main / GATE / CAT / JECA scorecards)
 * - Additional information (Previous institution, accommodations, achievements)
 * - Unique applicationNumber generated upon final submission
 * - Status lifecycle: draft → submitted → under_review → accepted | rejected
 */

const mongoose = require('mongoose');

// ─── Sub-schemas ───────────────────────────────────────────────────────────

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true, default: '' },
    addressLine: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'India' },
    pincode: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const programSelectionSchema = new mongoose.Schema(
  {
    program: {
      type: String,
      trim: true,
      default: 'B.Tech',
    },
    programName: {
      type: String,
      trim: true,
      default: 'B.Tech',
    },
    department: {
      type: String,
      trim: true,
      default: 'Computer Science & Engineering',
    },
    academicSession: {
      type: String,
      trim: true,
      default: '2026-2027',
    },
    session: {
      type: String,
      trim: true,
      default: '2026-2027',
    },
    admissionCategory: {
      type: String,
      trim: true,
      default: 'WBJEE General Quota',
    },
    category: {
      type: String,
      trim: true,
      default: 'WBJEE General Quota',
    },
  },
  { _id: false }
);

const personalDetailsSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true },
    fatherName: { type: String, trim: true, default: '' },
    motherName: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say', 'Male', 'Female', 'Other', 'Prefer not to say'],
      default: 'male',
    },
    nationality: { type: String, trim: true, default: 'Indian' },
    category: {
      type: String,
      enum: ['General', 'OBC', 'OBC-A', 'OBC-B', 'SC', 'ST', 'EWS', 'Other'],
      default: 'General',
    },
    bloodGroup: { type: String, trim: true, default: '' },
    religion: { type: String, trim: true, default: '' },
    maritalStatus: {
      type: String,
      enum: ['Single', 'Married', 'Other', 'Divorced', 'Widowed', 'single', 'married', ''],
      default: 'Single',
    },
  },
  { _id: false }
);

const contactDetailsSchema = new mongoose.Schema(
  {
    primaryMobile: { type: String, trim: true, default: '' },
    alternateMobile: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    permanentAddress: { type: addressSchema, default: () => ({}) },
    presentAddress: { type: addressSchema, default: () => ({}) },
    sameAsPermanent: { type: Boolean, default: false },
  },
  { _id: false }
);

const guardianDetailsSchema = new mongoose.Schema(
  {
    fatherName: { type: String, trim: true, default: '' },
    fatherOccupation: { type: String, trim: true, default: '' },
    fatherPhone: { type: String, trim: true, default: '' },
    fatherEmail: { type: String, trim: true, default: '' },
    motherName: { type: String, trim: true, default: '' },
    motherOccupation: { type: String, trim: true, default: '' },
    motherPhone: { type: String, trim: true, default: '' },
    annualIncome: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const class10Schema = new mongoose.Schema(
  {
    board: { type: String, trim: true, default: '' },
    schoolName: { type: String, trim: true, default: '' },
    passingYear: { type: Number },
    rollNumber: { type: String, trim: true, default: '' },
    totalMarks: { type: Number },
    marksObtained: { type: Number },
    percentage: { type: Number },
  },
  { _id: false }
);

const class12Schema = new mongoose.Schema(
  {
    board: { type: String, trim: true, default: '' },
    schoolName: { type: String, trim: true, default: '' },
    passingYear: { type: Number },
    rollNumber: { type: String, trim: true, default: '' },
    stream: { type: String, trim: true, default: 'Science' },
    physicsMarks: { type: Number },
    chemistryMarks: { type: Number },
    mathMarks: { type: Number },
    totalMarks: { type: Number },
    marksObtained: { type: Number },
    percentage: { type: Number },
  },
  { _id: false }
);

const diplomaSchema = new mongoose.Schema(
  {
    isApplicable: { type: Boolean, default: false },
    boardOrUniversity: { type: String, trim: true, default: '' },
    instituteName: { type: String, trim: true, default: '' },
    branch: { type: String, trim: true, default: '' },
    passingYear: { type: Number },
    percentageOrCgpa: { type: Number },
  },
  { _id: false }
);

const entranceExamSchema = new mongoose.Schema(
  {
    examName: { type: String, trim: true, default: 'WBJEE' },
    examYear: { type: Number, default: () => new Date().getFullYear() },
    rollNumber: { type: String, trim: true, default: '' },
    rank: { type: String, trim: true, default: '' },
    score: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const additionalInfoSchema = new mongoose.Schema(
  {
    previousInstitution: { type: String, trim: true, default: '' },
    preferredCommunication: {
      type: String,
      enum: ['Email', 'SMS', 'WhatsApp', 'Phone'],
      default: 'Email',
    },
    disabilityAccommodation: { type: String, trim: true, default: '' },
    achievements: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

// ─── Main Application Schema ───────────────────────────────────────────────

const applicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One application per student user
    },
    applicationNumber: {
      type: String,
      unique: true,
      sparse: true, // Only exists once submitted or generated
      trim: true,
    },
    academicSession: {
      type: String,
      default: '2026-2027',
      trim: true,
    },

    // Extended Section Details
    programSelection: {
      type: programSelectionSchema,
      default: () => ({}),
    },
    personalDetails: {
      type: personalDetailsSchema,
      default: () => ({}),
    },
    contactDetails: {
      type: contactDetailsSchema,
      default: () => ({}),
    },
    guardianDetails: {
      type: guardianDetailsSchema,
      default: () => ({}),
    },
    academicDetails: {
      class10: { type: class10Schema, default: () => ({}) },
      class12: { type: class12Schema, default: () => ({}) },
      diploma: { type: diplomaSchema, default: () => ({ isApplicable: false }) },
    },
    entranceExaminations: {
      type: [entranceExamSchema],
      default: () => [],
    },
    additionalInformation: {
      type: additionalInfoSchema,
      default: () => ({}),
    },

    // Backwards compatibility legacy fields
    programApplied: {
      type: String,
      default: 'B.Tech',
    },
    personalInfo: {
      type: Object,
      default: null,
    },
    academicInfo: {
      type: Object,
      default: null,
    },

    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'accepted', 'rejected'],
      default: 'draft',
    },
    adminRemarks: {
      type: String,
      trim: true,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Pre-save hook: Sync legacy fields programApplied, personalInfo, academicInfo
applicationSchema.pre('save', function () {
  if (this.programSelection?.program) {
    this.programApplied = this.programSelection.program;
  }
  if (!this.academicSession && this.programSelection?.academicSession) {
    this.academicSession = this.programSelection.academicSession;
  }
});

module.exports = mongoose.model('Application', applicationSchema);
