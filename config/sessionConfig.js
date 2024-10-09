import session from 'express-session';

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Use `secure: true` if serving over HTTPS
});

