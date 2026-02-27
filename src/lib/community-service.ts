export type ThreadCategory = 'General' | 'Builds' | 'Market' | 'PvP' | 'Guilds' | 'Guides' | 'Trading' | 'LFG' | 'Recruitment' | 'Announcements' | 'News' | 'Official';

export type ServerRegion = 'Americas' | 'Asia' | 'Europe' | 'All';

export interface Thread {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  authorRank?: string;
  authorIsAdmin?: boolean;
  title: string;
  content: string; // Markdown supported
  category: ThreadCategory;
  server: ServerRegion;
  tags: string[];
  likes: number;
  likedBy: string[]; // User IDs
  commentCount: number;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  relatedBuildId?: string; // Optional link to a specific build
  // Recruitment specific
  guildName?: string;
  // LFG specific
  activityType?: string; // e.g., 'Static Dungeon', 'Ganking', 'HCE'
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  authorRank?: string;
  authorIsAdmin?: boolean;
  content: string;
  likes: number;
  likedBy: string[];
  replyToId?: string; // For nested replies
  createdAt: string;
  updatedAt: string;
}
