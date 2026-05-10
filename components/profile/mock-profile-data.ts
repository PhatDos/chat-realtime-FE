import { FeedPost } from "@/components/newsfeed/types";

export interface MockUser {
  id: string;
  name: string;
  imageUrl: string;
  bio?: string;
  status: "online" | "offline" | "away";
  joinDate: string;
  location?: string;
  website?: string;
}

export interface MockProfile {
  user: MockUser;
  friendsCount: number;
  postsCount: number;
  isFriend: boolean;
  posts: FeedPost[];
}

const MOCK_USERS: Record<string, MockUser> = {
  "user-1": {
    id: "user-1",
    name: "Alice Johnson",
    imageUrl: "/avatar-default-dark.svg",
    bio: "Web developer and coffee enthusiast ☕ | React, TypeScript, Next.js",
    status: "online",
    joinDate: "2024-01-15",
    location: "San Francisco, CA",
    website: "alice.dev",
  },
  "user-2": {
    id: "user-2",
    name: "Bob Smith",
    imageUrl: "/avatar-default-dark.svg",
    bio: "Full-stack developer | Always learning",
    status: "online",
    joinDate: "2024-02-20",
    location: "New York, NY",
    website: "bobsmith.io",
  },
  "user-3": {
    id: "user-3",
    name: "Carol Davis",
    imageUrl: "/avatar-default-dark.svg",
    bio: "UI/UX Designer | Creative Thinker",
    status: "away",
    joinDate: "2024-03-10",
    location: "Los Angeles, CA",
    website: "carol.design",
  },
  "user-4": {
    id: "user-4",
    name: "David Wilson",
    imageUrl: "/avatar-default-dark.svg",
    bio: "DevOps Engineer | Cloud Enthusiast",
    status: "offline",
    joinDate: "2024-01-05",
    location: "Seattle, WA",
  },
  "user-5": {
    id: "user-5",
    name: "Emma Brown",
    imageUrl: "/avatar-default-dark.svg",
    bio: "Software Architect | Tech Lead",
    status: "online",
    joinDate: "2023-12-01",
    location: "Boston, MA",
    website: "emma.tech",
  },
};

const MOCK_POSTS: Record<string, FeedPost[]> = {
  "user-1": [
    {
      id: "post-1",
      content: "Just finished building an amazing Discord clone with Next.js! 🎉 The real-time messaging with Socket.io is incredibly smooth.",
      fileUrl: undefined,
      fileType: "text",
      visibility: "PUBLIC",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      likeCount: 45,
      commentCount: 12,
      author: {
        id: "user-1",
        name: "Alice Johnson",
        imageUrl: "/avatar-default-dark.svg",
      },
      isLiked: false,
    },
    {
      id: "post-2",
      content: "Tips for optimizing React components:\n1. Use React.memo for expensive renders\n2. Implement proper state management\n3. Leverage code splitting",
      fileUrl: undefined,
      fileType: "text",
      visibility: "PUBLIC",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      likeCount: 128,
      commentCount: 34,
      author: {
        id: "user-1",
        name: "Alice Johnson",
        imageUrl: "/avatar-default-dark.svg",
      },
      isLiked: true,
    },
    {
      id: "post-3",
      content: "Working on an exciting new project with TypeScript and Prisma. The type safety is chef's kiss! 👨‍🍳",
      fileUrl: undefined,
      fileType: "text",
      visibility: "PUBLIC",
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
      likeCount: 67,
      commentCount: 15,
      author: {
        id: "user-1",
        name: "Alice Johnson",
        imageUrl: "/avatar-default-dark.svg",
      },
      isLiked: false,
    },
  ],
  "user-2": [
    {
      id: "post-4",
      content: "Full-stack development is not just about coding, it's about understanding the entire system. Here's my approach...",
      fileUrl: undefined,
      fileType: "text",
      visibility: "PUBLIC",
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      likeCount: 92,
      commentCount: 23,
      author: {
        id: "user-2",
        name: "Bob Smith",
        imageUrl: "/avatar-default-dark.svg",
      },
      isLiked: false,
    },
    {
      id: "post-5",
      content: "Just deployed a new version with 50% performance improvement! Database optimization was the key. 🚀",
      fileUrl: undefined,
      fileType: "text",
      visibility: "PUBLIC",
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      likeCount: 156,
      commentCount: 41,
      author: {
        id: "user-2",
        name: "Bob Smith",
        imageUrl: "/avatar-default-dark.svg",
      },
      isLiked: true,
    },
  ],
  "user-3": [
    {
      id: "post-6",
      content: "UI/UX design trends for 2024: Minimalism, Dark mode, and Accessibility-first. What are your thoughts?",
      fileUrl: undefined,
      fileType: "text",
      visibility: "PUBLIC",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      likeCount: 234,
      commentCount: 67,
      author: {
        id: "user-3",
        name: "Carol Davis",
        imageUrl: "/avatar-default-dark.svg",
      },
      isLiked: false,
    },
    {
      id: "post-7",
      content: "Design systems are the future! Just completed a comprehensive design system for our platform. 🎨",
      fileUrl: undefined,
      fileType: "text",
      visibility: "FRIENDS",
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      likeCount: 145,
      commentCount: 38,
      author: {
        id: "user-3",
        name: "Carol Davis",
        imageUrl: "/avatar-default-dark.svg",
      },
      isLiked: false,
    },
  ],
  "user-4": [
    {
      id: "post-8",
      content: "Cloud infrastructure management is an art. Optimizing costs while maintaining reliability 💰",
      fileUrl: undefined,
      fileType: "text",
      visibility: "PUBLIC",
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      likeCount: 87,
      commentCount: 19,
      author: {
        id: "user-4",
        name: "David Wilson",
        imageUrl: "/avatar-default-dark.svg",
      },
      isLiked: false,
    },
  ],
  "user-5": [
    {
      id: "post-9",
      content: "Software architecture is like building a house. The foundation matters! 🏗️",
      fileUrl: undefined,
      fileType: "text",
      visibility: "PUBLIC",
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      likeCount: 203,
      commentCount: 56,
      author: {
        id: "user-5",
        name: "Emma Brown",
        imageUrl: "/avatar-default-dark.svg",
      },
      isLiked: true,
    },
    {
      id: "post-10",
      content: "Leading a tech team requires more than just technical skills. Communication and mentorship are key.",
      fileUrl: undefined,
      fileType: "text",
      visibility: "PUBLIC",
      createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      likeCount: 178,
      commentCount: 45,
      author: {
        id: "user-5",
        name: "Emma Brown",
        imageUrl: "/avatar-default-dark.svg",
      },
      isLiked: false,
    },
  ],
};

export const getMockProfile = (userId: string): MockProfile => {
  const user = MOCK_USERS[userId];
  const posts = MOCK_POSTS[userId] || [];

  if (!user) {
    return {
      user: {
        id: "unknown",
        name: "Unknown User",
        imageUrl: "/avatar-default-dark.svg",
        status: "offline",
        joinDate: "2024-01-01",
      },
      friendsCount: 0,
      postsCount: 0,
      isFriend: false,
      posts: [],
    };
  }

  return {
    user,
    friendsCount: Math.floor(Math.random() * 500) + 50,
    postsCount: posts.length,
    isFriend: Math.random() > 0.5,
    posts,
  };
};

export const getAllMockUsers = (): MockUser[] => {
  return Object.values(MOCK_USERS);
};
