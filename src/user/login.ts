import express, { Request, Response, NextFunction } from "express";
import z from "zod";
import { AppError } from "../utils/error.js";
import prisma from "../utils/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    throw new Error("JWT_SECRET is not set");
}

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(12),
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body)
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return next(new AppError("input parse fail", 400));

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });
    if (!user) return next(new AppError("invalid email", 400));
    const check = await bcrypt.compare(password, user.password);

    if (!check) return next(new AppError("incorrect password", 400));

    const token = jwt.sign({ id: user.id }, jwtSecret, {
        expiresIn: "30d",
    });

    if (!token) return next(new AppError("internal error", 500));

    console.log(token);
    res.cookie("token", token, {
        httpOnly: true, //JS cannot access
        sameSite: "lax", //CSRF protection
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: false,
        path: "/",
        signed: false,
    }).json({
        msg: "login success!",
    });
});

export default router;
