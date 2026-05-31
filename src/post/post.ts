import express, { Request, Response, NextFunction } from "express";
import auth from "../utils/middleware.js";
import z from "zod";
import { AppError } from "../utils/error.js";
import prisma from "../utils/prisma.js";

const router = express.Router();

const contentSchema = z.object({
    content: z.string().min(1).max(1000),
});

const textSchema = z.object({
    text: z.string().min(1).max(1000),
});

const schema = z.union([contentSchema, textSchema]);

const extractText = (data: z.infer<typeof schema>) =>
    "content" in data ? data.content : data.text;


// finds all post - never useful
router.get(
    "/",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const posts = await prisma.post.findMany({
                include: {
                    author: {
                        select: {
                            username: true,
                        },
                    },
                    comments: {
                        include: {
                            author: {
                                select: {
                                    username: true,
                                },
                            },
                        },
                        orderBy: {
                            createdAt: "asc",
                        },
                    },
                    _count: {
                        select: {
                            likes: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            const formattedPosts = posts.map((post) => ({
                id: String(post.id),
                author: post.author.username,
                content: post.text,
                timestamp: post.createdAt,
                likes: post._count.likes,
                comments: post.comments.map((comment) => ({
                    id: String(comment.id),
                    author: comment.author.username,
                    content: comment.text,
                    timestamp: comment.createdAt,
                })),
            }));

            res.json({ posts: formattedPosts });
        } catch (error) {
            return next(new AppError("internal db error", 500));
        }
    },
);

// find post with id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
        return next(new AppError("invalid post id", 400));
    }

    const post = await prisma.post.findUnique({
        where: { id },
        select: {
            id: true,
            text: true,
            createdAt: true,
            author: {
                select: {
                    id: true,
                    username: true,
                },
            },
            _count: {
                select: {
                    likes: true,
                    comments: true,
                },
            },
        },
    });

    if (!post) {
        return next(new AppError("incorrect post id", 404));
    }

    res.status(200).json(post);
});

// create post
router.post(
    "/",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        const parse = schema.safeParse(req.body);
        if (!parse.success) return next(new AppError("parsing failed", 400));

        const text = extractText(parse.data);

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

// delete post
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

// edit posts
router.patch(
    "/:id",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        const parse = schema.safeParse(req.body);
        if (!parse.success) return next(new AppError("invalid input", 400));

        const id = Number(req.params.id);
        if (Number.isNaN(id)) return next(new AppError("invalid id", 400));

        const text = extractText(parse.data);

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
