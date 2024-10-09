import Users from "../../models/users.js";  // Ensure the correct path to your Users model
import bcrypt from "bcrypt";

// Controller function to check if an email exists in the database
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
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Controller function to create a new account
export const createAccount = async (req, res) => {
  const { email, password, phone_number, id, name, type, role, created_from, platforms } = req.body;

  try {
    // Step 1: Check if the email is already in use
    const existingUser = await Users.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ message: "This email address is already taken." });
    }

    // Step 2: Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 3: Create the new user
    const newUser = new Users({
      email,
      password: hashedPassword,
      phone_number,
      id,
      name,
      type,
      role,
      created_from,
      platforms,
    });

    await newUser.save();

    return res.status(201).json({
      message: "Account created successfully.",
      _id: newUser._id,  // Return the _id to the frontend
    });
  } catch (error) {
    console.error("Error creating account:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Controller function to handle email verification (optional)
export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Users.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate a verification code
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    user.verificationCode = verificationCode;
    user.codeExpiration = new Date(Date.now() + 15 * 60 * 1000);  // 15 minutes expiration
    await user.save();

    // Send verification code via email (using nodemailer, sendgrid, etc.)
    // Assume you have a sendMail utility function set up
    // await sendMail(user.email, "Your verification code", `Your verification code is: ${verificationCode}`);

    return res.status(200).json({ message: "Verification code sent successfully." });
  } catch (error) {
    console.error("Error sending verification code:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Controller function to verify the email code provided by the user
export const verifyEmailCode = async (req, res) => {
  const { email, verificationCode } = req.body;

  try {
    const user = await Users.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the provided verification code matches
    if (user.verificationCode === verificationCode && user.codeExpiration > new Date()) {
      user.isVerified = true;
      user.verificationCode = null;
      user.codeExpiration = null;
      await user.save();
      return res.status(200).json({ message: "Email verified successfully." });
    } else if (user.codeExpiration <= new Date()) {
      return res.status(400).json({ message: "Verification code has expired." });
    } else {
      return res.status(400).json({ message: "Invalid verification code." });
    }
  } catch (error) {
    console.error("Error verifying code:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

