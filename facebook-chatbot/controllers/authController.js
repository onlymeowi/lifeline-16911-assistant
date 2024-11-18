// controllers/authController.js
const User = require('../models/User');
const sendOTP = require('../config/mailer');
const generateOTP = require('../utils/otpGenerator');
const moment = require('moment');

exports.sendOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const otp = generateOTP();
    const otpExpires = moment().add(5, 'minutes').toDate();

    const user = await User.findOneAndUpdate(
      { email },
      { otp, otpExpires },
      { new: true, upsert: true }
    );

    await sendOTP(email, otp);

    res.status(200).json({ message: 'OTP sent successfully!' });
  } catch (err) {
    next(err); 
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    res.status(200).json({ message: 'OTP verified successfully!' });
  } catch (err) {
    next(err); 
  }
};