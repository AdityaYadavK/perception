import express, { Request, Response, NextFunction } from "express";
import z from "zod";
import { AppError } from "../utils/error.ts";
import prisma from "../utils/prisma.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

const schema = z.object({
    email: z.email(),
    password: z.string().min(6).max(12),
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return next(new AppError("input parse fail", 400));

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });
    if (!user) return next(new AppError("invalid username", 400));
    const check = bcrypt.compare(password, user.password);
    
    if (!check) return next(new AppError("incorrect password", 400));

    const token = jwt.sign({ id: user.id }, "process.env.JWT_SECRET", {
        expiresIn: "30d",
    });

    if (!token) return next(new AppError("internal error", 500));

    res.cookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: false,
        path: "/",
        signed: true,
    }).json({
        msg: "login success!",
    });
});

export default router;
