import rl from "express-rate-limit";

export const globalLimit = rl({
    windowMs: 10 * 60 * 1000,
    limit: 10000000,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res, _next, options) => {
        res.status(options.statusCode).json({
            message: "Fetch Limit Exceeded",
        });
    },
});

export const AuthLimit = rl({
    windowMs: 10 * 24 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res, _next, options) => {
        res.status(options.statusCode).json({
            message: "Login Limit Exceeded",
        });
    },
});
