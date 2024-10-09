import cors from "cors";
import corsOptions from "../config/corsConfig.js";

const corsMiddleware = cors(corsOptions);


export default corsMiddleware;
