import request from "supertest";
import type { Express } from "express";
import { beforeAll, expect, it, vi } from "vitest";
import { prismaMock } from "./mocks/prisma.ts";

const bcryptMock = {
    hash: vi.fn(),
    compare: vi.fn(),
};

vi.mock("bcrypt", () => ({
    default: bcryptMock,
}));
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

it("POST /api/v1/auth/register creates user", async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    bcryptMock.hash.mockResolvedValue("hashed-password");
    prismaMock.user.create.mockResolvedValue({ id: 1 });

    const res = await request(app).post("/api/v1/auth/register").send({
        username: "testuser",
        email: "test@example.com",
        password: "secret1",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ msg: "user created" });
});

it("POST /api/v1/auth/login logs in user", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        password: "hashed-password",
    });
    bcryptMock.compare.mockResolvedValue(true);

    const res = await request(app).post("/api/v1/auth/login").send({
        email: "test@example.com",
        password: "secret1",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ msg: "login success!" });
});
