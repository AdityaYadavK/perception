export class AppError extends Error {
    statusCode: number;
    status: "fail" | "error";
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        // runs auto
        super(message); // calls parent constructor
        // stores
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;
        // capturing a clean stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor() {
        super("Not Found", 404);
    }
}

export class InputParseError extends AppError {
    constructor() {
        super("Invalid Input", 402);
    }
}

export class CredentialsError extends AppError {
    constructor() {
        super("Invalid Credentials", 401);
    }
}

export class MiddelwareError extends AppError {
    constructor() {
        super("Auth Unverified", 402);
    }
}
