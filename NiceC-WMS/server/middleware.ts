import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'NiceC-WMS-Secret-Token-Key-2026!');
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required in production.');
  process.exit(1);
}

export function getCurrentUser(req: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export function requireAuth(req: any, res: any, next: any) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Please login first.' });
  }
  req.user = user;
  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Please login first.' });
    }
    const userRole = (req.user.role || '').toUpperCase();
    const hasRole = allowedRoles.some(r => r.toUpperCase() === userRole);
    if (!hasRole) {
      return res.status(403).json({ error: `Forbidden. Role '${req.user.role}' does not have permission.` });
    }
    next();
  };
}

export function requireCustomerAccess(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. Please login first.' });
  }
  const role = (req.user.role || '').toUpperCase();
  if (role === 'CLIENT' || role === 'CUSTOMER') {
    const targetCustomerId = req.params.customerId || req.params.id || req.query.customerId || req.body.customerId;
    if (targetCustomerId && req.user.customerId && targetCustomerId !== req.user.customerId) {
      return res.status(403).json({ error: "Forbidden. You do not have access to this customer's data." });
    }
  }
  next();
}

const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim());

export function helmetConfig() {
  // Production: enable CSP with relaxed rules for React inline styles.
  // Dev: disable CSP for hot-reload compatibility.
  return helmet({
    contentSecurityPolicy: isProduction ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", ...(process.env.API_BASE_URL ? [process.env.API_BASE_URL] : [])],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    } : false,
    crossOriginEmbedderPolicy: false,
  });
}

export function compressionMiddleware() {
  return compression();
}

export function requestIdMiddleware() {
  return (req: any, res: any, next: any) => {
    req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
    res.setHeader('X-Request-Id', req.requestId);
    next();
  };
}

export function corsMiddleware() {
  return (req: any, res: any, next: any) => {
    const origin = req.headers.origin;
    if (isProduction) {
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else if (origin) {
        // Origin not allowed; do not set ACAO header (browser will reject)
        return res.status(403).json({ success: false, error: { code: 'CORS_ERROR', message: 'Origin not allowed' } });
      }
      // No origin header (server-to-server or curl) — allow
    } else {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  };
}

export function generalRateLimit() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
  });
}

export function authRateLimit() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts, please try again later.' } },
  });
}

export function errorHandler(err: any, req: any, res: any, next: any) {
  console.error(`[${req.requestId || ''}] Error:`, err);
  
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.errors || err.issues,
      },
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const response: any = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: isProduction && statusCode === 500 ? 'Internal server error' : (err.message || 'Internal server error'),
    },
  };

  if (!isProduction && statusCode === 500) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

export function notFoundHandler(req: any, res: any) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`,
    },
  });
}
