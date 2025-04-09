import { useEffect, useState } from "react";
import { YouTubeResponseSchema, YouTubeVideo, ChannelStats } from "./schemas"; // adjust import if needed

export const useYouTubeChannel = (channelId: string) => {
	const [videos, setVideos] = useState<YouTubeVideo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [channelStats, setChannelStats] = useState<ChannelStats>(); // still here in case you add later

	useEffect(() => {
		const fetchVideos = async () => {
			try {
				const res = await fetch(`/api/videos?channelId=${channelId}`);
				if (!res.ok) throw new Error("Failed to fetch videos");

				

				const text = await res.text();
				const json = JSON.parse(text);
				const parsed = YouTubeResponseSchema.safeParse(json);

				if (!parsed.success) {
					console.error("Validation failed:", parsed.error);
					throw new Error("Invalid response format");
				}

				setVideos(parsed.data);
				setChannelStats(null); // not returned by API
			} catch (err) {
				setError(err instanceof Error ? err.message : "An unknown error occurred");
			} finally {
				setLoading(false);
			}
		};

		fetchVideos();
	}, [channelId]);

	return { videos, loading, error, channelStats };
};
