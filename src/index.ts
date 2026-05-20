import "dotenv/config";
import express, { Request, Response } from "express";
import register from './user/register.ts';
import login from './user/login.ts';
import post from './post/post.ts';
import cp from 'cookie-parser';

const app = express();
app.use(express.json());
app.use(cp());

app.use('/api/v1/auth/register', register);
app.use('/api/v1/auth/login', login);
app.use('/api/v1/post', post);

app.get("/", (req: Request, res: Response) => {
    console.log("health verified!");
    res.json({ msg: "verified" });
});

app.listen(process.env.PORT || 3000, () => {
    console.log("listening on port : 3000");
});
