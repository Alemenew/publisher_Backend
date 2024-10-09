import logger from "../logger/logger.js"

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500

  if(process.env.NODE_ENV === 'development'){
    logger.error(err.stack)
  }
  res.status(statusCode)


  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  })
}

export default errorHandler