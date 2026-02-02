import { create } from 'zustand';

interface MapAction {
  type: 'flyTo';
  lat: number;
  lng: number;
  zoom?: number;
}

interface MapStore {
  pendingAction: MapAction | null;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  clearAction: () => void;
}

export const useMapStore = create<MapStore>((set) => ({
  pendingAction: null,
  flyTo: (lat, lng, zoom = 13) =>
    set({ pendingAction: { type: 'flyTo', lat, lng, zoom } }),
  clearAction: () => set({ pendingAction: null }),
}));
