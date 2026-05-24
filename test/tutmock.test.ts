import express from "express";
import request from "supertest";
import cookieParser from "cookie-parser";
import { vi, describe, it, expect, beforeEach } from "vitest";
import prisma from "../src/utils/prisma.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

vi.mock("../src/utils/prisma.ts", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(),
  },
}));

describe("login route", () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.resetModules();
    vi.stubEnv("JWT_SECRET", "mxvr");

    const loginRouter = (await import("../src/user/login.ts")).default;

    app = express();
    app.use(express.json());
    app.use(cookieParser("mxvr"));
    app.use("/login", loginRouter);
    app.use((err: any, _req: any, res: any, _next: any) => {
      res.status(err.statusCode || 500).json({ msg: err.message });
    });
  });

  it("should login successfully", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 1,
      email: "whitewalker@gmail.com",
      password: "hashed-password",
    } as any);

    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);
    vi.mocked(jwt.sign).mockReturnValueOnce("fake-jwt" as never);

    const res = await request(app).post("/login").send({
      email: "whitewalker@gmail.com",
      password: "whitewalker",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ msg: "login success!" });

    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 1 },
      "mxvr",
      { expiresIn: "30d" }
    );
  });
});