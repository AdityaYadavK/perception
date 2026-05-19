export class AppError extends Error{
    statusCode: Number;
    status: 'fail' | 'error';
    isOperational: boolean;
    
    constructor(message : string, statusCode : Number) { // runs auto
        super(message); // calls parent constructor
        // stores
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        // capturing a clean stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}
