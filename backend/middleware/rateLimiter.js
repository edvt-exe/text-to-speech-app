/**
 * Rate Limiter Middleware
 * 
 * WHY: Protects the TTS API from abuse and excessive API calls to external services
 * (node-gtts calls cost bandwidth and processing). By limiting per-IP, we ensure fair
 * usage across all clients while preventing single users from overwhelming the service.
 */

const rateLimit = require('express-rate-limit');

// Create a rate limiter specifically for audio generation endpoint
// Config: 20 requests per hour per IP address
const audioGenerationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
    max: 20, // Max 20 requests per windowMs
    standardHeaders: false, // Disable `RateLimit-*` headers to manage custom response
    skip: (req, res) => {
        // WHY: Allow internal requests (e.g., health checks from docker) to bypass rate limiting
        // This prevents deployment monitoring tools from affecting rate limit quotas
        return req.headers['x-internal-check'] === 'true';
    },
    handler: (req, res, options) => {
        // Custom handler for rate limit exceeded
        // WHY: Return structured JSON instead of default HTML so frontend can display toast notifications
        res.status(options.statusCode).json({
            error: 'Too many audio generation requests',
            message: 'You have exceeded the limit of 20 requests per hour. Please try again later.',
            retryAfter: req.rateLimit.resetTime,
            code: 'RATE_LIMIT_EXCEEDED'
        });
    },
    keyGenerator: (req, res) => {
        // WHY: Use IP address or X-Forwarded-For header (for proxied/cloud deployments)
        // This ensures rate limiting works correctly even behind load balancers
        return req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
    }
});

module.exports = { audioGenerationLimiter };
