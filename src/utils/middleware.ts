import express, { Request, Response, NextFunction } from "express";
import { AppError } from "./error.js";
import jwt, { JwtPayload } from "jsonwebtoken";

interface UserPayload extends JwtPayload {
    id: number;
}

const mid = (req: Request, res: Response, next: NextFunction) => {
    const token = req.signedCookies?.token ?? req.cookies?.token;
    if (!token) return next(new AppError("sign in again", 400));
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return next(new AppError("JWT_SECRET is not set", 500));

    try {
        const user = jwt.verify(token, jwtSecret) as UserPayload;
        if (!user) return next(new AppError("invalid token", 400));

        if (typeof user === "string") {
            return next(new AppError("something went wrong", 500));
        }

        res.locals.id = user.id;
        // locals is used to pass value in middleware

        next();
    } catch (e) {
        return next(new AppError(`${e}`, 500));
    }
};

export default mid;
