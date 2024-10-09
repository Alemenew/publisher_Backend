import mongoose from "mongoose";

const googleOAuthSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  }, // Google user ID
  email: {
    type: String,
    required: true,
    unique: true
  }, // User's email
  access_token: String,
  refresh_token: String,
  token_expiry: Date,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auth'
  } // Link to the main Auth schema
}, {
  timestamps: true
});

const GoogleOAuth = mongoose.model("GoogleOAuth", googleOAuthSchema);
export default GoogleOAuth;

