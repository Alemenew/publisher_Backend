import mongoose from "mongoose"
import Users, { requiredUserSchemaObject as userSchemaObject, usersSchemaDescription } from "../models/users.js"
import { checkIntersection, logStackTrace, returnErrorMessage } from "./util.js"
import logger from "../logger/logger.js"
import asyncHandler from "express-async-handler"
import IndividualBot from "../models/admin/individualBots.js"
import Channel from "../models/channel.js"
import ConversionBots from "../models/campaigns/conversionBots.js";
import ConversionBot from "../models/campaigns/conversionBots.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// @desc    Get Users
// @route   GET /users
// @access  Private
export const getUsers = asyncHandler(async (req, res) => {
  try {
    const users = await Users.find()
    res.status(200).json(users)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

export const checkemail = asyncHandler(async (req, res) => {
  try {
    const users = await Users.find({ "email": req.body.email })
    if (users.length === 0) {
      logger.error("No user found")
      return res.status(200).json({ success: false })
    }
    else {
      res.status(200).json({ success: true })
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Create User
// @route   POST /users
// @access  Private
export const createUser = asyncHandler(async (req, res) => {
  try {
    // console.log(req.body, "b####################")
    const user = req.body
    let userSet = new Set(Object.keys(user))
    let schemaSet = new Set(Object.keys(userSchemaObject))
    const intersection = checkIntersection(schemaSet, userSet)
    if ([...intersection].length == [...schemaSet].length) {
      // const _user = await Users.findOne({ $or: [{ 'email': user.email }, { 'phone_number': user.phone_number }], 'type': 'channel_owner' });
      const _user = await Users.findOne({ 'id': user.id });

      if (_user === null) {
        if (user.bot_id !== undefined) {
          const _bot = await IndividualBot.findOne({ "token": user.bot_id })
          if (_bot !== null) {
            user.bot_id = _bot._id
          } else {
            const _bot = await ConversionBot.findOne({ "token": user.bot_id })
            if (_bot !== null) {
              user.bot_id = _bot._id
            }
            else {
              logger.error("bot not found.");
              return res.status(400).send("bot not found.")
            }
          }
        }
        const newUser = new Users(user)
        await newUser.save()

        if (user.bot_id !== undefined) {
          let channelObj = {
            "id": user.id,
            "user_id": newUser._id,
            "is_individual": true,
            "is_active": true
          }
          const newChannel = new Channel(channelObj)
          await newChannel.save()
        }
        res.status(201).json(newUser)
      }
      else {
        let message = "Already Registered"
        // if (_user.phone_number === user.phone_number) {
        //   message = "Phone number already taken"
        // } else {
        //   message = "Email address already taken"
        // }
        logger.error(message);
        res.status(400).send(message)
      }
    }
    else {
      let message = returnErrorMessage(Object.keys(userSchemaObject), userSet, usersSchemaDescription)
      logger.error(message);
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(409).send(error.message)
  }
})


// Login function for existing users
export const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, id, password } = req.body;

    // Check if email, id or password are provided
    if (!email && !id) {
      return res.status(400).json({ message: "Email or ID is required" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // Find the user by either email or _id
    const user = await Users.findOne({ $or: [{ email }, { _id: id }] });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create a JWT token with the user’s unique _id
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    // Send the response with the token and user details
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,  // Unique identifier
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Log the successful login with user id and email
    console.log(`User Login Successful: User ID - ${user._id}, Email - ${user.email}, Timestamp - ${new Date().toISOString()}`);

  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).send("Server error");
  }
});




// @desc    Update User
// @route   PATCH /users
// @access  Private

export const updateUser = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    const user = req.body

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("No user with this ID");
      return res.status(404).send("No user with this ID")
    }

    const updatedUser = await Users.findByIdAndUpdate(_id, { ...user, _id }, { new: true })

    res.json(updatedUser)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(409).json({ message: error.message })
  }
})

// @desc    Get User
// @route   GET /users/:id (telegram user_id) not _id -> Mongodb objectID
// @access  Private
export const getUser = asyncHandler(async (req, res) => {
  try {
    const { id: id } = req.params

    const user = await Users.findOne({ 'id': id });

    if (user !== null) {
      res.json(user)
    }
    else {
      logger.error("User not found")
      return res.status(404).send("User not found")
    }


  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(409).json({ message: error.message })
  }
})




//TODO Implement this
export const deleteUser = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("No user with that ID")
      return res.status(404).send('No user with that ID')
    }

    await Users.findByIdAndRemove(_id)
    res.json({ message: "User deleted successfully" })
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get User Type
// @route   GET /users/get_user_type/:id (user_id(telegram_id))(not _id -> Mongodb objectID)
// @access  Private
export const getUserType = asyncHandler(async (req, res) => {
  try {
    const { id: user_id } = req.params
    const _user = await Users.findOne({ 'id': user_id })
    if (_user !== null) {
      res.json(_user)
    } else {
      logger.error("User not found")
      res.status(404).send("User not found")
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})
