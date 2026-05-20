import express, { Request, Response, NextFunction } from "express";
import auth from "../utils/middleware.ts";
import z from "zod";
import { AppError } from "../utils/error.ts";
import prisma from "../utils/prisma.ts";

const router = express.Router();

const schema = z.object({
    text: z.string().min(1).max(1000),
});

router.post(
    "/",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        const parse = schema.safeParse(req.body);
        if (!parse.success) return next(new AppError("invalid post", 400));

        const { text } = parse.data;

        const user = await prisma.user.findUnique({
            where: { id: res.locals.id },
        });

        if (!user) return next(new AppError("invalid user ops", 400));

        const created = await prisma.post.create({
            data: {
                text,
                authorId: res.locals.id,
            },
        });

        res.json({ msg: "post created", post: created });
    },
);

router.delete(
    "/:id",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) return next(new AppError("invalid id", 400));

        const exist = await prisma.post.findUnique({
            where: { id },
        });

        if (!exist) return next(new AppError("post not found", 404));

        if (Number(exist.authorId) !== res.locals.id) {
            return next(new AppError("invalid action", 403));
        }

        await prisma.post.delete({
            where: { id },
        });

        res.json({ msg: "post deleted" });
    },
);

router.patch(
    "/:id",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        const parse = schema.safeParse(req.body);
        if (!parse.success) return next(new AppError("invalid input", 400));

        const id = Number(req.params.id);
        if (Number.isNaN(id)) return next(new AppError("invalid id", 400));

        const { text } = parse.data;

        const exist = await prisma.post.findUnique({
            where: { id },
        });

        if (!exist) return next(new AppError("post not found", 404));

        if (Number(exist.authorId) !== res.locals.id) {
            return next(new AppError("invalid action", 403));
        }

        await prisma.post.update({
            where: { id },
            data: { text },
        });

        res.json({ msg: "post updated" });
    },
);

export default router;
