import { createClient } from "redis";
import { AppError } from "../utils/error.ts";

const redisPortEnv = process.env.REDIS_PORT;
const redisPort = redisPortEnv ? Number.parseInt(redisPortEnv, 10) : undefined;
if (redisPortEnv && Number.isNaN(redisPort)) {
    throw new AppError("REDIS_PORT must be a number", 500);
}

const redisDbEnv = process.env.REDIS_DB;
const redisDb = redisDbEnv ? Number.parseInt(redisDbEnv, 10) : undefined;
if (redisDbEnv && Number.isNaN(redisDb)) {
    throw new AppError("REDIS_DB must be a number", 500);
}

const rc = createClient({
    socket: {
        host: process.env.REDIS_HOST ?? "127.0.0.1",
        port: redisPort,
        reconnectStrategy: (retries: number) => {
            if (retries > 10) {
                console.log("Redis max tries reached");
                return new AppError("Redis connection failed", 500);
            }
            return Math.min(retries * 50, 3000);
        },
    },
    password: process.env.REDIS_PASS,
    database: redisDb,
});

rc.on("connect", () => {
    console.log("redis client connecting...");
});
rc.on("ready", () => {
    console.log("redis client connected and ready");
});

rc.on("error", (e: Error) => {
    console.log("redis client error", e);
});

rc.on("reconnecting", () => {
    console.log("redis reconnecting");
});
rc.on("end", () => {
    console.log("redis connection closed");
});

// IIFE
(async () => {
    await rc.connect();
})();

export default rc;
