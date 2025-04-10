import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Youtube,
	Music,
	Star,
	Loader2,
	Facebook,
	Instagram,
	Eye,
	ThumbsUp,
	Users,
} from "lucide-react";
import { useYouTubeChannel } from "./lib/youtube";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { motion } from 'framer-motion';
import './App.css'

const CHANNEL_DESCRIPTION =
	"A joyful collection of sing-along songs perfect for toddlers and preschoolers! These fun and educational tunes help little learners explore numbers, colors, animals, and more through music and movement.";

function App() {
	const { videos, channelStats, loading, error } = useYouTubeChannel(
		"UCBUL4M5iMyee-BxCIGrsFhw"
	);

	const formatNumber = (num: string) => {
		const n = parseInt(num);
		if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
		if (n >= 1000) return (n / 1000).toFixed(1) + "K";
		return n.toString();
	};

	const openYouTubeVideo = (videoId: string) => {
		window.open(`https://youtube.com/watch?v=${videoId}`, "_blank");
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-[#ffafcc] via-[#b388eb] to-[#ff8fab]">
			{/* Header Section */}
			<div className="bg-white shadow-sm sticky top-0 z-50">
				<div className="container mx-auto px-4 py-3 flex justify-between items-center">
					<div className="flex items-center gap-2">
						<img
							src="/little-lullabies-logo.jpg"
							alt="LittleLullabies Logo"
							className="h-10 w-10 rounded-full"
						/>
						<span className="font-semibold text-xl text-gray-800">
							LittleLullabies
						</span>
					</div>
					<div className="flex items-center gap-3 sm:gap-4">
						<a
							href="https://www.instagram.com/littlelullabiestunes"
							target="_blank"
							rel="noopener noreferrer"
							className="text-pink-500 hover:text-pink-600 transition-colors"
						>
							<Instagram className="h-6 w-6 drop-shadow-sm" />
						</a>
						<a
							href="https://www.facebook.com/share/18X7H4zAha/?mibextid=wwXIfr"
							target="_blank"
							rel="noopener noreferrer"
							className="text-[#1877F2] hover:text-[#145dbf] transition-colors"
						>
							<Facebook className="h-6 w-6 drop-shadow-sm" />
						</a>
					</div>

				</div>
			</div>

			{/* Hero Section */}
			<header className="relative py-6 sm:py-10 px-4 sm:px-6 text-center bg-gradient-to-r from-purple-200 via-pink-200 to-red-200">
				<div className="absolute inset-0 bg-white/40 backdrop-blur-lg rounded-lg shadow-md"></div>
				<div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">

					{/* Left Image */}
					<motion.div
						animate={{ opacity: [0, 1] }}
						transition={{ duration: 1 }}
						className="w-20 sm:w-32 md:w-48"
					>
						<img src="/guitar-teddy.png" alt="Left Image" className="w-full h-auto" />
					</motion.div>

					{/* Center Title and Content */}
					<div className="flex flex-col items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-5 animate-fade-in">
						{/* Logo + Title */}
						<div className="flex items-center space-x-3 sm:space-x-4">
							<div className="bg-white p-2 sm:p-3 rounded-full shadow-lg transition-transform hover:scale-110">
								<Music className="h-7 w-7 sm:h-10 sm:w-10 text-purple-500" />
							</div>
							<h1 className="text-4xl sm:text-6xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-red-500 text-transparent bg-clip-text drop-shadow-md">
								LittleLullabies
							</h1>
						</div>

						{/* Stars */}
						<div className="flex justify-center gap-1 sm:gap-2 mb-4">
							{[1, 2, 3, 4, 5].map((star) => (
								<Star
									key={star}
									className="h-5 w-5 sm:h-7 sm:w-7 text-yellow-400 fill-yellow-400 drop-shadow-md animate-bounce"
								/>
							))}
						</div>

						{/* Channel Stats */}
						{channelStats && (
							<div className="w-full max-w-3xl mx-auto px-4 py-4 bg-white/70 rounded-xl shadow-md backdrop-blur-md mt-6 sm:mt-10">
								<div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10 text-gray-800 text-center">

									{/* Subscribers */}
									<div className="flex items-center gap-2">
										<Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
										<span className="font-semibold text-base sm:text-lg">
											{formatNumber(channelStats.subscriberCount)} subscribers
										</span>
									</div>

									{/* Separator (only on larger screens) */}
									<div className="hidden sm:block">
										<Separator orientation="vertical" className="h-6 bg-gray-400" />
									</div>

									{/* Videos */}
									<div className="flex items-center gap-2">
										<Youtube className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
										<span className="font-semibold text-base sm:text-lg">
											{formatNumber(channelStats.videoCount)} videos
										</span>
									</div>

									{/* Separator (only on larger screens) */}
									<div className="hidden sm:block">
										<Separator orientation="vertical" className="h-6 bg-gray-400" />
									</div>

									{/* Views */}
									<div className="flex items-center gap-2">
										<Eye className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
										<span className="font-semibold text-base sm:text-lg">
											{formatNumber(channelStats.viewCount)} views
										</span>
									</div>
								</div>
							</div>
						)}


						{/* Description */}
						<p className="max-w-md sm:max-w-3xl mx-auto font-[Caveat] text-lg sm:text-2xl text-pink-600 transform hover:scale-105 transition-all px-2">
							{CHANNEL_DESCRIPTION}
						</p>
					</div>

					{/* Right Image */}
					<motion.div
						animate={{ x: [50, 0], opacity: [0, 1] }}
						transition={{ duration: 1.5, type: 'spring', stiffness: 100 }}
						className="hidden sm:block w-32 md:w-48"
					>
						<img src="/dancing-teddy.png" alt="Right Image" className="w-full h-auto" />
					</motion.div>
				</div>
			</header>



			{/* Main Content */}
			<main className="container mx-auto px-6 py-16">
				{loading && (
					<div className="flex items-center justify-center py-16">
						<Loader2 className="h-10 w-10 animate-spin text-purple-500 opacity-80" />
					</div>
				)}

				{error && (
					<Alert variant="destructive" className="mb-6 flex items-center">
						<AlertDescription className="text-lg font-medium">
							{error} (Using demo content)
						</AlertDescription>
					</Alert>
				)}

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
					{videos.map((video) => (
						<Card
							key={video.id}
							className="overflow-hidden hover:shadow-2xl transition-transform duration-300 cursor-pointer transform hover:-translate-y-2 rounded-2xl border border-gray-200 bg-white"
							onClick={() => openYouTubeVideo(video.id)}
						>
							<div className="aspect-video relative group">
								<img
									src={video.thumbnail}
									alt={video.title}
									className="object-cover w-full h-full rounded-t-2xl"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
									<div className="bg-white/30 p-3 rounded-full backdrop-blur-md">
										<Youtube className="h-14 w-14 text-white drop-shadow-lg" />
									</div>
								</div>
							</div>

							<CardHeader className="p-5">
								<CardTitle className="text-lg font-semibold line-clamp-2 text-gray-900 mb-2">
									{video.title}
								</CardTitle>
								<CardDescription className="line-clamp-2 text-sm text-gray-600">
									{video.description}
								</CardDescription>
								<div className="flex items-center gap-5 mt-3 text-sm text-gray-500">
									<div className="flex items-center gap-1">
										<Eye className="h-4 w-4 text-blue-500" />
										<span>{formatNumber(video.viewCount)}</span>
									</div>
									<div className="flex items-center gap-1">
										<ThumbsUp className="h-4 w-4 text-green-500" />
										<span>{formatNumber(video.likeCount)}</span>
									</div>
								</div>
							</CardHeader>
						</Card>
					))}
				</div>
			</main>
		</div>
	);
}

export default App;
