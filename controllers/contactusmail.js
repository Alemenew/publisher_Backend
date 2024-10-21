// controllers/contactusmail.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

// Define and configure the Nodemailer transporter using environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Function to handle sending contact form emails
export const sendContactFormEmail = async (req, res) => {
  const { name, email, phoneNumber, message } = req.body;

  // Ensure that all required fields are provided
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required fields.' });
  }

  // Define the mail options for Nodemailer
  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender address (should match the authenticated user)
    to: process.env.RECIPIENT_EMAIL || 'recipient@example.com', // Recipient email address
    subject: `Contact Us Form Submission: ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #202124; line-height: 1.5;">
        <h2>Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone Number:</strong> ${phoneNumber}</p>
        <p><strong>Message:</strong></p>
        <div style="background-color: #f1f3f4; padding: 20px; border-radius: 8px;">
          <p>${message}</p>
        </div>
      </div>
    `
  };

  console.log('Mail Options:', mailOptions); // Log mail options for debugging

  try {
    // Send the email using the configured transporter
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info);
    res.status(200).json({ message: 'Message sent successfully!', info });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

