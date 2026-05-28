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

const baseSchema = z.object({
    postId: z.coerce.number().int().positive(),
    parentId: z.coerce.number().int().positive().optional(),
});

const schema = z.union([
    baseSchema.merge(contentSchema),
    baseSchema.merge(textSchema),
]);

const editSchema = z.union([contentSchema, textSchema]);

const getCommentsSchema = z.object({
    postId: z.coerce.number().int().positive(),
    parentId: z.coerce.number().int().positive().optional(),
    offset: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

const extractText = (
    data: z.infer<typeof schema> | z.infer<typeof editSchema>
) => ("content" in data ? data.content : data.text);

// create comment or reply
router.post(
    "/",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        const parse = schema.safeParse(req.body);

        if (!parse.success) {
            return next(new AppError("invalid input", 400));
        }

        const { postId, parentId } = parse.data;
        const text = extractText(parse.data);

        try {
            const post = await prisma.post.findUnique({
                where: { id: postId },
            });

            if (!post) {
                return next(new AppError("post not found", 404));
            }

            if (parentId !== undefined) {
                const parent = await prisma.comment.findUnique({
                    where: { id: parentId },
                });

                if (!parent) {
                    return next(new AppError("parent comment not found", 404));
                }

                if (parent.postId !== postId) {
                    return next(new AppError("invalid action", 400));
                }
            }

            const comment = await prisma.comment.create({
                data: {
                    text,
                    postId,
                    authorId: res.locals.id,
                    parentId: parentId ?? null,
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    _count: {
                        select: {
                            replies: true,
                            likes: true,
                        },
                    },
                },
            });

            return res.status(201).json({
                msg: "comment created",
                comment,
            });
        } catch {
            return next(new AppError("internal db error", 500));
        }
    }
);

router.get(
    "/post/:postId",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        const parse = getCommentsSchema.safeParse({
            postId: req.params.postId,
            parentId: req.query.parentId,
            offset: req.query.offset,
            limit: req.query.limit,
        });

        if (!parse.success) {
            return next(new AppError("invalid query params", 400));
        }

        const { postId, parentId, offset, limit } = parse.data;

        try {
            const post = await prisma.post.findUnique({
                where: { id: postId },
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
                return next(new AppError("post not found", 404));
            }

            let parentComment: { id: number; text: string; postId: number } | null =
                null;

            if (parentId !== undefined) {
                parentComment = await prisma.comment.findUnique({
                    where: { id: parentId },
                    select: {
                        id: true,
                        text: true,
                        postId: true,
                    },
                });

                if (!parentComment) {
                    return next(new AppError("parent comment not found", 404));
                }

                if (parentComment.postId !== postId) {
                    return next(
                        new AppError("invalid parent comment for this post", 400)
                    );
                }
            }

            const comments = await prisma.comment.findMany({
                where: {
                    postId,
                    parentId: parentId === undefined ? null : parentId,
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    _count: {
                        select: {
                            replies: true,
                            likes: true,
                        },
                    },
                },
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                skip: offset,
                take: limit,
            });

            return res.status(200).json({
                msg: "comments fetched",
                offset,
                limit,
                post: {
                    id: post.id,
                    text: post.text,
                    createdAt: post.createdAt,
                    author: {
                        id: post.author.id,
                        username: post.author.username,
                    },
                    _count: {
                        likes: post._count.likes,
                        comments: post._count.comments,
                    },
                },
                parentComment:
                    parentComment === null
                        ? null
                        : {
                              id: parentComment.id,
                              text: parentComment.text,
                          },
                comments,
            });
        } catch {
            return next(new AppError("internal db error", 500));
        }
    }
);

// delete comment
router.delete(
    "/:id",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);

        if (Number.isNaN(id) || id < 1) {
            return next(new AppError("invalid id", 400));
        }

        try {
            const exist = await prisma.comment.findUnique({
                where: { id },
            });

            if (!exist) {
                return next(new AppError("comment not found", 404));
            }

            if (exist.authorId !== res.locals.id) {
                return next(new AppError("invalid action", 403));
            }

            await prisma.comment.delete({
                where: { id },
            });

            return res.status(200).json({ msg: "comment deleted" });
        } catch {
            return next(new AppError("internal db error", 500));
        }
    }
);

// edit comment
router.patch(
    "/:id",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);

        if (Number.isNaN(id) || id < 1) {
            return next(new AppError("invalid id", 400));
        }

        const parse = editSchema.safeParse(req.body);

        if (!parse.success) {
            return next(new AppError("invalid input", 400));
        }

        const text = extractText(parse.data);

        try {
            const exist = await prisma.comment.findUnique({
                where: { id },
            });

            if (!exist) {
                return next(new AppError("comment not found", 404));
            }

            if (exist.authorId !== res.locals.id) {
                return next(new AppError("invalid action", 403));
            }

            const updatedComment = await prisma.comment.update({
                where: { id },
                data: { text },
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    _count: {
                        select: {
                            replies: true,
                            likes: true,
                        },
                    },
                },
            });

            return res.status(200).json({
                msg: "comment updated",
                comment: updatedComment,
            });
        } catch {
            return next(new AppError("internal db error", 500));
        }
    }
);

export default router;