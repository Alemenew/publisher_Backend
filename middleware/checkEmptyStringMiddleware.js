import asyncHandler from "express-async-handler"
import logger from "../logger/logger.js"
import { logStackTrace } from "../controllers/util.js"


const checkEmptyString = asyncHandler(async (req, res, next) => {
  try {
    let data = req.body
    let keys = Object.keys(data)
    for (let i = 0; i < keys.length; i++) {
      if (Array.isArray(data[keys[i]])) {
        const filteredList = data[keys[i]].filter(function (value) {
          return value !== "";
        });
        if (filteredList.length !== data[keys[i]].length) {
          let message = `Empty value detected in ${keys[i]}, can not be empty.`
          logger.error(message)
          return res.status(400).send(message)
        }
      }
      else if (data[keys[i]].toString().trim().length == 0) {
        let message = `${keys[i]} can not be empty.`
        logger.error(message)
        return res.status(400).send(message)
      }
    }
    next()
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

export default checkEmptyString