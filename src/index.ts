import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cp from "cookie-parser";
import register from "./user/register.js";
import login from "./user/login.js";
import follow from "./user/follow.js";
import post from "./post/post.js";
import comment from "./post/comment.js";
import clike from "./comment/like.ts";
import like from "./post/like.js";
import feed from "./utils/feed.js";
import cors, { CorsOptions } from "cors";
import ehandler from "./utils/ehandler.js";
import { AppError } from "./utils/error.js";
import { globalLimit, AuthLimit } from "./utils/limit.js";
import helmet from "helmet";
import morgan from "morgan";
import ulike from "./user/like.ts";
import uclike from "./user/uclike.ts";
import logout from "./user/logout.ts";
import user from "./user/user.ts";
import { clean, preventPollution } from "./utils/InputSanitize.js";

const corsOptions: CorsOptions = {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

const app = express();
app.use(helmet());
app.disable("x-powered-by");
app.use(morgan("dev")); //to log every request
app.use(express.json({ limit: "10kb" }));
app.use(cors(corsOptions));
app.use(clean);
app.use(preventPollution);
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    throw new Error("JWT_SECRET is not set");
}
app.use(cp());

app.use("/api/v1/auth", AuthLimit);
app.use("/api", globalLimit);

app.use("/api/v1/auth/register", register);
app.use("/api/v1/auth/login", login);
app.use("/api/v1/follow", follow);
app.use("/api/v1/post", post);
app.use("/api/v1/comment", comment);
app.use("/api/v1/post/like", like);
app.use("/api/v1/feed", feed);
app.use("/api/v1/clike/", clike);
app.use("/api/v1/ulike", ulike);
app.use("/api/v1/uclike", uclike);
app.use("/api/v1/logout", logout);
app.use("/api/v1/user", user);

// _req for compiler to tell it is only for human and of no use
app.get("/", (_req: Request, res: Response) => {
    res.status(200).json({ msg: "verified" });
});

app.use(ehandler);

// app.listen(process.env.PORT || 3000, () => {
//     console.log("listening on port : 3000");
// });

export default app;
