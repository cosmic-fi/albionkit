import { adminDb } from './firebase-admin';

export async function getAllBuildsForSitemap() {
  try {
    const snapshot = await adminDb.collection('builds').select('updatedAt', 'category').get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        category: data.category || 'solo', // Default to solo if missing
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
  } catch (error) {
    console.error('Error fetching builds for sitemap:', error);
    return [];
  }
}
