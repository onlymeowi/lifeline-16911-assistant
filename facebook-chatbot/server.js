const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const moment = require('moment');
const User = require('./models/User'); // You'll create this model later
const sendOTP = require('./config/mailer'); // You'll create this later
const helmet = require('helmet');  // Make sure helmet is imported
const cors = require('cors');
const app = express();

app.use(bodyParser.json());
app.use(cors());

// Endpoint for Facebook Messenger webhook verification
app.get('/webhook', (req, res) => {
    // Your webhook verification logic here
  
    // 1. Get the 'hub.mode', 'hub.verify_token', and 'hub.challenge' parameters from the query string
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
  
    // 2. Check if the mode and token match your app's settings
    const VERIFY_TOKEN = 'YOUR_VERIFY_TOKEN'; // Replace with your actual verify token
  
    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        // 3. If they match, respond with the challenge parameter
        console.log('Webhook verified!');
        res.status(200).send(challenge);
      } else {
        // 4. If they don't match, respond with a 403 Forbidden status code
        res.sendStatus(403);
      }
    }
  });
app.use(helmet());
// Endpoint to handle incoming Facebook Messenger messages
app.post('/webhook', async (req, res) => {
    try {
        const { message } = req.body.entry[0].messaging[0];
        const senderId = message.sender.id;

        // Check if the user exists in the database
        let user = await User.findOne({ facebookId: senderId });

        if (!user) {
            // User not found, start signup process
            if (message.text.toLowerCase() === 'signup') {
                // Generate OTP, store it with temporary user data
                const otp = crypto.randomInt(100000, 999999).toString();
                const otpExpires = moment().add(5, 'minutes').toDate();
                const tempUser = {
                    facebookId: senderId,
                    otp,
                    otpExpires,
                    state: 'signup_otp', // Track signup state
                };
                await User.create(tempUser); // Store temporary user data

                // Send OTP to the user via email (you'll need to get their email)
                // ... Logic to get the user's email (e.g., ask them in the chat)
                // await sendOTP(email, otp);

                // Respond with instructions
                sendFacebookMessage(senderId, 'Enter the OTP sent to your email:');
            } else {
                // Prompt the user to sign up
                sendFacebookMessage(senderId, 'You need to sign up first. Type "signup" to begin.');
            }
        } else if (user.state === 'signup_otp') {
            // User is in the OTP verification stage of signup
            if (user.otp === message.text && user.otpExpires > new Date()) {
                // Correct OTP, complete signup
                user.state = 'signed_up'; // Update user state
                await user.save();
                sendFacebookMessage(senderId, 'Signup successful! You can now log in.');
            } else {
                // Incorrect or expired OTP
                sendFacebookMessage(senderId, 'Invalid or expired OTP. Please try again.');
            }
        } else {
            // User exists and is signed up, proceed with login or other actions
            if (message.text.toLowerCase() === 'login') {
                // Your login logic here
                sendFacebookMessage(senderId, 'Login successful!');
            } else {
                // Handle other commands or messages
                sendFacebookMessage(senderId, 'Hello, how can I help you?');
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error handling message:', error);
        res.status(500).send('Error');
    }
});

// Function to send messages back to Facebook Messenger
function sendFacebookMessage(senderId, messageText) {
    // Your logic to send messages using the Facebook Graph API\
    const accessToken = 'EAAXMhB9dIfUBO9B5po74Op87HOFCw4dsW5EOXswnZCyIvjNgODwFJ9DUD5RWpeZBu2K2olcmgjg1S4FsjZB9XGl9QKRS4HZBzUQm8xhTzbyjAP73lLX9S4BX1y0LaG09F4Ium27ip32ZA5GifuvTPPDgXrvZB23nIl8zRe4bCKputrr7T5ZBcFmKXA8f51smSs2OQZDZD'; // Replace with your actual token

  const requestBody = {
    recipient: { id: senderId },
    message: { text: messageText },
  };

  request({
    uri: 'https://graph.facebook.com/v17.0/me/messages',
    qs: { access_token: accessToken },
    method: 'POST',
    json: requestBody,
  }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      console.log('Message sent successfully!');
    } else {
      console.error('Error sending message:', error);
    }
  });
}

const port = process.env.PORT || 5000; // Change 3000 to 5000 or any other available port

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});