const nodemailer = require('nodemailer');

const sendOTP = async (email, otp, options = {}) => {
  try {
    const transporter = nodemailer.createTransport({
      service: options.service || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      html: `<p>Your OTP code is: <b>${otp}</b></p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully!');
  } catch (error) {
    console.error('Error sending OTP email:', error);
    // Consider throwing the error to be handled elsewhere:
    // throw error; 
  }
};

module.exports = sendOTP;