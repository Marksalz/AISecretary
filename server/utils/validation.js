import { body, validationResult } from 'express-validator';

/**
 * Validation rules for chat messages
 */
export const validateMessage = [
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 3 }).withMessage('Message must be at least 3 characters long')
];

/**
 * Validation rules for event data
 * @param {Object} event - The event data to validate
 * @returns {Object} Validation result with error and value
 */
export const validateEvent = (event) => {
  const errors = [];
  
  if (!event.title || typeof event.title !== 'string' || event.title.trim().length === 0) {
    errors.push('Event title is required');
  }
  
  if (!event.start || !isValidDate(event.start)) {
    errors.push('Valid start date is required');
  }
  
  if (!event.end || !isValidDate(event.end)) {
    errors.push('Valid end date is required');
  }
  
  if (event.start && event.end && new Date(event.start) >= new Date(event.end)) {
    errors.push('End date must be after start date');
  }
  
  return {
    error: errors.length > 0 ? new Error(errors.join(', ')) : null,
    value: event
  };
};

/**
 * Check if a string is a valid date
 * @param {string} dateString - The date string to validate
 * @returns {boolean} True if valid date
 */
function isValidDate(dateString) {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Middleware to handle validation errors
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        param: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

export default {
  validateMessage,
  validateEvent,
  validate
};
