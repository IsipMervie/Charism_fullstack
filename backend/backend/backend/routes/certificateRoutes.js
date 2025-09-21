const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Generate Individual Certificate
router.get('/generate/:userId', authMiddleware, certificateController.generateCertificate);

// Generate Students List PDF
router.get('/students-list', authMiddleware, roleMiddleware('Admin', 'Staff'), certificateController.generateStudentsListPDF);

// Generate Bulk Certificates (for future implementation)
router.post('/bulk-generate', authMiddleware, roleMiddleware('Admin'), certificateController.generateBulkCertificates);

module.exports = router;