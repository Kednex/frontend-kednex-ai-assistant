import type { RoomContext } from '../types';

export function normalizeRooms(rooms: any[]): RoomContext[] {
    if (!rooms || !Array.isArray(rooms)) return [];

    return rooms.map(room => {
        // Handle different variations of room objects
        if (room && typeof room === 'object') {
            return {
                roomId: room.roomId || room.id || room.room_id || '',
                imageUrl: room.imageUrl || room.image_url || room.url || '',
                createdAt: room.createdAt || room.created_at || Date.now(),
            };
        }
        return null;
    }).filter((Boolean as any) as (val: any) => val is RoomContext);
}
