import fetch from "node-fetch";
import fs from "fs-extra";
import path from "path";
import { Handler } from "@netlify/functions";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

interface YouTubeVideo {
	id: string;
	title: string;
	description: string;
	thumbnail: string;
	viewCount: string;
	likeCount: string;
}

interface CachedData {
	timestamp: number;
	videos: YouTubeVideo[];
}

const YouTubeSearchSchema = z.object({
	nextPageToken: z.string().optional(),
	items: z.array(
		z.object({
			id: z.object({ videoId: z.string() }),
			snippet: z.object({
				title: z.string(),
				description: z.string(),
				thumbnails: z.object({
					high: z.object({ url: z.string() }),
				}),
			}),
		})
	),
});

const YouTubeStatsSchema = z.object({
	items: z.array(
		z.object({
			id: z.string(),
			statistics: z.object({
				viewCount: z.string(),
				likeCount: z.string().optional(),
			}),
		})
	),
});

const getCachePath = (channelId: string) =>
	path.resolve(`/tmp/videos-${channelId.trim().toLowerCase()}.json`);

const isCacheFresh = async (cachePath: string): Promise<boolean> => {
	if (!(await fs.pathExists(cachePath))) return false;
	try {
		const cached = await fs.readJson(cachePath) as CachedData;
		return Date.now() - cached.timestamp < CACHE_TTL_MS;
	} catch {
		return false;
	}
};

const readCache = async (cachePath: string): Promise<YouTubeVideo[]> => {
	const cached = await fs.readJson(cachePath) as CachedData;
	return cached.videos;
};

const writeCache = async (cachePath: string, videos: YouTubeVideo[]): Promise<void> => {
	const payload: CachedData = {
		timestamp: Date.now(),
		videos,
	};
	await fs.writeJson(cachePath, payload, { spaces: 2 });
};

const chunkArray = <T>(arr: T[], size: number): T[][] => {
	const result: T[][] = [];
	for (let i = 0; i < arr.length; i += size) {
		result.push(arr.slice(i, i + size));
	}
	return result;
};

const fetchYouTubeData = async (channelId: string): Promise<YouTubeVideo[]> => {
	if (!YOUTUBE_API_KEY) throw new Error("Missing YouTube API key");

	let allItems: z.infer<typeof YouTubeSearchSchema>["items"] = [];
	let nextPageToken: string | undefined = undefined;

	do {
		const url = new URL("https://www.googleapis.com/youtube/v3/search");
		url.searchParams.set("part", "snippet");
		url.searchParams.set("channelId", channelId);
		url.searchParams.set("maxResults", "50");
		url.searchParams.set("order", "date");
		url.searchParams.set("type", "video");
		url.searchParams.set("key", YOUTUBE_API_KEY);
		if (nextPageToken) url.searchParams.set("pageToken", nextPageToken);

		const res = await fetch(url.toString());
		const json = (await res.json()) as unknown;
		
		const parsed = YouTubeSearchSchema.safeParse(json);
		
		if (!parsed.success) {
			console.error("Validation error:", parsed.error);
			throw new Error("Invalid API response format");
		}
		
		allItems.push(...parsed.data.items);
		nextPageToken = (json as any).nextPageToken; // You can safely access it here or better: parsed.data.nextPageToken if it's in schema

		if (allItems.length >= 500) break;
	} while (nextPageToken);

	const videoIds = allItems.map((item) => item.id.videoId);
	const videoIdChunks = chunkArray(videoIds, 50);

	const statsItems = [];
	for (const chunk of videoIdChunks) {
		const statsRes = await fetch(
			`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${chunk.join(",")}&key=${YOUTUBE_API_KEY}`
		);
		const statsJson = await statsRes.json();
		const statsData = YouTubeStatsSchema.parse(statsJson);
		statsItems.push(...statsData.items);
	}

	const statsMap = new Map(statsItems.map((item) => [item.id, item.statistics]));

	return allItems.map((item) => {
		const stats = statsMap.get(item.id.videoId) || { viewCount: "0", likeCount: "0" };
		return {
			id: item.id.videoId,
			title: item.snippet.title,
			description: item.snippet.description,
			thumbnail: item.snippet.thumbnails.high.url,
			viewCount: stats.viewCount,
			likeCount: stats.likeCount ?? "0",
		};
	});
};

export const handler: Handler = async (event) => {
	const channelId = event.queryStringParameters?.channelId;
	if (!channelId) {
		return {
			statusCode: 400,
			body: JSON.stringify({ error: "Missing channelId" }),
		};
	}

	const cachePath = getCachePath(channelId);
	try {
		if (await isCacheFresh(cachePath)) {
			const cached = await readCache(cachePath);
			return {
				statusCode: 200,
				body: JSON.stringify(cached),
				headers: { "Content-Type": "application/json" },
			};
		}

		const fresh = await fetchYouTubeData(channelId);
		await writeCache(cachePath, fresh);

		return {
			statusCode: 200,
			body: JSON.stringify(fresh),
			headers: { "Content-Type": "application/json" },
		};
	} catch (err) {
		console.error("Error:", err);
		if (await fs.pathExists(cachePath)) {
			const fallback = await readCache(cachePath);
			return {
				statusCode: 200,
				body: JSON.stringify(fallback),
				headers: { "Content-Type": "application/json" },
			};
		}
		return {
			statusCode: 500,
			body: JSON.stringify({ error: "Unable to fetch videos." }),
		};
	}
};
