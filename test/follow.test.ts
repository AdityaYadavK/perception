import request from "supertest";
import type { Express } from "express";
import { beforeAll, expect, it, vi } from "vitest";
import { prismaMock } from "./mocks/prisma.ts";

vi.mock("../src/utils/prisma.ts", () => ({
    default: prismaMock,
    prisma: prismaMock,
}));
vi.mock("../src/utils/middleware.ts", () => ({
    default: (req: unknown, res: { locals: { id?: number } }, next: () => void) => {
        res.locals.id = 1;
        next();
    },
}));

let app: Express;

beforeAll(async () => {
    app = (await import("../src/index.ts")).default;
});

it("POST /api/v1/user/follow/:id follows a user", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 2 });
    prismaMock.follow.findUnique.mockResolvedValue(null);
    prismaMock.follow.create.mockResolvedValue({ followerId: 1, followingId: 2 });

    const res = await request(app).post("/api/v1/user/follow/2");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ msg: "followed" });
});

it("DELETE /api/v1/user/follow/:id unfollows a user", async () => {
    prismaMock.follow.findUnique.mockResolvedValue({ followerId: 1, followingId: 2 });
    prismaMock.follow.delete.mockResolvedValue({ followerId: 1, followingId: 2 });

    const res = await request(app).delete("/api/v1/user/follow/2");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ msg: "unfollowed" });
});

it("GET /api/v1/user/follow/:id/followers returns followers", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 2 });
    prismaMock.follow.findMany.mockResolvedValue([
        {
            follower: { id: 3, username: "bob" },
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
        },
    ]);

    const res = await request(app).get("/api/v1/user/follow/2/followers");

    expect(res.status).toBe(200);
    expect(res.body.followers).toHaveLength(1);
    expect(res.body.followers[0].follower.username).toBe("bob");
});

it("GET /api/v1/user/follow/:id/following returns following", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 2 });
    prismaMock.follow.findMany.mockResolvedValue([
        {
            following: { id: 4, username: "sara" },
            createdAt: new Date("2026-01-02T00:00:00.000Z"),
        },
    ]);

    const res = await request(app).get("/api/v1/user/follow/2/following");

    expect(res.status).toBe(200);
    expect(res.body.following).toHaveLength(1);
    expect(res.body.following[0].following.username).toBe("sara");
});
