export interface Channel {
	kind: string
	etag: string
	pageInfo: {
		totalResults: number
		resultsPerPage: number
	}
	items: [
		{
			kind: string
			etag: string
			id: string
			contentDetails: {
				relatedPlaylists: {
					likes: string
					uploads: string
				}
			}
		},
	]
}

export interface PlaylistItems {
	kind: string
	etag: string
	nextPageToken: string
	items: [
		{
			kind: string
			etag: string
			id: string
			snippet: {
				publishedAt: string
				channelId: string
				title: string
				description: string
				thumbnails: {
					default: {
						url: string
						width: number
						height: number
					}
					medium: {
						url: string
						width: number
						height: number
					}
					high: {
						url: string
						width: number
						height: number
					}
					standard: {
						url: string
						width: number
						height: number
					}
					maxres: {
						url: string
						width: number
						height: number
					}
				}
				channelTitle: string
				playlistId: string
				position: number
				resourceId: {
					kind: string
					videoId: string
				}
				videoOwnerChannelTitle: string
				videoOwnerChannelId: string
			}
			contentDetails: {
				videoId: string
				videoPublishedAt: string
			}
		},
	]
	pageInfo: {
		totalResults: number
		resultsPerPage: number
	}
}
