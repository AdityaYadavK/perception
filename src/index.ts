import "dotenv/config";
import express, { Request, Response } from "express";
import register from './user/register.ts';

const app = express();
app.use(express.json());

app.use('/api/v1/auth/register', register);

app.get("/", (req: Request, res: Response) => {
    console.log("health verified!");
    res.json({ msg: "verified" });
});

app.listen(process.env.PORT || 3000, () => {
    console.log("listening on port : 3000");
});
