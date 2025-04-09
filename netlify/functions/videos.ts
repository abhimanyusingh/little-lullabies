import fetch from "node-fetch";
import fs from "fs-extra";
import path from "path";
import { Handler } from "@netlify/functions";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

// --- Types ---
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

// --- Zod Schemas ---
const YouTubeSearchSchema = z.object({
	items: z.array(
		z.object({
			id: z.object({
				videoId: z.string(),
			}),
			snippet: z.object({
				title: z.string(),
				description: z.string(),
				thumbnails: z.object({
					high: z.object({
						url: z.string(),
					}),
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

// --- Helpers ---
const getCachePath = (channelId: string) =>
	path.resolve(`/tmp/videos-${channelId.trim().toLowerCase()}.json`);

const isCacheFresh = async (cachePath: string): Promise<boolean> => {
	if (!(await fs.pathExists(cachePath))) {
		console.log("📁 Cache file not found:", cachePath);
		return false;
	}

	try {
		const cached = await fs.readJson(cachePath) as CachedData;
		const age = Date.now() - cached.timestamp;
		console.log(`⏱ Cache age: ${age / 1000}s, TTL: ${CACHE_TTL_MS / 1000}s`);
		return age < CACHE_TTL_MS;
	} catch (err) {
		console.error("⚠️ Failed to read cache file:", err);
		return false;
	}
};

const readCache = async (cachePath: string): Promise<YouTubeVideo[]> => {
	const cached = await fs.readJson(cachePath) as CachedData;
	console.log("📥 Using cached data from:", cachePath);
	return cached.videos;
};

const writeCache = async (cachePath: string, videos: YouTubeVideo[]): Promise<void> => {
	const payload: CachedData = {
		timestamp: Date.now(),
		videos,
	};
	await fs.writeJson(cachePath, payload, { spaces: 2 });
	console.log("💾 Cache written to:", cachePath);
};

const chunkArray = <T>(arr: T[], size: number): T[][] => {
	const result: T[][] = [];
	for (let i = 0; i < arr.length; i += size) {
		result.push(arr.slice(i, i + size));
	}
	return result;
};

// --- Main Fetch Function ---
const fetchYouTubeData = async (channelId: string): Promise<YouTubeVideo[]> => {
	if (!YOUTUBE_API_KEY) throw new Error("YouTube API key is missing");
	const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=500&order=date&type=video&key=${YOUTUBE_API_KEY}`
	console.log('youtubeApiUrl', youtubeApiUrl	)
	const videosRes = await fetch(
		youtubeApiUrl
	);
	if (!videosRes.ok) {
		const errorText = await videosRes.text();
		console.error("❌ Failed to fetch YouTube videos:", videosRes.status, errorText);
		throw new Error("YouTube video fetch failed");
	  }
	  
	  const videosJson = await videosRes.json() as unknown;
	  
	  if (typeof videosJson !== "object" || videosJson === null || !("items" in videosJson)) {
		console.error("❌ Invalid YouTube Search response:", JSON.stringify(videosJson, null, 2));
		throw new Error("YouTube Search API returned an invalid structure");
	  }
	  
	  const videosData = YouTubeSearchSchema.parse(videosJson);

	const videoIds = videosData.items.map((item) => item.id.videoId);
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

	return videosData.items.map((item) => {
		const stats = statsMap.get(item.id.videoId) || {
			viewCount: "0",
			likeCount: "0",
		};
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

// --- Netlify Handler ---
export const handler: Handler = async (event) => {
	const channelId = event.queryStringParameters?.channelId;
	if (!channelId) {
		return {
			statusCode: 400,
			body: JSON.stringify({ error: "Missing channelId" }),
		};
	}

	const normalizedChannelId = channelId.trim();
	console.log("📺 Requested channel:", normalizedChannelId);
	const cachePath = getCachePath(normalizedChannelId);

	try {
		if (await isCacheFresh(cachePath)) {
			const cachedVideos = await readCache(cachePath);
			return {
				statusCode: 200,
				body: JSON.stringify(cachedVideos),
				headers: { "Content-Type": "application/json" },
			};
		}

		const freshVideos = await fetchYouTubeData(normalizedChannelId);
		await writeCache(cachePath, freshVideos);

		return {
			statusCode: 200,
			body: JSON.stringify(freshVideos),
			headers: { "Content-Type": "application/json" },
		};
	} catch (err: any) {
		console.error("🔴 Error:", err);

		if (await fs.pathExists(cachePath)) {
			try {
				const fallback = await readCache(cachePath);
				return {
					statusCode: 200,
					body: JSON.stringify(fallback),
					headers: { "Content-Type": "application/json" },
				};
			} catch (e) {
				console.error("🔴 Failed to read fallback cache:", e);
			}
		}

		return {
			statusCode: 500,
			body: JSON.stringify({ error: "Unable to fetch videos and no valid cache found." }),
		};
	}
};
