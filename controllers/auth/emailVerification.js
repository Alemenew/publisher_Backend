// File: controllers/auth/emailVerification.js
import nodemailer from 'nodemailer';
import Users from '../../models/users.js';  // Ensure the correct path

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Function to send a verification code to the user's email

// In your emailVerification controller


// Function to check if an email exists in the database
export const checkEmailExists = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Users.findOne({ email: email });
    if (user) {
      return res.status(200).json({ exists: true });
    }
    return res.status(200).json({ exists: false });
  } catch (error) {
    console.error("Error checking email existence:", error);
    res.status(500).send("Internal server error");
  }
};



export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  try {
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expirationTime = new Date(Date.now() + 15 * 60000);

    const user = await Users.findOneAndUpdate(
      { email: email },
      {
        verificationCode: verificationCode,
        codeExpiration: expirationTime,
        isVerified: false
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).send('User not found');
    }



    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Email Verification Code: ${verificationCode}`,
      html: `
    
<div style="font-family: Roboto, Arial, sans-serif; color: #202124; line-height: 1.5;">
  <!-- Logo Section -->

  <!-- Main Content Section -->
  <table style="width: 100%; max-width: 600px; margin: auto; border-collapse: collapse;">
    <!-- Header Section -->
    <tr>
      <td style="text-align: center; padding: 20px;">
        <img src="cid:aiqemLogo" alt="Aiqem Logo" style="max-width: 150px; height: auto;">
        <h2 style="color: #202124; font-size: 24px; font-weight: 400; padding-top: 24px;">Verify Your Email</h2>
      </td>
    </tr>

    <!-- Verification Code Section -->
    <tr>
      <td style="padding: 20px; background-color: #ffffff; border: 1px solid #dadce0;">
        <p style="font-size: 16px; color: #202124;">
          Welcome to AiQEM AI & Blockchain Technology Solutions!</p>
        <p>To complete your registration, please use the verification code below:</p>
        <div style="text-align: center; background-color: #f1f3f4; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h1 style="color: #202124; font-size: 36px; font-weight: 400; margin: 0;">${verificationCode}</h1>
        </div>
        <p style="font-size: 16px; color: #202124;">
          Please enter this code within the next 15 minutes to verify your account.
        </p>
        <p style="font-size: 16px; color: #202124;">
          If you don’t recognize <span style="font-weight: bold; color: #202124;"> ${email.split('@')[0]}&#8203;@${email.split('@')[1].split('.').join('&#8203;.')} </span>, you can safely ignore this email.
        </p>
        <p style="font-size: 16px; color: #5f6368;">Thank you,</p>
        <p style="font-size: 16px; color: #5f6368;">The AiQEM Team</p>
      </td>
    </tr>

    <!-- Footer Section -->
    <tr>
      <td style="text-align: center; padding: 10px; background-color: #f1f3f4; font-size: 12px; color: #5f6368;">
        <p>You received this email because you signed up for AiQEM AI & Blockchain Technology Solutions.</p>
        <p>If you have any questions, feel free to contact us at 
          <a href="mailto:${process.env.EMAIL_USER}" style="color: #1a73e8; text-decoration: none;">${process.env.EMAIL_USER}</a>.
        </p>
      </td>
    </tr>
  </table>
</div>

`
      ,

      attachments: [
        {
          filename: 'aiqem_logo2.svg',
          path: path.join(__dirname, './aiqem2.png'), // Adjust path
          cid: 'aiqemLogo' // same cid as in the img tag
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send('Verification code sent successfully!');
  } catch (error) {
    res.status(500).send('Error sending verification code: ' + error.message);
  }
};

// Function to verify the email code provided by the user
export const verifyEmailCode = async (req, res) => {
  const { email, verificationCode } = req.body;

  try {
    const user = await Users.findOne({ email: email });
    console.log(user, "users new");
    if (!user) {
      return res.status(404).send('User not found');
    }

    if (user.verificationCode === verificationCode) {
      console.log(user.codeExpiration, Date.now(), "users new");
      if (user.codeExpiration > Date.now()) {
        user.isVerified = true;
        user.verificationCode = null;
        user.codeExpiration = null;
        await user.save();
        return res.status(200).send('Email verified successfully!');
      } else {
        return res.status(400).send('Verification code has expired.');
      }
    } else {
      return res.status(400).send('Invalid verification code.');
    }
  } catch (error) {
    res.status(500).send('Error verifying code: ' + error.message);
  }
};

