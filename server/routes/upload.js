const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parseDocument } = require('../services/documentService');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF, DOCX, and TXT files
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'), false);
    }
  }
});

/**
 * @route POST /api/upload
 * @desc Upload and parse resume document
 * @access Public
 */
router.post('/', upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a resume file'
      });
    }

    const { originalname, mimetype, buffer } = req.file;
    
    console.log(`📁 Processing file: ${originalname} (${mimetype})`);

    // Parse the document
    const parsedText = await parseDocument(buffer, mimetype);
    
    if (!parsedText || parsedText.trim().length === 0) {
      return res.status(400).json({
        error: 'Document parsing failed',
        message: 'Could not extract text from the uploaded file. Please ensure the file contains readable text.'
      });
    }

    console.log(`✅ Successfully parsed ${originalname}. Text length: ${parsedText.length} characters`);

    res.json({
      success: true,
      data: {
        fileName: originalname,
        fileType: mimetype,
        text: parsedText,
        textLength: parsedText.length,
        wordCount: parsedText.split(/\s+/).length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Upload error:', error);
    next(error);
  }
});

/**
 * @route GET /api/upload/supported-formats
 * @desc Get list of supported file formats
 * @access Public
 */
router.get('/supported-formats', (req, res) => {
  res.json({
    supportedFormats: [
      {
        extension: '.pdf',
        mimeType: 'application/pdf',
        description: 'Portable Document Format'
      },
      {
        extension: '.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        description: 'Microsoft Word Document'
      },
      {
        extension: '.txt',
        mimeType: 'text/plain',
        description: 'Plain Text File'
      }
    ],
    maxFileSize: '10MB'
  });
});

module.exports = router; 