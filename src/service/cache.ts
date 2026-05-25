import rc from "../config/redis.ts";

export default class Cache {
    async get(key: string) {
        try {
            const value = await rc.get(key);
            if (value) {
                return JSON.parse(value);
            }
            return null;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    // set value
    //tll (time to live in seconds)
    async set(key: string, value: any, ttl: number = 300) {
        try {
            await rc.setEx(key, ttl, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    // delete key from cache
    async delete(key: string) {
        try {
            await rc.del(key);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    // delete multiple keys matching patterns
    async deleteMultiple(pattern: string) {
        try {
            const keys = await rc.keys(pattern);
            if (keys.length > 0) {
                await rc.del(keys);
            }
            return keys.length;
        } catch (e) {
            console.error(e);
            return 0;
        }
    }

    // check if keys exists
    async check(key: string) {
        try {
            const exist = await rc.exists(key);
            return exist === 1;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    // set expiration on existing keys
    async setEx(key: string, ttl: number) {
        try {
            await rc.expire(key, ttl);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    // get time to live for a key
    async ttl(key: string) {
        try {
            const t = await rc.ttl(key);
            return t;
        } catch (e) {
            console.error(e);
            return -2;
        }
    }

    // increment numeric value
    async increment(key: string, amount: number) {
        try {
            return await rc.incBy(key, amount);
        } catch (e) {
            console.error(e);
        }
    }

    async wrap(key: string, fn: Function, ttl = 300) {
        // Try cache first
        const cached = await this.get(key);
        if (cached !== null) {
            console.log("cache hit");
            return cached;
        }

        // Cache miss - execute function
        console.log("cache miss");
        const result = await fn();

        // Store in cache (don't await)
        this.set(key, result, ttl).catch((err) => {
            console.log("wrap set error");
        });
        return result;
    }

    // clear all cache
    async flushAll() {
        try {
            await rc.flushDb();
            console.log("cache flushed");
            return true;
        } catch (error) {
            console.log("cache flush error");
            return false;
        }
    }
}
