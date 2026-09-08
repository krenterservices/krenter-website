import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'property/:id',
    renderMode: RenderMode.Prerender,
    // IMPORTANT: You need to replace this with actual logic to fetch property IDs from your backend.
    // This is a placeholder example.
    getPrerenderParams: async () => {
      // In a real application, you would fetch IDs from a database or API.
      // Example: const propertyIds = await fetchPropertyIdsFromFirestore();
      // For now, returning a static ID.
      return [{ id: '123' }]; // Replace '123' with actual property IDs
    },
  },
  {
    path: 'edit-property/:id',
    renderMode: RenderMode.Prerender,
    // IMPORTANT: You need to replace this with actual logic to fetch property IDs from your backend.
    // This is a placeholder example.
    getPrerenderParams: async () => {
      // In a real application, you would fetch IDs from a database or API.
      // For now, returning a static ID.
      return [{ id: '456' }]; // Replace '456' with actual property IDs
    },
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
