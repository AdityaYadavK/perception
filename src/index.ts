import express, { Request, Response } from "express";

const app = express();

app.get("/", (req: Request, res: Response) => {
    console.log("health verified!");
    res.json({ msg: "verified" });
});

app.listen(process.env.PORT || 3000, () => {
    console.log("listening on port : 3000");
});
