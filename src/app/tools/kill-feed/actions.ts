'use server';

import { getRecentEvents, getEventDetails, searchPlayer, getPlayerStats, getEventMetadata } from '@/lib/kill-feed-service';
import { getItemNameService } from '@/lib/item-service';

export async function getEventMetadataAction(event: any, region: 'west' | 'east' | 'europe' = 'west') {
  return await getEventMetadata(event, region);
}

export async function resolveItemNameAction(itemId: string, locale: string = 'en') {
  try {
    const name = await getItemNameService(itemId, locale);
    return name || itemId;
  } catch (error) {
    console.error('Error resolving item name:', error);
    return itemId;
  }
}

export async function fetchRecentEvents(region: 'west' | 'east' | 'europe' = 'west', limit: number = 20, offset: number = 0) {
  return await getRecentEvents(region, limit, offset);
}

export async function fetchEventDetails(eventId: number, region: 'west' | 'east' | 'europe' = 'west') {
  return await getEventDetails(eventId, region);
}

export async function searchPlayerAction(query: string, region: 'west' | 'east' | 'europe' = 'west') {
  return await searchPlayer(query, region);
}

export async function getPlayerStatsAction(playerId: string, region: 'west' | 'east' | 'europe' = 'west') {
  return await getPlayerStats(playerId, region);
}
