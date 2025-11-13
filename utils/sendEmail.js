const emailQueue = require('./emailQueue');

const sendVerificationEmailAsync = (email, verificationToken) => {
  const message = `
Hello,

Welcome to VacQ - Your Massage Reservation System!

To complete your registration, please use the verification code below:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Verification Code: ${verificationToken}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏰ This code will expire in 10 minutes.
🔒 For your security, do not share this code with anyone.

If you didn't create an account with VacQ, please ignore this email.

Best regards,
VacQ Team
  `;

  emailQueue.addToQueue({
    email: email,
    subject: '🔐 VacQ - Email Verification Code',
    message: message,
  });
};

module.exports = {
  sendVerificationEmailAsync,
};
