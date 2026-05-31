import express, { Request, Response } from "express";

const router = express.Router();

router.post("/", (_req: Request, res: Response) => {
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
    });
    return res.status(200).json({
        msg: "logged out!",
    });
});

export default router;
