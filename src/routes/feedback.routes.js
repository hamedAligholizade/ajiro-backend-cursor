const express = require('express');
const router = express.Router();
const FeedbackController = require('../controllers/feedback.controller');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { 
  feedbackFormCreate, 
  feedbackFormUpdate, 
  feedbackQuestionCreate, 
  feedbackQuestionUpdate,
  feedbackResponseCreate
} = require('../validation/feedback.schema');

/**
 * @swagger
 * tags:
 *   name: Feedback
 *   description: Feedback forms and responses management
 */

/**
 * @swagger
 * /api/feedback/forms:
 *   get:
 *     summary: Get all feedback forms
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of feedback forms
 *       500:
 *         description: Server error
 */
router.get('/forms', authenticateJWT, FeedbackController.getAllForms);

/**
 * @swagger
 * /api/feedback/forms/{id}:
 *   get:
 *     summary: Get feedback form by ID
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Form ID
 *     responses:
 *       200:
 *         description: Feedback form details
 *       404:
 *         description: Form not found
 *       500:
 *         description: Server error
 */
router.get('/forms/:id', authenticateJWT, FeedbackController.getFormById);

/**
 * @swagger
 * /api/feedback/forms:
 *   post:
 *     summary: Create a new feedback form
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeedbackForm'
 *     responses:
 *       201:
 *         description: Form created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post(
  '/forms',
  authenticateJWT,
  authorizeRoles(['admin', 'manager']),
  validate(feedbackFormCreate),
  FeedbackController.createForm
);

/**
 * @swagger
 * /api/feedback/forms/{id}:
 *   put:
 *     summary: Update a feedback form
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Form ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Form updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Form not found
 *       500:
 *         description: Server error
 */
router.put(
  '/forms/:id',
  authenticateJWT,
  authorizeRoles(['admin', 'manager']),
  validate(feedbackFormUpdate),
  FeedbackController.updateForm
);

/**
 * @swagger
 * /api/feedback/forms/{id}:
 *   delete:
 *     summary: Delete a feedback form
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Form ID
 *     responses:
 *       200:
 *         description: Form deleted or inactivated
 *       404:
 *         description: Form not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/forms/:id',
  authenticateJWT,
  authorizeRoles(['admin']),
  FeedbackController.deleteForm
);

/**
 * @swagger
 * /api/feedback/forms/{id}/questions:
 *   post:
 *     summary: Add a question to a feedback form
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Form ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeedbackQuestion'
 *     responses:
 *       201:
 *         description: Question added successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Form not found
 *       500:
 *         description: Server error
 */
router.post(
  '/forms/:id/questions',
  authenticateJWT,
  authorizeRoles(['admin', 'manager']),
  validate(feedbackQuestionCreate),
  FeedbackController.addQuestion
);

/**
 * @swagger
 * /api/feedback/forms/{id}/questions/{questionId}:
 *   put:
 *     summary: Update a question in a feedback form
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Form ID
 *       - in: path
 *         name: questionId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question_text:
 *                 type: string
 *               question_type:
 *                 type: string
 *                 enum: [rating, text, multiple_choice, checkbox]
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               is_required:
 *                 type: boolean
 *               sequence:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Question updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Question not found
 *       500:
 *         description: Server error
 */
router.put(
  '/forms/:id/questions/:questionId',
  authenticateJWT,
  authorizeRoles(['admin', 'manager']),
  validate(feedbackQuestionUpdate),
  FeedbackController.updateQuestion
);

/**
 * @swagger
 * /api/feedback/forms/{id}/questions/{questionId}:
 *   delete:
 *     summary: Delete a question from a feedback form
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Form ID
 *       - in: path
 *         name: questionId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Question deleted successfully
 *       400:
 *         description: Cannot delete question with responses
 *       404:
 *         description: Question not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/forms/:id/questions/:questionId',
  authenticateJWT,
  authorizeRoles(['admin', 'manager']),
  FeedbackController.deleteQuestion
);

/**
 * @swagger
 * /api/feedback/responses:
 *   post:
 *     summary: Submit a feedback response
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - form_id
 *               - customer_id
 *               - responses
 *             properties:
 *               form_id:
 *                 type: string
 *                 format: uuid
 *               customer_id:
 *                 type: string
 *                 format: uuid
 *               sale_id:
 *                 type: string
 *                 format: uuid
 *               overall_rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               responses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - question_id
 *                   properties:
 *                     question_id:
 *                       type: string
 *                       format: uuid
 *                     answer_text:
 *                       type: string
 *                     answer_rating:
 *                       type: integer
 *                     answer_options:
 *                       oneOf:
 *                         - type: array
 *                           items:
 *                             type: string
 *                         - type: string
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Form, customer, or order not found
 *       500:
 *         description: Server error
 */
router.post(
  '/responses',
  validate(feedbackResponseCreate),
  FeedbackController.submitResponse
);

/**
 * @swagger
 * /api/feedback/responses:
 *   get:
 *     summary: Get all feedback responses
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: form_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by form ID
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by customer ID
 *       - in: query
 *         name: sale_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by sale ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by response date (start)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by response date (end)
 *     responses:
 *       200:
 *         description: List of feedback responses
 *       500:
 *         description: Server error
 */
router.get(
  '/responses',
  authenticateJWT,
  authorizeRoles(['admin', 'manager']),
  FeedbackController.getResponses
);

/**
 * @swagger
 * /api/feedback/responses/{id}:
 *   get:
 *     summary: Get feedback response by ID
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Response ID
 *     responses:
 *       200:
 *         description: Feedback response details
 *       404:
 *         description: Response not found
 *       500:
 *         description: Server error
 */
router.get(
  '/responses/:id',
  authenticateJWT,
  authorizeRoles(['admin', 'manager']),
  FeedbackController.getResponseById
);

/**
 * @swagger
 * /api/feedback/analytics:
 *   get:
 *     summary: Get feedback analytics
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: form_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Form ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by response date (start)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by response date (end)
 *     responses:
 *       200:
 *         description: Feedback analytics data
 *       400:
 *         description: Form ID is required
 *       404:
 *         description: Form not found
 *       500:
 *         description: Server error
 */
router.get(
  '/analytics',
  authenticateJWT,
  authorizeRoles(['admin', 'manager']),
  FeedbackController.getAnalytics
);

module.exports = router; 