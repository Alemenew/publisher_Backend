import jwt from "jsonwebtoken"
import pkg from 'jsonwebtoken';
import asyncHandler from "express-async-handler"
import { logStackTrace } from "../controllers/util.js";
import logger from "../logger/logger.js";
import Auth from "../models/auth/auth.js";


const { TokenExpiredError } = pkg;

const authenticate = asyncHandler(async (req, res, next) => {
  try {
    const token = req.header("x-auth-token");
    console.log(`TOKEN: ${token}`)
    if (!token) {
      logger.error("No authentication token, access denied")
      return res.status(401).send("No authentication token, access denied")
    }
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) {
      logger.error("Token verification failed, authorization denied")
      return res.status(401).send("Token verification failed, authorization denied")
    }
    let _auth = await Auth.findOne({ _id: verified.id }).populate('role')
    if (_auth !== null) {
      req.auth = _auth
      next()
      logger.info(`USER: ${verified.id}`)
    } else {
      return res.status(401).send("User not found, authorization denied")
    }
  } catch (error) {
    logger.error(error.message)
    if (error instanceof TokenExpiredError) {
      return res.status(403).json("Token expired!")
    }
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})
export default authenticate