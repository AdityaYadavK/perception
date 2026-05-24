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

it("POST /api/v1/post/like likes a post with body", async () => {
    prismaMock.post.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.like.findUnique.mockResolvedValue(null);
    prismaMock.like.create.mockResolvedValue({ userId: 1, postId: 1 });

    const res = await request(app).post("/api/v1/post/like").send({ postId: 1 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ msg: "post liked" });
});

it("POST /api/v1/post/like/:id likes a post by id", async () => {
    prismaMock.post.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.like.findUnique.mockResolvedValue(null);
    prismaMock.like.create.mockResolvedValue({ userId: 1, postId: 1 });

    const res = await request(app).post("/api/v1/post/like/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ msg: "post liked" });
});

it("DELETE /api/v1/post/like/:id unlikes a post", async () => {
    prismaMock.like.findUnique.mockResolvedValue({ userId: 1, postId: 1 });
    prismaMock.like.delete.mockResolvedValue({ userId: 1, postId: 1 });

    const res = await request(app).delete("/api/v1/post/like/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ msg: "post unliked" });
});

it("GET /api/v1/post/like/:id returns likes", async () => {
    prismaMock.post.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.like.findMany.mockResolvedValue([
        {
            user: { id: 2, username: "sara" },
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
        },
    ]);

    const res = await request(app).get("/api/v1/post/like/1");

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.likes[0].user.username).toBe("sara");
});
