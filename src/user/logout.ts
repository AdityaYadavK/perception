import express, { Request, Response } from "express";

const router = express.Router();

router.post("/", (_req: Request, res: Response) => {
    res.clearCookie("token", {
        httpOnly: true, //JS cannot access
        sameSite: "lax", //CSRF protection
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: false,
        path: "/",
        signed: false,
    }).json({
        msg: "login success!",
    });
    return res.status(200).json({
        msg: "logged out!",
    });
});

export default router;
