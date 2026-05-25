// Format: entity:identifier:attribute
// user:123:profile
// post:456:details
// user:123:followers:count

export const CacheKeys = {
    // User keys
    user: (userId: number) => `user:${userId}:profile`,
    userPosts: (userId: number, page: number) =>
        `user:${userId}:posts:page:${page}`,
    userFollowers: (userId: number) => `user:${userId}:followers`,
    userFollowing: (userId: number) => `user:${userId}:following`,
    userFollowersCount: (userId: number) => `user:${userId}:followers:count`,
    userFollowingCount: (userId: number) => `user:${userId}:following:count`,
    userPostsCount: (userId: number) => `user:${userId}:posts:count`,

    // Post keys
    post: (postId: number) => `post:${postId}`,
    postLikes: (postId: number) => `post:${postId}:likes`,
    postLikesCount: (postId: number) => `post:${postId}:likes:count`,
    postReplies: (postId: number) => `post:${postId}:replies`,
    postRepliesCount: (postId: number) => `post:${postId}:replies:count`,

    // Feed keys
    feed: (userId: number, page: number) => `feed:${userId}:page:${page}`,
    trending: (page: number) => `trending:page:${page}`,

    // Search keys
    search: (query: number, type: number, page: number) =>
        `search:${type}:${query}:page:${page}`,

    // Session keys
    session: (token: string) => `session:${token}`,

    // Rate limit keys
    rateLimit: (ip: string, endpoint: string) =>
        `ratelimit:${ip}:${endpoint}`,
};
