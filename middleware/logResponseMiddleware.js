import path from 'path';

export const logResponseMiddleware = (req, res, next) => {
  const oldSend = res.send;

  res.send = function(data) {
    const fileName = path.basename(__filename); // Get current file name
    console.log(`[${fileName}] Response:`, data); // Log file name and response data
    oldSend.apply(res, arguments);
  };

  next();
};

