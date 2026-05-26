import type { Request, Response, NextFunction } from "express";

const ehandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode =
        typeof err?.statusCode === "number" && err.statusCode >= 400 && err.statusCode <= 599
            ? err.statusCode
            : 500;
    const message = typeof err?.message === "string" ? err.message : "Internal Server Error";
    res.status(statusCode).json({ msg: message });
};

export default ehandler;
