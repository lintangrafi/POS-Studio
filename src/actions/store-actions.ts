'use server';

import { db } from '@/db';
import { storeSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export type StoreTheme = 'indigo' | 'emerald' | 'rose' | 'amber' | 'violet' | 'sky';

export interface StoreSettingsData {
  id: number;
  storeName: string;
  storeSubtitle: string;
  logoInitial: string;
  theme: StoreTheme;
}

/**
 * Get store settings (public — no auth required for display)
 */
export async function getStoreSettings(): Promise<StoreSettingsData> {
  const settings = await db.query.storeSettings.findFirst();

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

  revalidatePath('/', 'layout');
  return { success: true };
}
