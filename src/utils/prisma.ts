import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { AppError } from "./error.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({
    connectionString: databaseUrl,
});

export const prisma = new PrismaClient({ adapter });

prisma
    .$connect()
    .then(() => {
        console.log("Database Connected Successfully !");
    })
    .catch(() => {
        throw new AppError("Database connection failed", 500);
    });

// graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    console.log('Database disconnected');
    process.exit(0);
})

export default prisma;
