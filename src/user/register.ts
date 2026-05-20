import express, { Request, Response, NextFunction } from "express";
import z from "zod";
import prisma from "../utils/prisma.ts";
import bcrypt from "bcrypt";
import { AppError } from "../utils/error.ts";
import { validate } from "../utils/validate.ts";
import jwt from "jsonwebtoken";

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    throw new Error("JWT_SECRET is not set");
}

const schema = z.object({
    username: z.string().min(4).max(20),
    email: z.string().email(),
    password: z.string().min(6).max(12),
});

router.post(
    "/",
    validate(schema),
    async (req: Request, res: Response, next: NextFunction) => {
        const { username, email, password } = req.body;

        const exist = await prisma.user.findFirst({
            where: {
                OR: [{ username }, { email }],
            },
        });
        if (exist) {
            const message =
                exist.username === username ? "username taken" : "email taken";
            return next(new AppError(message, 400));
        }

        const hashed = await bcrypt.hash(password, 11);
        if (!hashed) return next(new AppError("password hashing failed", 400));

        const user = await prisma.user.create({
            data: {
                username: username,
                email: email,
                password: hashed,
            },
        });

        const token = jwt.sign({ id: user.id }, jwtSecret, {
            expiresIn: "30d",
        });

        res
            .cookie("token", token, {
                httpOnly: true, //stops js from reading the token
                secure: false, //cookie is sent over https, false in development
                sameSite: "strict", //controls across site
                maxAge: 30 * 24 * 60 * 60 * 1000, //or use expires
                path: "/", //controls url path
                signed: true, //prevents tampering
            })
            .json({
                msg: "user created",
            });
    },
);

export default router;
