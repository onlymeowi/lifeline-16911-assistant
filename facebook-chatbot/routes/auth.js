// routes/auth.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, 
  message: 'Too many OTP requests. Please try again later.',
});

router.post('/send-otp', otpLimiter, 
  [body('email').isEmail().withMessage('Invalid email format')],
  authController.sendOtp 
);

router.post('/verify-otp', 
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('otp').isNumeric().isLength({ min: 6, max: 6 }).withMessage('Invalid OTP'),
  ],
  authController.verifyOtp
);

module.exports = router;