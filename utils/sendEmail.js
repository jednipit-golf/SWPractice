const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('Email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Email could not be sent');
  }
};

const sendVerificationEmail = async (email, verificationToken) => {
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

  await sendEmail({
    email: email,
    subject: '🔐 VacQ - Email Verification Code',
    message: message,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail
};
