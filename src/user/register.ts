import express, { Request, Response, NextFunction } from "express";
import z from "zod";
import { prisma } from "../utils/prisma.js";
import bcrypt from "bcrypt";
import { AppError } from "../utils/error.ts";
import { validate } from "../utils/validate.ts";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    validate(req.body);

    const { username, email, password } = req.body;

    const exist = await prisma.user.findUnique({
        where: {
            username: username,
        },
    });
    if (exist) return next(new AppError("username taken", 400));

    const hashed = await bcrypt.hash(password, 11);
    if (!hashed) return next(new AppError("password hashing failed", 400));

    const user = await prisma.user.create({
        data: {
            username: username,
            email: email,
            password: hashed,
        },
    });
    const token = jwt.sign({ id: user.id }, "process.env.JWT_SECRET", {
        expiresIn: "30d",
    });
    if (!user) return next(new AppError("internal database error", 500));
    res.cookie("token", token, {
        httpOnly: true, //stops js from reading the token
        secure: false, //cookie is sent over https, false in development
        sameSite: "strict", //controls across site
        maxAge: 30 * 24 * 60 * 60 * 1000, //or use expires
        path: "/", //controls url path
        signed: true, //prevents tampering
    }).json({
        msg: "user created",
    });
});

export default router;
