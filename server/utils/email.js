const nodemailer = require('nodemailer');

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const tx = getTransporter();
  return tx.sendMail({
    from: `"CampusBazaar" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html
  });
}

async function sendOtpEmail(to, otp) {
  return sendEmail({
    to,
    subject: 'Verify your CampusBazaar account',
    text: `Your OTP is ${otp}. It expires in 15 minutes.`,
    html: `<div style="font-family:sans-serif;padding:24px">
      <h2>Welcome to CampusBazaar 🎓</h2>
      <p>Your verification code is:</p>
      <div style="font-size:28px;font-weight:bold;letter-spacing:6px;margin:16px 0">${otp}</div>
      <p style="color:#666">Expires in 15 minutes. Ignore this email if you didn't sign up.</p>
    </div>`
  });
}

module.exports = { sendEmail, sendOtpEmail };
