import express, { Request, Response, NextFunction } from "express";

const ehandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode;
    const status = err.status;
    res.status(statusCode).json({ msg: err.message });
};

export default ehandler;

