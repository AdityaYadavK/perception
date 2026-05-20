import express, { Request, Response, NextFunction } from "express";
import auth from "../utils/middleware.ts";
import z from "zod";
import { AppError } from "../utils/error.ts";
import prisma from "../utils/prisma.ts";

const router = express.Router();

const schema = z.object({
    text: z.string().min(1).max(1000),
    postId: z.number().int().positive(),
    parentId: z.number().int().positive().optional(),
});

const editSchema = z.object({
    text: z.string().min(1).max(1000),
});

// create a comment (or reply if parentId is provided)
router.post("/", auth, async (req: Request, res: Response, next: NextFunction) => {
    const parse = schema.safeParse(req.body);
    if (!parse.success) return next(new AppError("invalid input", 400));

    const { text, postId, parentId } = parse.data;

    const post = await prisma.post.findUnique({
        where: { id: postId },
    });
    if (!post) return next(new AppError("post not found", 404));

    // if parentId is provided, verify parent comment exists and belongs to same post
    if (parentId) {
        const parent = await prisma.comment.findUnique({
            where: { id: parentId },
        });
        if (!parent) return next(new AppError("parent comment not found", 404));
        if (parent.postId !== postId) return next(new AppError("invalid action", 400));
    }

    await prisma.comment.create({
        data: {
            text,
            postId,
            authorId: res.locals.id,
            parentId: parentId ?? null,
        },
    });

    res.json({ msg: "comment created" });
});

// get all top-level comments for a post (with replies)
router.get("/:postId", auth, async (req: Request, res: Response, next: NextFunction) => {
    const postId = Number(req.params.postId);
    if (Number.isNaN(postId)) return next(new AppError("invalid id", 400));

    const post = await prisma.post.findUnique({
        where: { id: postId },
    });
    if (!post) return next(new AppError("post not found", 404));

    const comments = await prisma.comment.findMany({
        where: {
            postId,
            parentId: null, // only top-level comments
        },
        include: {
            author: {
                select: { id: true, username: true },
            },
            replies: {
                include: {
                    author: {
                        select: { id: true, username: true },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    res.json({ comments });
});

// delete a comment
router.delete("/:id", auth, async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return next(new AppError("invalid id", 400));

    const exist = await prisma.comment.findUnique({
        where: { id },
    });
    if (!exist) return next(new AppError("comment not found", 404));

    if (Number(exist.authorId) !== res.locals.id) {
        return next(new AppError("invalid action", 403));
    }

    await prisma.comment.delete({
        where: { id },
    });

    res.json({ msg: "comment deleted" });
});

// edit a comment
router.patch("/:id", auth, async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return next(new AppError("invalid id", 400));

    const parse = editSchema.safeParse(req.body);
    if (!parse.success) return next(new AppError("invalid input", 400));

    const { text } = parse.data;

    const exist = await prisma.comment.findUnique({
        where: { id },
    });
    if (!exist) return next(new AppError("comment not found", 404));

    if (Number(exist.authorId) !== res.locals.id) {
        return next(new AppError("invalid action", 403));
    }

    await prisma.comment.update({
        where: { id },
        data: { text },
    });

    res.json({ msg: "comment updated" });
});

export default router;