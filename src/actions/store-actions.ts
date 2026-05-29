'use server';

import { db } from '@/db';
import { storeSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { revalidatePath, revalidateTag } from 'next/cache';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS, CACHE_DURATION } from '@/lib/cache';

export type StoreTheme = 'indigo' | 'emerald' | 'rose' | 'amber' | 'violet' | 'sky';

export interface StoreSettingsData {
  id: number;
  storeName: string;
  storeSubtitle: string;
  logoInitial: string;
  theme: StoreTheme;
}

const getCachedStoreSettings = unstable_cache(
  async () => {
    return db.query.storeSettings.findFirst();
  },
  ['store-settings'],
  { tags: [CACHE_TAGS.storeSettings], revalidate: CACHE_DURATION.long }
);

/**
 * Get store settings (public — no auth required for display)
 */
export async function getStoreSettings(): Promise<StoreSettingsData> {
  const settings = await getCachedStoreSettings();

  if (!settings) {
    // Create default settings if none exist
    const [created] = await db.insert(storeSettings).values({
      storeName: 'Studio POS',
      storeSubtitle: 'Point of Sale',
      logoInitial: 'S',
      theme: 'indigo',
    }).returning();

    return {
      id: created.id,
      storeName: created.storeName,
      storeSubtitle: created.storeSubtitle,
      logoInitial: created.logoInitial,
      theme: created.theme as StoreTheme,
    };
  }

  return {
    id: settings.id,
    storeName: settings.storeName,
    storeSubtitle: settings.storeSubtitle,
    logoInitial: settings.logoInitial,
    theme: settings.theme as StoreTheme,
  };
}

/**
 * Update store settings (admin only)
 */
export async function updateStoreSettings(payload: {
  storeName: string;
  storeSubtitle: string;
  logoInitial: string;
  theme: StoreTheme;
}) {
  await requireAdmin();

  if (!payload.storeName?.trim()) {
    return { error: 'Nama bisnis wajib diisi.' };
  }

  if (!payload.logoInitial?.trim()) {
    return { error: 'Inisial logo wajib diisi.' };
  }

  const validThemes: StoreTheme[] = ['indigo', 'emerald', 'rose', 'amber', 'violet', 'sky'];
  if (!validThemes.includes(payload.theme)) {
    return { error: 'Tema tidak valid.' };
  }

  const existing = await db.query.storeSettings.findFirst();

  if (!existing) {
    await db.insert(storeSettings).values({
      storeName: payload.storeName.trim(),
      storeSubtitle: payload.storeSubtitle.trim(),
      logoInitial: payload.logoInitial.trim().charAt(0).toUpperCase(),
      theme: payload.theme,
    });
  } else {
    await db.update(storeSettings).set({
      storeName: payload.storeName.trim(),
      storeSubtitle: payload.storeSubtitle.trim(),
      logoInitial: payload.logoInitial.trim().charAt(0).toUpperCase(),
      theme: payload.theme,
      updatedAt: new Date(),
    }).where(eq(storeSettings.id, existing.id));
  }

  revalidateTag(CACHE_TAGS.storeSettings);
  revalidatePath('/', 'layout');
  return { success: true };
}
