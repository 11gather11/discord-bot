import TwitterApi, { type ErrorV2 } from 'twitter-api-v2'
import { logger } from '@/lib/logger'

const getTwitterConfig = (): TwitterApi | null => {
	const appKey = import.meta.env.TWITTER_APP_KEY
	const appSecret = import.meta.env.TWITTER_APP_SECRET
	const accessToken = import.meta.env.TWITTER_ACCESS_TOKEN
	const accessSecret = import.meta.env.TWITTER_ACCESS_SECRET

	if (!(appKey && appSecret && accessToken && accessSecret)) {
		return null
	}

	return new TwitterApi({
		appKey,
		appSecret,
		accessToken,
		accessSecret,
	})
}

export const tweet = async (text: string): Promise<void> => {
	const client = getTwitterConfig()
	if (!client) {
		logger.warn('[Twitter] API credentials are not set, skipping tweet')
		return
	}

	try {
		await client.v2.tweet(text)
		logger.info('[Twitter] Tweet posted successfully')
	} catch (error) {
		logger.error('[Twitter] Failed to post tweet:', (error as ErrorV2).errors)
	}
}
