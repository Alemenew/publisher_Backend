import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role, roleSchemaDescription } from "../models/auth/auth.js";
/**
 * Handles user login by verifying email and password and then generating a JWT.
 * 
 * @param {Object} req - The request object from Express.js containing user data.
 * @param {Object} res - The response object from Express.js used to send back the HTTP response.
 */
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Attempt to find a user by their email.
    const user = await Auth.findOne({ email });
    if (!user) {
      // If no user is found, send a 404 error response.
      return res.status(404).json({ message: "User not found." });
    }

    // Use bcrypt to compare the submitted password with the hashed password stored in the database.
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // If the password does not match, send a 401 error response.
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate a JWT token using the user's ID and email.
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }  // Specifies that the token will expire in one hour.
    );

    // Send a success response including the token and user details.
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role  // Optionally include the user's role if relevant.
      }
    });
  } catch (error) {
    // Log the error and send a 500 error response if an exception occurs.
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default loginUser;

