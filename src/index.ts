import "dotenv/config";
import express, { Request, Response } from "express";
import cp from "cookie-parser";
import register from "./user/register.ts";
import login from "./user/login.ts";
import follow from "./user/follow.ts";
import post from "./post/post.ts";
import comment from "./post/comment.ts";
import like from "./post/like.ts";
import feed from "./utils/feed.ts";
import cors, { CorsOptions } from "cors";

const corsOptions: CorsOptions = {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

const app = express();
app.use(express.json());
app.use(cors(corsOptions));
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    throw new Error("JWT_SECRET is not set");
}
app.use(cp(jwtSecret));

app.use("/api/v1/auth/register", register);
app.use("/api/v1/auth/login", login);
app.use("/api/v1/user/follow", follow);
app.use("/api/v1/post", post);
app.use("/api/v1/post/comment", comment);
app.use("/api/v1/post/like", like);
app.use("/api/v1/feed", feed);

app.get("/", (req: Request, res: Response) => {
    console.log("health verified!");
    res.json({ msg: "verified" });
});

// app.listen(process.env.PORT || 3000, () => {
//     console.log("listening on port : 3000");
// });

export default app;