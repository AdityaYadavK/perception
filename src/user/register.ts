import express, { Request, Response, NextFunction } from "express";
import z from "zod";
import { prisma } from "../utils/prisma.js";
import bcrypt from "bcrypt";
import { AppError } from "../utils/error.ts";

const schema = z.object({
    username: z.string().min(4),
    email: z.email(),
    password: z.string().min(6).max(10),
});

const router = express.Router();

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    console.log("register path");

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return next(new AppError("parsing failed", 400));

    const { username, email, password } = parsed.data;
    const hashed = await bcrypt.hash(password, 11);
    if (!hashed) return next(new AppError("password hashing failed", 400));

    const user = await prisma.user.create({
        data: {
            username: username,
            email: email,
            password: hashed,
        },
    });
    if (!user) return next(new AppError("internal database error", 500));
    res.json({
        msg: "user created",
    });
});
