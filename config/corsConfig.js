const allowedOrigins = [
  'https://redirect-uri-tan.vercel.app',
  'http://localhost:3000',
  'http://192.168.1.153:3000',
  'http://localhost:5173',
  'http://localhost:8000',
  'http://localhost:5001',
  'http://localhost:8001'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (origin === null || origin === undefined || origin === '') {
      return callback(null, true);
    }
    const matchedOrigin = allowedOrigins.find(allowedOrigin => origin.startsWith(allowedOrigin));
    if (matchedOrigin) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
};
export default corsOptions;

