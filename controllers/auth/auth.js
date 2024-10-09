import jwt from "jsonwebtoken"
import bcrypt from 'bcrypt'
import Auth, { authSchemaDescription, requiredRegistrationAuthSchemaObject, requiredAuthSchemaObject, Role } from "../../models/auth/auth.js";
import { checkEmptyString, checkIntersection, logStackTrace, returnErrorMessage } from "../util.js";
import logger from "../../logger/logger.js";
import asyncHandler from "express-async-handler"


export const registerAuth = asyncHandler(async (req, res) => {
  try {
    const data = req.body;
    let dataSet = new Set(Object.keys(data));
    let schemaSet = new Set(Object.keys(requiredRegistrationAuthSchemaObject));
    const intersection = checkIntersection(schemaSet, dataSet);

    if ([...intersection].length === [...schemaSet].length) {
      let isEmpty = checkEmptyString(data);
      if (isEmpty === null) {
        // Check if email already exists
        const existingUser = await Users.findOne({ email: data.email });
        if (existingUser) {
          logger.error('Email is already taken');
          return res.status(400).json({ message: 'Email is already taken' });
        }

        const _role = await Role.findOne({ name: data.role.toString().toLowerCase() });
        if (_role !== null) {
          const _auth = await Auth.findOne({ username: data.username });
          if (_auth === null) {
            const salt = await bcrypt.genSalt(10);
            data.password = await bcrypt.hash(data.password, salt);
            data.role = _role.id;

            const newAuth = new Auth(data);
            await newAuth.save();
            res.status(201).json(newAuth);
          } else {
            logger.error('Username already taken');
            res.status(400).send('Username already taken');
          }
        } else {
          logger.error("Role doesn't exist.");
          res.status(400).send("Role doesn't exist.");
        }
      } else {
        logger.error(`${isEmpty} cannot be empty`);
        res.status(400).send(`${isEmpty} cannot be empty`);
      }
    } else {
      let message = returnErrorMessage(Object.keys(requiredRegistrationAuthSchemaObject), dataSet, authSchemaDescription);
      logger.error(message);
      res.status(400).send(message);
    }
  } catch (error) {
    logger.error(error.message);
    logStackTrace(error.stack);
    res.status(500).json({ message: error.message });
  }
});



// @desc    Login
// @route   POST /auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  try {
    const data = req.body;
    let dataSet = new Set(Object.keys(data))
    let schemaSet = new Set(Object.keys(requiredAuthSchemaObject))
    const intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length === [...schemaSet].length) {
      let isEmpty = checkEmptyString(data)
      if (isEmpty === null) {
        const _auth = await Auth.findOne({ username: data.username })
        if (_auth !== null) {
          const isMatch = await _auth.comparePassword(data.password)
          if (isMatch) {
            _auth.last_login = new Date()
            _auth.save()
            const token = jwt.sign({ id: _auth._id }, process.env.JWT_SECRET, {
              expiresIn: process.env.JWT_EXPIRATION_TIME
            })
            res.json({
              message: 'Authenticated successfully',
              username: _auth.username,
              "last_login": _auth.last_login,
              token
            })
          } else {
            logger.error('Invalid credentials')
            res.status(401).send('Invalid credentials');
          }
        } else {
          logger.error("user not found")
          res.status(400).send("user not found")
        }
      } else {
        logger.error(`${isEmpty} can not be empty`)
        res.status(400).send(`${isEmpty} can not be empty`)
      }
    } else {
      let message = returnErrorMessage(Object.keys(requiredAuthSchemaObject), dataSet, authSchemaDescription)
      logger.error(message)
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Get AuhUsers
// @route   GET /auth
// @access  Private
export const getAuthUsers = asyncHandler(async (req, res) => {
  try {
    const authUsers = await Auth.find({}, '-password').populate('role')
    res.json(authUsers)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get AuhUser
// @route   GET /auth/:username
// @access  Private
export const getAuthUser = asyncHandler(async (req, res) => {
  try {
    const { username: username } = req.params

    const _authUser = await Auth.findOne({ username }, '-password').populate('role')
    if (_authUser) {
      res.json(_authUser)
    } else {
      logger.error("User not found")
      return res.status(404).send("User not found")
    }

  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Test JWT token
// @route   GET /auth/test_auth
// @access  Private
export const testAuthToken = asyncHandler(async (req, res, next) => {
  try {
    res.json({ success: true })
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// export const authenticate = asyncHandler(async (req, res, next) => {
//   try {
//     const token = req.header("x-auth-token");
//     // console.log(`TOKEN: ${token}`)
//     if (!token) {
//       logger.error("No authentication token, access denied")
//       return res.status(401).send("No authentication token, access denied")
//     }
//     const verified = jwt.verify(token, process.env.JWT_SECRET);
//     if (!verified) {
//       logger.error("Token verification failed, authorization denied")
//       return res.status(401).send("Token verification failed, authorization denied")
//     }
//     req.user = verified.id
//     logger.info(`USER: ${verified.id}`)
//     next()
//   } catch (error) {
//     logger.error(error.message)
//     if (error instanceof TokenExpiredError) {
//       return res.status(403).json({ message: "Token expired!" })
//     }
//     logStackTrace(error.stack)
//     res.status(500).json({ message: error.message })
//   }
// })
