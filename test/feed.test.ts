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

it("GET /api/v1/feed/followed returns followed feed", async () => {
    prismaMock.follow.findMany.mockResolvedValue([{ followingId: 2 }]);
    prismaMock.post.findMany.mockResolvedValue([
        {
            id: 1,
            text: "hello",
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            author: { username: "alice" },
            comments: [],
            _count: { likes: 1 },
        },
    ]);

    const res = await request(app).get("/api/v1/feed/followed");

    expect(res.status).toBe(200);
    expect(res.body.msg).toBe("feed fetched");
    expect(res.body.posts).toHaveLength(1);
});

it("GET /api/v1/feed returns random feed", async () => {
    prismaMock.$queryRaw.mockResolvedValue([
        {
            id: 1,
            text: "random",
            authorId: 2,
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
        },
    ]);

    const res = await request(app).get("/api/v1/feed").query({ offset: 0, limit: 1 });

    expect(res.status).toBe(200);
    expect(res.body.msg).toBe("random feed fetched");
    expect(res.body.posts).toHaveLength(1);
});

it("GET /api/v1/feed/following returns following feed", async () => {
    prismaMock.follow.findMany.mockResolvedValue([{ followingId: 2 }]);
    prismaMock.post.findMany.mockResolvedValue([
        {
            id: 1,
            text: "hello",
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            author: { id: 2, username: "alice" },
            _count: { likes: 1, comments: 0 },
        },
    ]);

    const res = await request(app).get("/api/v1/feed/following").query({
        offset: 0,
        limit: 10,
    });

    expect(res.status).toBe(200);
    expect(res.body.msg).toBe("following feed fetched");
    expect(res.body.posts).toHaveLength(1);
});
