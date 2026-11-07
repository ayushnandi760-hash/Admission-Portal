/**
 * src/controllers/admin.controller.js
 *
 * Admin-only operations.
 *
 * getAllApplications       — paginated list with optional ?status= and ?program= filters
 * getApplicationDetail     — full application with populated applicant + documents
 * updateApplicationStatus  — changes status and stores adminRemarks
 * getStats                 — aggregate counts grouped by status and program
 * downloadDocumentAsAdmin  — serves any document file to an admin
 */

const path = require('path');
const fs = require('fs');
const Application = require('../models/Application.model');
const Document = require('../models/Document.model');
const Notification = require('../models/Notification.model');
const User = require('../models/User.model');
const { sendAdmissionStatusEmail } = require('../utils/email.utils');
const { sendSuccess, sendError } = require('../utils/response.utils');

// GET /api/v1/admin/applications
const getAllApplications = async (req, res) => {
  try {
    const { status, program, search, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (program) filter.programApplied = program;

    // Search by student name or email
    if (search && search.trim()) {
      const matchingUsers = await User.find({
        $or: [
          { fullName: { $regex: search.trim(), $options: 'i' } },
          { email: { $regex: search.trim(), $options: 'i' } },
        ],
      }).select('_id');
      filter.applicant = { $in: matchingUsers.map((u) => u._id) };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('applicant', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Application.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      data: {
        applications,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
    });
  } catch (err) {
    return sendError(res, { statusCode: 500, message: err.message });
  }
};

// GET /api/v1/admin/applications/:id
const getApplicationDetail = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate(
      'applicant',
      'fullName email createdAt'
    );

    if (!application) {
      return sendError(res, { statusCode: 404, message: 'Application not found.' });
    }

    // Fetch documents separately (exclude storedPath for security)
    const documents = await Document.find({ application: application._id }).select('-storedPath');

    return sendSuccess(res, { data: { application, documents } });
  } catch (err) {
    return sendError(res, { statusCode: 500, message: err.message });
  }
};

// PATCH /api/v1/admin/applications/:id/status
const updateApplicationStatus = async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;

    const VALID_STATUSES = ['under_review', 'accepted', 'rejected', 'submitted'];
    if (!status || !VALID_STATUSES.includes(status)) {
      return sendError(res, {
        statusCode: 400,
        message: `status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const application = await Application.findById(req.params.id).populate('applicant', 'fullName email');
    if (!application) {
      return sendError(res, { statusCode: 404, message: 'Application not found.' });
    }

    application.status = status;
    if (adminRemarks !== undefined) application.adminRemarks = adminRemarks;
    await application.save();

    // 1. Create prominent in-app notification for the student portal
    let notifTitle = 'Application Status Updated';
    let notifType = 'info';
    let notifMessage = `Your application for ${application.programApplied} is now marked as ${status}.`;

    if (status === 'accepted') {
      notifTitle = '🎉 Congratulations! You Have Been Selected';
      notifType = 'success';
      notifMessage = `Congratulations! Your admission application for ${application.programApplied} (${application.department || 'Selected Department'}) has been ACCEPTED / SELECTED. Please review your portal for provisional allotment details.${adminRemarks ? ` Reviewer Note: "${adminRemarks}"` : ''}`;
    } else if (status === 'rejected') {
      notifTitle = 'Admission Decision: Not Selected';
      notifType = 'danger';
      notifMessage = `Your admission application for ${application.programApplied} was not selected for this admission round.${adminRemarks ? ` Reviewer Remarks: "${adminRemarks}"` : ''}`;
    } else if (status === 'under_review') {
      notifTitle = 'Application Under Active Review';
      notifType = 'warning';
      notifMessage = `Your application for ${application.programApplied} is currently undergoing academic scrutiny and document verification by the IEM admissions committee.`;
    }

    try {
      await Notification.create({
        recipient: application.applicant._id,
        title: notifTitle,
        message: notifMessage,
        type: notifType,
        link: '/student/dashboard',
      });
    } catch (notifErr) {
      console.error('[Student Decision Notification Error]:', notifErr.message);
    }

    // 2. Determine candidate contact details & target recipient email
    const candidateEmails = [];
    if (application.contactDetails?.email && application.contactDetails.email.trim()) {
      candidateEmails.push(application.contactDetails.email.trim());
    }
    if (application.applicant?.email && application.applicant.email.trim()) {
      if (!candidateEmails.includes(application.applicant.email.trim())) {
        candidateEmails.push(application.applicant.email.trim());
      }
    }
    const recipientTo = candidateEmails.length > 0 ? candidateEmails.join(', ') : (application.applicant?.email || '');
    const candidateName =
      application.personalDetails?.fullName ||
      application.applicant?.fullName ||
      'Applicant';
    const programName =
      application.programSelection?.program ||
      application.programSelection?.programName ||
      application.programApplied ||
      'B.Tech';

    // 3. Dispatch automated email notification (with 12s safety timeout)
    let emailResult = null;
    try {
      emailResult = await Promise.race([
        sendAdmissionStatusEmail({
          to: recipientTo,
          studentName: candidateName,
          program: programName,
          status,
          remarks: adminRemarks,
        }),
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: false, error: 'Email delivery timeout (network delay)' }), 12000)
        ),
      ]);
    } catch (emailErr) {
      console.error('[Email Dispatch Error]:', emailErr.message);
      emailResult = { success: false, error: emailErr.message };
    }

    const responseData = application.toObject();
    responseData.emailResult = emailResult || { success: false, error: 'Email service unconfigured' };
    responseData.emailDelivered = emailResult ? emailResult.success : false;
    responseData.recipientEmail = recipientTo;
    responseData.emailErrorMessage = emailResult && !emailResult.success ? emailResult.error : '';
    if (emailResult && emailResult.previewUrl) {
      responseData.emailPreviewUrl = emailResult.previewUrl;
    }

    const emailStatusNote = responseData.emailDelivered
      ? `Decision email sent to ${recipientTo}.`
      : `In-app notification delivered.${responseData.emailErrorMessage ? ` (Email issue: ${responseData.emailErrorMessage})` : ''}`;

    return sendSuccess(res, {
      message: `Application status updated to '${status}'. ${emailStatusNote}`,
      data: responseData,
    });
  } catch (err) {
    return sendError(res, { statusCode: 500, message: err.message });
  }
};

// GET /api/v1/admin/stats
const getStats = async (req, res) => {
  try {
    const [byStatus, byProgram] = await Promise.all([
      Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Application.aggregate([{ $group: { _id: '$programApplied', count: { $sum: 1 } } }]),
    ]);

    return sendSuccess(res, { data: { byStatus, byProgram } });
  } catch (err) {
    return sendError(res, { statusCode: 500, message: err.message });
  }
};

// GET /api/v1/admin/documents/:docId/download
const downloadDocumentAsAdmin = async (req, res) => {
  try {
    const document = await Document.findById(req.params.docId).select('+storedPath');

    if (!document) {
      return sendError(res, { statusCode: 404, message: 'Document not found.' });
    }

    const absolutePath = path.resolve(document.storedPath);
    if (!fs.existsSync(absolutePath)) {
      return sendError(res, { statusCode: 404, message: 'File not found on server.' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.setHeader('Content-Type', document.mimeType);
    fs.createReadStream(absolutePath).pipe(res);
  } catch (err) {
    return sendError(res, { statusCode: 500, message: err.message });
  }
};

module.exports = {
  getAllApplications,
  getApplicationDetail,
  updateApplicationStatus,
  getStats,
  downloadDocumentAsAdmin,
};

