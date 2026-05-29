import { unstable_cache } from 'next/cache';

/**
 * Cache tags used across the application.
 * Use revalidateTag(tag) to invalidate specific caches after mutations.
 */
export const CACHE_TAGS = {
  products: 'products',
  categories: 'categories',
  storeSettings: 'store-settings',
  users: 'users',
} as const;

/**
 * Cache durations in seconds
 */
export const CACHE_DURATION = {
  short: 30,        // 30 seconds - for frequently changing data
  medium: 60 * 5,   // 5 minutes - for moderately changing data
  long: 60 * 30,    // 30 minutes - for rarely changing data (categories, settings)
} as const;

/**
 * Create a cached function with tags and revalidation period.
 * Wrapper around Next.js unstable_cache for cleaner API.
 */
export function createCachedFn<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyParts: string[],
  options: { tags: string[]; revalidate: number }
): T {
  return unstable_cache(fn, keyParts, {
    tags: options.tags,
    revalidate: options.revalidate,
  }) as unknown as T;
}
