import rl from "express-rate-limit";

export const globalLimit = rl({
    windowMs: 10 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({
            message: "too many attempt, please try again later",
        });
    },
});

export const AuthLimit = rl({
    windowMs: 10 * 24 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({
            message: "too many login attempt, please try again later",
        });
    },
});
