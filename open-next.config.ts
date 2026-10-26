import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
import d1NextTagCache from '@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache';

// The D1 tag cache is used plain: the filter wrapper renames it, so populateCache skips creating the revalidations table and the webhook becomes a silent no-op.
export default defineCloudflareConfig({ incrementalCache: r2IncrementalCache, queue: doQueue, tagCache: d1NextTagCache });
