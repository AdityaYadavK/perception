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

it("POST /api/v1/post/comment creates a comment", async () => {
    prismaMock.post.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.comment.create.mockResolvedValue({ id: 1 });

    const res = await request(app).post("/api/v1/post/comment").send({
        postId: 1,
        content: "nice post",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ msg: "comment created" });
});

it("GET /api/v1/post/comment returns comments by query", async () => {
    prismaMock.post.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.comment.findMany.mockResolvedValue([
        {
            id: 1,
            text: "nice post",
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            author: { id: 1, username: "alice" },
            replies: [],
        },
    ]);

    const res = await request(app).get("/api/v1/post/comment").query({ postId: 1 });

    expect(res.status).toBe(200);
    expect(res.body.comments).toHaveLength(1);
    expect(res.body.comments[0].author.username).toBe("alice");
});

it("GET /api/v1/post/comment/:postId returns comments by path", async () => {
    prismaMock.post.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.comment.findMany.mockResolvedValue([
        {
            id: 2,
            text: "nice post",
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            author: { id: 2, username: "bob" },
            replies: [],
        },
    ]);

    const res = await request(app).get("/api/v1/post/comment/1");

    expect(res.status).toBe(200);
    expect(res.body.comments).toHaveLength(1);
    expect(res.body.comments[0].author.username).toBe("bob");
});

it("DELETE /api/v1/post/comment/:id deletes a comment", async () => {
    prismaMock.comment.findUnique.mockResolvedValue({ id: 1, authorId: 1 });
    prismaMock.comment.delete.mockResolvedValue({ id: 1 });

    const res = await request(app).delete("/api/v1/post/comment/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ msg: "comment deleted" });
});

it("PATCH /api/v1/post/comment/:id updates a comment", async () => {
    prismaMock.comment.findUnique.mockResolvedValue({ id: 1, authorId: 1 });
    prismaMock.comment.update.mockResolvedValue({ id: 1 });

    const res = await request(app).patch("/api/v1/post/comment/1").send({
        text: "updated",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ msg: "comment updated" });
});
