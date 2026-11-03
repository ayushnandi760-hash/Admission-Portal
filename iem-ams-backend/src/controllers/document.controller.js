/**
 * src/controllers/document.controller.js
 *
 * Handles document uploads and downloads.
 *
 * uploadDocument   — receives a file via Multer, saves metadata to DB.
 *                    (Auto-creates application draft if student hasn't started one yet).
 * getMyDocuments   — lists documents belonging to the student's application.
 * downloadDocument — streams the file to the client after an ownership check.
 * deleteDocument   — removes file from disk and database.
 */

const path = require('path');
const fs = require('fs');
const Document = require('../models/Document.model');
const Application = require('../models/Application.model');
const { sendSuccess, sendError } = require('../utils/response.utils');

// POST /api/v1/documents/upload
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, { statusCode: 400, message: 'No file received. Please select a file.' });
    }

    const { docType } = req.body;
    if (!docType) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return sendError(res, { statusCode: 400, message: 'docType is required.' });
    }

    // Find student's application (by applicationId if provided, or by applicant id)
    let application = null;
    if (req.body.applicationId) {
      application = await Application.findOne({ _id: req.body.applicationId, applicant: req.user.id });
    }
    if (!application) {
      application = await Application.findOne({ applicant: req.user.id });
    }
    if (!application) {
      application = await Application.create({
        applicant: req.user.id,
        programApplied: 'B.Tech',
        status: 'draft',
      });
    }

    if (application.status === 'rejected') {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return sendError(res, {
        statusCode: 400,
        message: 'Cannot upload documents to a rejected application.',
      });
    }

    // If single-slot document (like photo, signature, marksheet), clean up prior version
    if (docType !== 'other') {
      const existingDoc = await Document.findOne({ application: application._id, docType }).select('+storedPath');
      if (existingDoc) {
        try {
          if (fs.existsSync(existingDoc.storedPath)) {
            fs.unlinkSync(existingDoc.storedPath);
          }
        } catch (_) {}
        await Document.deleteOne({ _id: existingDoc._id });
      }
    }

    const document = await Document.create({
      application: application._id,
      uploader: req.user.id,
      docType,
      fileName: req.file.originalname,
      storedPath: req.file.path,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Document uploaded successfully.',
      data: {
        id: document._id,
        docType: document.docType,
        fileName: document.fileName,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        uploadedAt: document.createdAt,
      },
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return sendError(res, { statusCode: 500, message: err.message });
  }
};

// GET /api/v1/documents/my
const getMyDocuments = async (req, res) => {
  try {
    let application = null;
    if (req.query && req.query.applicationId) {
      application = await Application.findOne({ _id: req.query.applicationId, applicant: req.user.id });
    }
    if (!application) {
      application = await Application.findOne({ applicant: req.user.id });
    }
    if (!application) {
      return sendSuccess(res, { data: [] });
    }

    const documents = await Document.find({ application: application._id }).select('-storedPath');
    return sendSuccess(res, { data: documents });
  } catch (err) {
    return sendError(res, { statusCode: 500, message: err.message });
  }
};

// GET /api/v1/documents/:id/download
const downloadDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).select('+storedPath');

    if (!document) {
      return sendError(res, { statusCode: 404, message: 'Document not found.' });
    }

    // Ownership check: only uploader or admin can download
    if (req.user.role !== 'admin' && document.uploader.toString() !== req.user.id) {
      return sendError(res, { statusCode: 403, message: 'Access denied.' });
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

// DELETE /api/v1/documents/:id
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).select('+storedPath');

    if (!document) {
      return sendError(res, { statusCode: 404, message: 'Document not found.' });
    }

    // Ownership check
    if (document.uploader.toString() !== req.user.id) {
      return sendError(res, { statusCode: 403, message: 'You can only delete your own documents.' });
    }

    const application = await Application.findById(document.application);
    if (application && application.status === 'rejected') {
      return sendError(res, {
        statusCode: 400,
        message: 'Cannot delete documents from a rejected application.',
      });
    }

    const absolutePath = path.resolve(document.storedPath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await Document.findByIdAndDelete(req.params.id);

    return sendSuccess(res, { message: 'Document deleted successfully.' });
  } catch (err) {
    return sendError(res, { statusCode: 500, message: err.message });
  }
};

module.exports = { uploadDocument, getMyDocuments, downloadDocument, deleteDocument };
