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

const extractText = (
    data: z.infer<typeof schema> | z.infer<typeof editSchema>
) => ("content" in data ? data.content : data.text);

type CommentNode = {
    id: number;
    text: string;
    authorId: number;
    postId: number;
    parentId: number | null;
    createdAt: Date;
    author: {
        id: number;
        username: string;
    };
    replies: CommentNode[];
};

function buildCommentTree(flatComments: Omit<CommentNode, "replies">[]) {
    const map = new Map<number, CommentNode>();

    for (const comment of flatComments) {
        map.set(comment.id, {
            ...comment,
            replies: [],
        });
    }

    const roots: CommentNode[] = [];

    for (const comment of map.values()) {
        if (comment.parentId === null) {
            roots.push(comment);
        } else {
            const parent = map.get(comment.parentId);
            if (parent) {
                parent.replies.push(comment);
            }
        }
    }

    const sortReplies = (nodes: CommentNode[]) => {
        nodes.sort((a, b) => {
            const dateDiff =
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

            if (dateDiff !== 0) return dateDiff;
            return b.id - a.id;
        });

        for (const node of nodes) {
            sortReplies(node.replies);
        }
    };

    sortReplies(roots);
    return roots;
}

// create comment or reply
router.post(
    "/",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        const parse = schema.safeParse(req.body);
        if (!parse.success) return next(new AppError("invalid input", 400));

        const { postId, parentId } = parse.data;
        const text = extractText(parse.data);

        try {
            const post = await prisma.post.findUnique({
                where: { id: postId },
            });

            if (!post) return next(new AppError("post not found", 404));

            if (parentId) {
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

            await prisma.comment.create({
                data: {
                    text,
                    postId,
                    authorId: res.locals.id,
                    parentId: parentId ?? null,
                },
            });

            res.status(201).json({ msg: "comment created" });
        } catch {
            return next(new AppError("internal db error", 500));
        }
    }
);

// get paginated top-level comments with all nested replies
router.get(
    "/post/:postId",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        const postId = Number(req.params.postId);
        const offset = Number(req.query.offset ?? 0);
        const limit = Number(req.query.limit ?? 10);

        if (Number.isNaN(postId) || postId < 1) {
            return next(new AppError("invalid post id", 400));
        }

        if (Number.isNaN(offset) || offset < 0) {
            return next(new AppError("invalid offset", 400));
        }

        if (Number.isNaN(limit) || limit < 1 || limit > 50) {
            return next(new AppError("invalid limit", 400));
        }

        try {
            const post = await prisma.post.findUnique({
                where: { id: postId },
            });

            if (!post) return next(new AppError("post not found", 404));

            const allComments = await prisma.comment.findMany({
                where: { postId },
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                },
                orderBy: [
                    { createdAt: "desc" },
                    { id: "desc" },
                ],
            });

            const tree = buildCommentTree(allComments);

            const paginatedTopLevelComments = tree.slice(offset, offset + limit);

            res.status(200).json({
                msg: "comments fetched",
                offset,
                limit,
                comments: paginatedTopLevelComments,
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
        if (Number.isNaN(id)) return next(new AppError("invalid id", 400));

        try {
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

            res.status(200).json({ msg: "comment deleted" });
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
        if (Number.isNaN(id)) return next(new AppError("invalid id", 400));

        const parse = editSchema.safeParse(req.body);
        if (!parse.success) return next(new AppError("invalid input", 400));

        const text = extractText(parse.data);

        try {
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

            res.status(200).json({ msg: "comment updated" });
        } catch {
            return next(new AppError("internal db error", 500));
        }
    }
);

export default router;