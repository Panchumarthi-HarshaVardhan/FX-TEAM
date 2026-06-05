require('dotenv').config();
const sendEmail = require('./utils/mailer');

async function testEmail() {
  console.log('Testing email dispatch using:', process.env.EMAIL_USER);
  const success = await sendEmail({
    email: 'vu.241fa04e91@gmail.com', // Their test email from earlier
    subject: 'Test OTP - FounderX',
    html: '<h1>123456</h1><p>Test OTP</p>'
  });
  console.log('Email sending result:', success);
}

testEmail();
