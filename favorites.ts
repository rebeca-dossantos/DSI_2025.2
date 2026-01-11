// favorites.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase'; // ajuste o path se necessário
import Toast from 'react-native-toast-message';

export type Place = {
  id: string;
  name: string;
  type: string;
  rating?: number;
  distance?: string;
  address?: string;
  hours?: string;
  phone?: string;
  diabeticFriendly?: boolean;
  latitude?: number;
  longitude?: number;
};

export type FavoritePlaceRow = {
  id: string;
  user_id: string;
  place_id: string;
  place_name: string | null;
  place_type: string | null;
  place_address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

const LOCAL_FAV_KEY_PREFIX = 'favorite_places_cache:'; // cache por user

async function safeGetAuthUserId(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function getActiveUserId(): Promise<string | null> {
  const uid = await safeGetAuthUserId();
  return uid;
}


export async function loadFavoritesCache(userId: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(`${LOCAL_FAV_KEY_PREFIX}${userId}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export async function saveFavoritesCache(userId: string, ids: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(`${LOCAL_FAV_KEY_PREFIX}${userId}`, JSON.stringify(Array.from(ids)));
  } catch {
    // silencioso
  }
}


export async function fetchFavoriteIds(): Promise<{
  userId: string | null;
  ids: Set<string>;
  source: 'server' | 'cache' | 'empty';
}> {
  const userId = await getActiveUserId();
  if (!userId) {
    return { userId: null, ids: new Set(), source: 'empty' };
  }

  // tenta servidor
  const { data, error } = await supabase
    .from('favorite_places')
    .select('place_id')
    .eq('user_id', userId);

  if (error) {
    const cached = await loadFavoritesCache(userId);
    return { userId, ids: cached, source: 'cache' };
  }

  const ids = new Set((data ?? []).map((r: any) => String(r.place_id)));
  // mantém cache alinhado
  await saveFavoritesCache(userId, ids);
  return { userId, ids, source: 'server' };
}


export async function fetchFavoriteRows(): Promise<{
  userId: string | null;
  rows: FavoritePlaceRow[];
  source: 'server' | 'empty';
}> {
  const userId = await getActiveUserId();
  if (!userId) return { userId: null, rows: [], source: 'empty' };

  const { data, error } = await supabase
    .from('favorite_places')
    .select('id,user_id,place_id,place_name,place_type,place_address,latitude,longitude,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { userId, rows: [], source: 'empty' };
  }

  return { userId, rows: (data ?? []) as FavoritePlaceRow[], source: 'server' };
}


export async function addFavorite(place: Place): Promise<{ ok: boolean; message?: string }> {
  const userId = await getActiveUserId();
  if (!userId) {
    return { ok: false, message: 'Usuário não autenticado (RLS ativo).' };
  }

  const cached = await loadFavoritesCache(userId);
  cached.add(place.id);
  await saveFavoritesCache(userId, cached);

  const payload = {
    user_id: userId,
    place_id: place.id,
    place_name: place.name ?? null,
    place_type: place.type ?? null,
    place_address: place.address ?? null,
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
  };

  const { error } = await supabase
    .from('favorite_places')
    .upsert(payload, { onConflict: 'user_id,place_id' });

  if (error) {
    // rollback cache
    const rollback = await loadFavoritesCache(userId);
    rollback.delete(place.id);
    await saveFavoritesCache(userId, rollback);

    return { ok: false, message: error.message };
  }

  return { ok: true };
}

export async function removeFavorite(placeId: string): Promise<{ ok: boolean; message?: string }> {
  const userId = await getActiveUserId();
  if (!userId) {
    return { ok: false, message: 'Usuário não autenticado (RLS ativo).' };
  }

  // optimistic cache
  const cached = await loadFavoritesCache(userId);
  cached.delete(placeId);
  await saveFavoritesCache(userId, cached);

  const { error } = await supabase
    .from('favorite_places')
    .delete()
    .eq('user_id', userId)
    .eq('place_id', placeId);

  if (error) {
    const rollback = await loadFavoritesCache(userId);
    rollback.add(placeId);
    await saveFavoritesCache(userId, rollback);

    return { ok: false, message: error.message };
  }

  return { ok: true };
}


export async function toggleFavorite(place: Place, isCurrentlyFavorite: boolean) {
  if (isCurrentlyFavorite) {
    return removeFavorite(place.id);
  }
  return addFavorite(place);
}
