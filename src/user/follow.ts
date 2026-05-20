import express, { Request, Response, NextFunction } from "express";
import auth from "../utils/middleware.ts";
import { AppError } from "../utils/error.ts";
import prisma from "../utils/prisma.ts";

const router = express.Router();

// follow a user
router.post(
    "/:id",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        const followingId = Number(req.params.id);
        if (Number.isNaN(followingId))
            return next(new AppError("invalid id", 400));

        const followerId = res.locals.id;

        // cannot follow yourself
        if (followerId === followingId)
            return next(new AppError("invalid action", 400));

        const userToFollow = await prisma.user.findUnique({
            where: { id: followingId },
        });
        if (!userToFollow) return next(new AppError("user not found", 404));

        // check if already following
        const alreadyFollowing = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });
        if (alreadyFollowing)
            return next(new AppError("already following", 400));

        await prisma.follow.create({
            data: {
                followerId,
                followingId,
            },
        });

        res.json({ msg: "followed" });
    },
);

// unfollow a user
router.delete(
    "/:id",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        const followingId = Number(req.params.id);
        if (Number.isNaN(followingId))
            return next(new AppError("invalid id", 400));

        const followerId = res.locals.id;

        // cannot unfollow yourself
        if (followerId === followingId)
            return next(new AppError("invalid action", 400));

        const exist = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });
        if (!exist) return next(new AppError("not following", 400));

        await prisma.follow.delete({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });

        res.json({ msg: "unfollowed" });
    },
);

// get followers of a user
router.get(
    "/:id/followers",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) return next(new AppError("invalid id", 400));

        const user = await prisma.user.findUnique({
            where: { id },
        });
        if (!user) return next(new AppError("user not found", 404));

        const followers = await prisma.follow.findMany({
            where: { followingId: id },
            select: {
                follower: {
                    select: { id: true, username: true },
                },
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        res.json({ followers });
    },
);

// get users a user is following
router.get(
    "/:id/following",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) return next(new AppError("invalid id", 400));

        const user = await prisma.user.findUnique({
            where: { id },
        });
        if (!user) return next(new AppError("user not found", 404));

        const following = await prisma.follow.findMany({
            where: { followerId: id },
            select: {
                following: {
                    select: { id: true, username: true },
                },
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        res.json({ following });
    },
);

export default router;
