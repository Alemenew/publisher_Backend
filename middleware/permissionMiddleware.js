import { logStackTrace } from "../controllers/util.js";

const checkPermission = (permission, model) => {
  try {
    return function (req, res, next) {
      const userRole = req.auth.role;
      if(Object.keys(userRole.permissions).includes(model.toString().toLowerCase())){
        if (userRole && userRole.permissions[model].includes(permission)) {
          next(); // user has permission, continue to next middleware
        } else {
          res.status(401).json('Unauthorized'); // user does not have permission, send 403 Forbidden response
        }
      }
      else{
        res.status(401).json('Unauthorized');
      }
    };
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
}

export default checkPermission