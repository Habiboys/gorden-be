const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

router.get('/', documentController.getAll);
router.get('/:id', documentController.getOne);
router.get('/:id/pdf', documentController.generatePDF);
router.post('/', documentController.create);
router.post('/:id/send', documentController.sendEmail);
router.post('/:id/convert-to-invoice', documentController.convertToInvoice);
router.put('/:id', documentController.update);
router.patch('/:id/status', documentController.updateStatus);
router.delete('/:id', documentController.delete);

module.exports = router;
