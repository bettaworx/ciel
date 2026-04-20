import { registerCspSources } from '../registry'

registerCspSources('img-src', 'https://cdn.jsdelivr.net')
// Required for fetching emojibase-data JSON from jsDelivr (used in /test/emoji)
registerCspSources('connect-src', 'https://cdn.jsdelivr.net')
