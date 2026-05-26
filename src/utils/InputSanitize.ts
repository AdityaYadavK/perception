import type { Request, Response, NextFunction } from "express";
import hpp from "hpp";
import { clean as xssClean } from "xss-clean/lib/xss.js";

/*
cross site scripting prevention
{ "name": "<script>alert('XSS')</script>" }
{ "name": "&lt;script&gt;alert('XSS')&lt;/script&gt;" }
*/

const sanitize = (value: unknown): unknown => {
    if (typeof value === "string") {
        return xssClean(value);
    }

    if (Array.isArray(value)) {
        return value.map((item) => sanitize(item));
    }

    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        for (const [key, entry] of Object.entries(record)) {
            record[key] = sanitize(entry);
        }
        return record;
    }

    return value;
};

export const clean = (req: Request, _res: Response, next: NextFunction) => {
    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);

    next();
};

/*
http parameter pollution prevention
prevents duplicate query parameter
*/

export const preventPollution = hpp({
    whitelist: ["tags", "fields"],
});
