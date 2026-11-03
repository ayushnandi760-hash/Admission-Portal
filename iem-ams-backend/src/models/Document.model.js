/**
 * src/models/Document.model.js
 *
 * Mongoose schema for the `documents` collection.
 *
 * Each uploaded file creates one Document record linked to an Application.
 *
 * IMPORTANT: `storedPath` is the filesystem path on the server.
 * It must NEVER be sent directly to the client — always serve files
 * through a controlled download endpoint that checks ownership/role.
 */

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    docType: {
      type: String,
      enum: [
        'class_10_admit',
        'class_10_marksheet',
        'class_12_marksheet',
        'class_12_certificate',
        'diploma_marksheet',
        'entrance_rank_card',
        'photo',
        'signature',
        'id_proof',
        'migration_certificate',
        'caste_certificate',
        'domicile_certificate',
        'income_certificate',
        'antiragging_affidavit',
        'marksheet',
        'certificate',
        'other',
      ],
      required: [true, 'Document type is required'],
    },
    fileName: {
      type: String,
      required: true, // Original filename shown to user
    },
    storedPath: {
      type: String,
      required: true, // Server-side path — never exposed via API
      select: false,
    },
    mimeType: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);

