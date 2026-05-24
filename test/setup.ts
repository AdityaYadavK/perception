import { beforeEach, vi } from "vitest";

process.env.JWT_SECRET = "test-secret";

beforeEach(() => {
    vi.clearAllMocks();
});
