import { vi, describe, it, test, expect } from "vitest";

test("add", () => {
    const result = 1 + 2;
    expect(result).toBe(3);
});

// test(it) is a testcase
// describe organzies test
// expect creates an assertion

describe("check", () => {
    it("tweet", () => {
        const result = "maxv";
        expect(result).toBe("maxv");
    });
    it("used", () => {
        const res = "maxverstappen";
        expect(res).toBe("maxverstappen");
    });
});

// test async code
const fetchData = async () => {
    return Promise.resolve({ id: 1, text: "maxv" });
};

describe("tweet", () => {
    it("t1", async () => {
        const result = await fetchData();
        expect(result).toEqual({ id: 1, text: "maxv" });
    });
});


