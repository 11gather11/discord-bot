import { z } from 'zod'

const envSchema = z.object({
	DISCORD_LOG_WEBHOOK_URL: z.url().optional(),
})

envSchema.parse(process.env)

declare global {
	namespace NodeJS {
		interface ProcessEnv extends z.infer<typeof envSchema> {}
	}
}
