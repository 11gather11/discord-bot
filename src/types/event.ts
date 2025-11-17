import type { ClientEvents } from 'discord.js'

export interface Event<T extends keyof ClientEvents = keyof ClientEvents> {
	name: T
	once: boolean
	execute: (...parameters: ClientEvents[T]) => Promise<void> | void
}
