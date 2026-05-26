import jwt, { type JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import prisma from "./prisma.js";
import { AppError } from "./error.js";

interface AccessTokenPayload extends JwtPayload {
    id: number;
    type: "access";
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}

// generate access token
export const generateAccessToken = (userId: number) => {
    return jwt.sign({ id: userId, type: "access" }, JWT_SECRET, {
        expiresIn: "15m",
    });
};

// generate refresh token
export const generateToken = async (
    userId: number,
    ip: string,
    userAgent: string,
) => {
    const refreshToken = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return prisma.token.create({
        data: {
            token: refreshToken,
            userId,
            expiresAt,
            ip,
            userAgent,
            revokedAt: new Date(),
        },
    });
};

// verify access token
export const verifyAccessToken = (token: string): AccessTokenPayload => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (typeof decoded === "string") {
            throw new AppError("Invalid token payload", 403);
        }

        if (decoded.type !== "access") {
            throw new AppError("Invalid token type", 403);
        }

        return decoded as AccessTokenPayload;
    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            throw new AppError("Access token expired", 401);
        }
        throw new AppError("Invalid access token", 403);
    }
};
