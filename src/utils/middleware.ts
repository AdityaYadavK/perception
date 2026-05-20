import express, { Request, Response, NextFunction } from "express";
import { AppError } from "./error.ts";
import jwt, { JwtPayload } from "jsonwebtoken";

interface UserPayload extends JwtPayload {
    id: string;
    email: string;
}

const mid = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token;
    if (!token) return next(new AppError("sign in again", 400));

    try {
        const user = jwt.verify(token, "process.env.JWT_SECRET");
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
