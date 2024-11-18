const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    facebookId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    otp: String,
    otpExpires: Date,
    state: {
        type: String,
        enum: ['signup_otp', 'signed_up'], // Possible states
        default: 'signup_otp'
    }
});

module.exports = mongoose.model('User', userSchema);