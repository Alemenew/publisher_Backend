// import mongoose from "mongoose";

// export const requiredUserSchemaObject = {
//   "name": String,
//   "id": Number,
//   
// }

// export const usersSchemaDescription = {
//   "name": "Name",
//   "id": "ID",
//   "phone_number": "Phone Number",
//   "email": "Email Address"
// }

// const userSchema = mongoose.Schema({
//   ...requiredUserSchemaObject, "auth_id":{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Auths'
//   },
//   "phone_number": Number,
//   "email": String,
//   "bot_id":  {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'IndividualBot'
//   },
//   "type": { type: String, enum: ['channel_owner', 'individual'], default: 'channel_owner' }
// },{
//   timestamps: true,
// })

// const Users = mongoose.model('Users', userSchema)
// export default Users
//

import mongoose from "mongoose";
import bcrypt from "bcrypt";
export const requiredUserSchemaObject = {
  name: String,
  id: Number,
};

export const usersSchemaDescription = {
  name: "Name",
  id: "ID",
  phone_number: "Phone Number",
  email: {
    type: String,
    unique: true, // Ensure the email is unique
    required: true, // Ensure the email is required
  },
  platforms: "Platforms",
  active_since: "Active Since",
};

const userSchema = mongoose.Schema(
  {
    ...requiredUserSchemaObject,
    auth_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auths",
    },
    phone_number: Number,
    email: String,
    password: {
      type: String,
      required: function () {
        return this.role === "publisher";
      }, // Password required only for publishers
    },
    bot_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IndividualBot",
    },
    type: {
      type: String,
      enum: ["channel_owner", "Publisher", "individual"],
      default: "channel_owner",
    },
    role: {
      type: String,
      enum: ["admin", "publisher", "user"], // Define roles here
      default: "publisher", // Set a default role if necessary
    },

    created_from: {
      type: String,
      enum: ["publisher_website", "admin", "backend", "user"], // Define roles here
      default: "user", // Set a default role if necessary
    },
    platforms: {
      type: [String],
      enum: ["telegram", "youtube", "tick-tock"], // Define the allowed platforms
    },
    active_since: {
      type: Date, // Store the date when the user became active
    },


    verificationCode: {
      type: String, // 4-digit verification code
    },
    codeExpiration: {
      type: Date, // Expiration time for the verification code
    },
    isVerified: {
      type: Boolean,
      default: false, // Initially, the user is not verified
    },

    youtubeAccessToken: {
      type: String,
      default: null, // Default to null or empty string initially
    },
    youtubeRefreshToken: {
      type: String,
      default: null, // Default to null initially
    },
    youtubeTokenExpiresIn: {
      type: Number,
      default: null, // Default to null initially
    },
    tiktokAccessToken: {
      type: String,
      default: null, // Default to null or empty string initially
    },
    tiktokRefreshToken: {
      type: String,
      default: null, // Default to null initially
    },
    tiktokTokenExpiresIn: {
      type: Date,
      default: null, // Default to null initially
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
const Users = mongoose.model("Users", userSchema);
export default Users;

