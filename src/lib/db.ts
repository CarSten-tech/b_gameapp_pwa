import { get, set, del, keys } from 'idb-keyval';

export const db = {
  saveSound: async (id: number, blob: Blob) => {
    await set(`sound_${id}`, blob);
  },
  getSound: async (id: number): Promise<Blob | undefined> => {
    return await get(`sound_${id}`);
  },
  deleteSound: async (id: number) => {
    await del(`sound_${id}`);
  },
  getAllSoundIds: async (): Promise<string[]> => {
    const allKeys = await keys();
    return allKeys.filter(k => typeof k === 'string' && k.startsWith('sound_')) as string[];
  }
};
