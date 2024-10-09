import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js"
import { logStackTrace } from "../util.js"



// @desc    Test Request Body
// @route   POST /admin/test_request_body
// @access  Private
export const testRequestBody = asyncHandler(async (req, res) => {
  try{
    const body = req.body
    console.log(body)
    res.json(body)
  }catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})
