/**
 * src/controllers/application.controller.js
 *
 * Full application lifecycle controller:
 * - getProgramsConfig: returns verified, configurable IEM programs and required document rules
 * - createApplication: initializes a draft application
 * - getMyApplication: returns student's existing application (draft or submitted)
 * - getApplicationById: returns application by ID with ownership verification
 * - updateApplication: saves progress across any section of the draft wizard
 * - checkDocumentsStatus: inspects which required documents are uploaded vs missing
 * - submitApplication: validates form completeness and document uploads, generates unique application number, and transitions status to 'submitted'
 */

const crypto = require('crypto');
const Application = require('../models/Application.model');
const Document = require('../models/Document.model');
const { sendSuccess, sendError } = require('../utils/response.utils');

// ─── Verified Official IEM Offerings Configuration ──────────────────────────
const IEM_PROGRAMS_CONFIG = {
  academicSession: '2026-2027',
  availableSessions: ['2026-2027', '2027-2028'],
  admissionCategories: [
    'WBJEE General Quota',
    'JEE Main All India Quota',
    'WB-JECA (for MCA)',
    'Management / Institutional Merit Quota',
    'TFW (Tuition Fee Waiver) Scheme',
    'Direct Admission (Qualifying Exam Merit)',
  ],
  programs: [
    {
      code: 'B.Tech',
      name: 'Bachelor of Technology (B.Tech)',
      level: 'Undergraduate',
      duration: '4 Years (8 Semesters)',
      departments: [
        'Computer Science & Engineering (CSE)',
        'CSE (Artificial Intelligence & Machine Learning)',
        'CSE (IoT & Cyber Security including Block Chain Technology)',
        'Computer Science & Business Systems (CSBS)',
        'Information Technology (IT)',
        'Electronics & Communication Engineering (ECE)',
        'Electrical Engineering (EE)',
        'Mechanical Engineering (ME)',
      ],
      requiredDocuments: [
        'photo',
        'signature',
        'class_10_marksheet',
        'class_12_marksheet',
        'entrance_rank_card',
      ],
    },
    {
      code: 'BCA',
      name: 'Bachelor of Computer Applications (BCA)',
      level: 'Undergraduate',
      duration: '3/4 Years',
      departments: ['Computer Applications & Software Systems'],
      requiredDocuments: [
        'photo',
        'signature',
        'class_10_marksheet',
        'class_12_marksheet',
      ],
    },
    {
      code: 'BBA',
      name: 'Bachelor of Business Administration (BBA)',
      level: 'Undergraduate',
      duration: '3/4 Years',
      departments: ['General Management', 'Business Analytics'],
      requiredDocuments: [
        'photo',
        'signature',
        'class_10_marksheet',
        'class_12_marksheet',
      ],
    },
    {
      code: 'MBA',
      name: 'Master of Business Administration (MBA)',
      level: 'Postgraduate',
      duration: '2 Years (4 Semesters)',
      departments: [
        'Dual Specialization: Finance & Marketing',
        'Dual Specialization: HR & Marketing',
        'Dual Specialization: Business Analytics & Finance',
      ],
      requiredDocuments: [
        'photo',
        'signature',
        'class_10_marksheet',
        'class_12_marksheet',
        'entrance_rank_card',
      ],
    },
    {
      code: 'MCA',
      name: 'Master of Computer Applications (MCA)',
      level: 'Postgraduate',
      duration: '2 Years (4 Semesters)',
      departments: ['Advanced Computer Applications & Cloud Computing'],
      requiredDocuments: [
        'photo',
        'signature',
        'class_10_marksheet',
        'class_12_marksheet',
        'entrance_rank_card',
      ],
    },
    {
      code: 'M.Tech',
      name: 'Master of Technology (M.Tech)',
      level: 'Postgraduate',
      duration: '2 Years (4 Semesters)',
      departments: [
        'Computer Science & Engineering',
        'Electronics & Communication Engineering',
      ],
      requiredDocuments: [
        'photo',
        'signature',
        'class_10_marksheet',
        'class_12_marksheet',
        'entrance_rank_card',
      ],
    },
  ],
};

// GET /api/v1/applications/config/programs
const getProgramsConfig = async (_req, res) => {
  return sendSuccess(res, {
    message: 'Program offerings retrieved successfully.',
    data: IEM_PROGRAMS_CONFIG,
  });
};

// Helper: Generates unique IEM Application Number (e.g. IEM-2026-78421)
const generateApplicationNumber = (session = '2026-2027') => {
  const year = session.split('-')[0] || '2026';
  const randomSuffix = Math.floor(10000 + Math.random() * 90000); // 5 digits
  return `IEM-${year}-${randomSuffix}`;
};

// POST /api/v1/applications
const createApplication = async (req, res) => {
  try {
    let existing = await Application.findOne({ applicant: req.user.id });
    if (existing) {
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Existing application found.',
        data: existing,
      });
    }

    const {
      programSelection,
      personalDetails,
      contactDetails,
      guardianDetails,
      academicDetails,
      entranceExaminations,
      additionalInformation,
      academicSession,
      programApplied,
    } = req.body;

    const chosenProgram = programSelection?.program || programApplied || 'B.Tech';
    const chosenDept =
      programSelection?.department ||
      (IEM_PROGRAMS_CONFIG.programs.find((p) => p.code === chosenProgram)?.departments[0] ||
        'Computer Science & Engineering');

    const application = await Application.create({
      applicant: req.user.id,
      academicSession: academicSession || programSelection?.academicSession || '2026-2027',
      programApplied: chosenProgram,
      programSelection: {
        program: chosenProgram,
        department: chosenDept,
        academicSession: academicSession || '2026-2027',
        admissionCategory: programSelection?.admissionCategory || 'WBJEE / JEE Main Quota',
      },
      personalDetails: personalDetails || {},
      contactDetails: contactDetails || {},
      guardianDetails: guardianDetails || {},
      academicDetails: academicDetails || {},
      entranceExaminations: entranceExaminations || [],
      additionalInformation: additionalInformation || {},
      status: 'draft',
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Draft application initialized successfully.',
      data: application,
    });
  } catch (err) {
    return sendError(res, { statusCode: 500, message: err.message });
  }
};

// GET /api/v1/applications/my
const getMyApplication = async (req, res) => {
  try {
    const application = await Application.findOne({ applicant: req.user.id }).populate(
      'applicant',
      'fullName email'
    );

    if (!application) {
      return sendError(res, {
        statusCode: 404,
        message: 'No application found. Please start your application.',
      });
    }

    return sendSuccess(res, { data: application });
  } catch (err) {
    return sendError(res, { statusCode: 500, message: err.message });
  }
};

// GET /api/v1/applications/:id
const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      applicant: req.user.id,
    }).populate('applicant', 'fullName email');

    if (!application) {
      return sendError(res, { statusCode: 404, message: 'Application not found.' });
    }

    return sendSuccess(res, { data: application });
  } catch (err) {
    return sendError(res, { statusCode: 500, message: err.message });
  }
};

// PUT /api/v1/applications/:id
const updateApplication = async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      applicant: req.user.id,
    });

    if (!application) {
      return sendError(res, { statusCode: 404, message: 'Application not found.' });
    }

    if (application.status !== 'draft') {
      return sendError(res, {
        statusCode: 400,
        message: 'Submitted applications cannot be modified. Please contact admissions cell if corrections are needed.',
      });
    }

    const {
      programSelection,
      personalDetails,
      contactDetails,
      guardianDetails,
      academicDetails,
      entranceExaminations,
      additionalInformation,
      academicSession,
      personalInfo,
      academicInfo,
      programApplied,
    } = req.body;

    if (programSelection !== undefined) {
      application.programSelection = programSelection;
      application.programApplied = programSelection.program || application.programApplied;
    }
    if (programApplied !== undefined && !programSelection) {
      application.programApplied = programApplied;
      if (!application.programSelection) application.programSelection = {};
      application.programSelection.program = programApplied;
    }
    if (academicSession !== undefined) application.academicSession = academicSession;

    if (personalDetails !== undefined) application.personalDetails = personalDetails;
    if (contactDetails !== undefined) application.contactDetails = contactDetails;
    if (guardianDetails !== undefined) application.guardianDetails = guardianDetails;
    if (academicDetails !== undefined) application.academicDetails = academicDetails;
    if (entranceExaminations !== undefined) application.entranceExaminations = entranceExaminations;
    if (additionalInformation !== undefined) application.additionalInformation = additionalInformation;

    // Maintain backwards compatibility if legacy fields are passed
    if (personalInfo !== undefined) application.personalInfo = personalInfo;
    if (academicInfo !== undefined) application.academicInfo = academicInfo;

    await application.save();

    return sendSuccess(res, {
      message: 'Draft application updated successfully.',
      data: application,
    });
  } catch (err) {
    return sendError(res, { statusCode: 500, message: err.message });
  }
};

// GET /api/v1/applications/:id/documents-status
const checkDocumentsStatus = async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      applicant: req.user.id,
    });

    if (!application) {
      return sendError(res, { statusCode: 404, message: 'Application not found.' });
    }

    const progCode = application.programSelection?.program || application.programApplied || 'B.Tech';
    const progRule = IEM_PROGRAMS_CONFIG.programs.find((p) => p.code === progCode);
    const requiredTypes = progRule ? progRule.requiredDocuments : ['photo', 'signature', 'class_10_marksheet'];

    // Find all documents uploaded for this application
    const uploadedDocs = await Document.find({ application: application._id });
    const uploadedTypes = uploadedDocs.map((d) => d.docType);

    const missingRequired = requiredTypes.filter((reqType) => !uploadedTypes.includes(reqType));
    const isComplete = missingRequired.length === 0;

    return sendSuccess(res, {
      data: {
        applicationId: application._id,
        program: progCode,
        requiredTypes,
        uploadedTypes,
        missingRequired,
        isComplete,
        allRequiredUploaded: isComplete,
        totalRequired: requiredTypes.length,
        uploadedRequired: requiredTypes.length - missingRequired.length,
        totalUploaded: uploadedDocs.length,
      },
    });
  } catch (err) {
    return sendError(res, { statusCode: 500, message: err.message });
  }
};

// POST /api/v1/applications/:id/submit
const submitApplication = async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      applicant: req.user.id,
    });

    if (!application) {
      return sendError(res, { statusCode: 404, message: 'Application not found.' });
    }

    if (application.status !== 'draft') {
      return sendError(res, {
        statusCode: 400,
        message: 'This application has already been submitted.',
      });
    }

    // 1. Verify that personal, contact, and academic details have been filled
    const hasPersonal =
      application.personalDetails?.fullName || application.personalInfo?.dateOfBirth;
    const hasContact =
      application.contactDetails?.primaryMobile || application.personalInfo?.phone;
    const hasAcademic =
      application.academicDetails?.class10?.board ||
      application.academicDetails?.class12?.board ||
      application.academicInfo?.lastBoard;

    if (!hasPersonal || !hasContact || !hasAcademic) {
      return sendError(res, {
        statusCode: 400,
        message: 'Please complete all required application details before submitting.',
      });
    }

    // 2. Verify mandatory documents upload check
    const uploadedDocs = await Document.find({ application: application._id });
    const uploadedTypes = uploadedDocs.map((d) => d.docType);

    // Baseline minimum required documents: Photo and Signature
    const minimumRequired = ['photo', 'signature'];
    const missingMin = minimumRequired.filter((t) => !uploadedTypes.includes(t));

    if (missingMin.length > 0) {
      return sendError(res, {
        statusCode: 400,
        message: `Please upload all required verification documents before final submission (Missing: ${missingMin.join(', ')}).`,
      });
    }

    // 3. Generate unique application number if not already present
    if (!application.applicationNumber) {
      let isUnique = false;
      let newAppNumber = '';
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        newAppNumber = generateApplicationNumber(application.academicSession);
        const existing = await Application.findOne({ applicationNumber: newAppNumber });
        if (!existing) isUnique = true;
        attempts++;
      }
      application.applicationNumber = newAppNumber;
    }

    application.status = 'submitted';
    application.submittedAt = new Date();
    await application.save();

    return sendSuccess(res, {
      message: 'Application submitted successfully! Your application reference number has been generated.',
      data: application,
    });
  } catch (err) {
    return sendError(res, { statusCode: 500, message: err.message });
  }
};

module.exports = {
  getProgramsConfig,
  createApplication,
  getMyApplication,
  getApplicationById,
  updateApplication,
  checkDocumentsStatus,
  submitApplication,
};
