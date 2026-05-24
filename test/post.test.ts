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

it("GET /api/v1/post returns posts", async () => {
    prismaMock.post.findMany.mockResolvedValue([
        {
            id: 1,
            text: "hello",
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            author: { username: "alice" },
            comments: [
                {
                    id: 10,
                    text: "nice",
                    createdAt: new Date("2026-01-02T00:00:00.000Z"),
                    author: { username: "bob" },
                },
            ],
            _count: { likes: 2 },
        },
    ]);

    const res = await request(app).get("/api/v1/post");

    expect(res.status).toBe(200);
    expect(res.body.posts).toHaveLength(1);
    expect(res.body.posts[0].author).toBe("alice");
    expect(res.body.posts[0].comments[0].content).toBe("nice");
});

it("POST /api/v1/post creates a post", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.post.create.mockResolvedValue({ id: 1, text: "hello" });

    const res = await request(app).post("/api/v1/post").send({
        content: "hello",
    });

    expect(res.status).toBe(200);
    expect(res.body.msg).toBe("post created");
});

it("DELETE /api/v1/post/:id deletes a post", async () => {
    prismaMock.post.findUnique.mockResolvedValue({ id: 1, authorId: 1 });
    prismaMock.post.delete.mockResolvedValue({ id: 1 });

    const res = await request(app).delete("/api/v1/post/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ msg: "post deleted" });
});

it("PATCH /api/v1/post/:id updates a post", async () => {
    prismaMock.post.findUnique.mockResolvedValue({ id: 1, authorId: 1 });
    prismaMock.post.update.mockResolvedValue({ id: 1 });

    const res = await request(app).patch("/api/v1/post/1").send({
        text: "updated",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ msg: "post updated" });
});
