import { z } from "zod";

export const VideoSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string(),
	thumbnail: z.string(),
	viewCount: z.string(),
	likeCount: z.string(),
	publishedAt: z.string()
});


const ChannelStatsSchema = z.object({
	subscriberCount: z.string(),
	videoCount: z.string(),
	viewCount: z.string(),
});

export type ChannelStats = z.infer<typeof ChannelStatsSchema>;


// Since your API returns a plain array of videos:
export const YouTubeResponseSchema = z.array(VideoSchema);

export type YouTubeVideo = z.infer<typeof VideoSchema>;
