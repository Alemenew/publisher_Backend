import nodemailer from 'nodemailer';

const sendVerificationEmail = async (email, code) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Verification Code',
    text: `Your verification code is ${code}. It will expire in 5 minutes.`,
  });
};

export default sendVerificationEmail;

