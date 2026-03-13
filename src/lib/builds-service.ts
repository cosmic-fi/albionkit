import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  getDoc, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  limit,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  deleteDoc,
  setDoc,
  runTransaction,
  startAfter
} from 'firebase/firestore';
import { submitToIndexNow } from './indexnow';
import { checkAndNotifyRankUp } from './notification-service';

export type BuildCategory = 'solo' | 'small-scale' | 'pvp' | 'zvz' | 'large-scale' | 'group';

export interface BuildItem {
  Type: string;
  Quality?: number;
  Alternatives?: string[]; // List of alternative item Types
}

export interface BuildEquipment {
  MainHand?: BuildItem;
  OffHand?: BuildItem;
  Head?: BuildItem;
  Armor?: BuildItem;
  Shoes?: BuildItem;
  Cape?: BuildItem;
  Potion?: BuildItem;
  Food?: BuildItem;
  Mount?: BuildItem;
  Bag?: BuildItem;
}

export interface Build {
  id?: string;
  title: string;
  description: string; // Short description
  longDescription?: string; // Rich text article
  category: BuildCategory;
  items: BuildEquipment;
  authorId: string;
  authorName: string;
  rating: number; // Average rating (0-5)
  ratingCount: number;
  likes: number; // Total number of likes
  views: number;
  createdAt: Timestamp | any;
  updatedAt: Timestamp | any;
  tags?: string[];
  youtubeLink?: string;
  hidden?: boolean; // Whether the build is hidden from public view

  // Advanced Details
  strengths?: string[];
  weaknesses?: string[];
  mobility?: 'low' | 'medium' | 'high';
  difficulty?: 'easy' | 'medium' | 'hard';
}

const COLLECTION = 'builds';

// Helper to determine item slot from ID
function getItemSlot(itemId: string): keyof BuildEquipment | null {
  if (itemId.includes('_HEAD_')) return 'Head';
  if (itemId.includes('_ARMOR_')) return 'Armor';
  if (itemId.includes('_SHOES_')) return 'Shoes';
  if (itemId.includes('_CAPE_')) return 'Cape';
  if (itemId.includes('_BAG')) return 'Bag';
  if (itemId.includes('_MOUNT_')) return 'Mount';
  if (itemId.includes('_POTION_')) return 'Potion';
  if (itemId.includes('_MEAL_') || itemId.includes('_SANDWICH_') || itemId.includes('_SOUP_') || itemId.includes('_STEW_') || itemId.includes('_PIE_') || itemId.includes('_SALAD_') || itemId.includes('_ROAST_')) return 'Food';
  if (itemId.includes('_OFF_')) return 'OffHand'; // Generic offhand
  if (itemId.includes('_SHIELD_') || itemId.includes('_TORCH_') || itemId.includes('_BOOK_') || itemId.includes('_TOTEM_') || itemId.includes('_HORN_')) return 'OffHand';
  if (itemId.includes('_MAIN_') || itemId.includes('_2H_')) return 'MainHand';
  
  // Fallbacks for specific weapons that might not have _MAIN_ or _2H_ explicitly (though most do)
  // Assuming if it's not any of the above and is a weapon, it's MainHand
  return 'MainHand'; 
}

export const searchBuildsService = async (queryText: string, itemIds: string[] = []): Promise<Build[]> => {
  try {
    const buildsRef = collection(db, COLLECTION);
    const results: Map<string, Build> = new Map();

    // 1. Search by Title (prefix)
    if (queryText.length >= 2) {
      // Note: This is case-sensitive. For better search, we'd need a lowercase index or separate search service.
      // We'll try to match exact case or Capitalized (standard for titles)
      const qTitle = query(
        buildsRef, 
        where('title', '>=', queryText),
        where('title', '<=', queryText + '\uf8ff'),
        limit(5)
      );
      const snapshot = await getDocs(qTitle);
      snapshot.forEach(doc => results.set(doc.id, { id: doc.id, ...doc.data() } as Build));
    }

    // 2. Search by Item Usage (if items found)
    // We only take the first item to avoid too many queries
    if (itemIds.length > 0) {
      const targetItemId = itemIds[0];
      const slot = getItemSlot(targetItemId);
      
      if (slot) {
        const qItem = query(
          buildsRef,
          where(`items.${slot}.Type`, '==', targetItemId),
          limit(5)
        );
        const snapshot = await getDocs(qItem);
        snapshot.forEach(doc => results.set(doc.id, { id: doc.id, ...doc.data() } as Build));
      }
    }

    return Array.from(results.values());
  } catch (error) {
    console.error("Error searching builds:", error);
    return [];
  }
};

export const getBuilds = async (
  category: BuildCategory,
  sort: 'recent' | 'popular' | 'rating' | 'likes' = 'recent',
  limitCount: number = 50,
  lastDoc?: QueryDocumentSnapshot | null
): Promise<{ builds: Build[], lastDoc: QueryDocumentSnapshot | null }> => {
  try {
    const buildsRef = collection(db, COLLECTION);
    let q = query(buildsRef, where('category', '==', category));

    if (sort === 'popular') {
      q = query(q, orderBy('views', 'desc'));
    } else if (sort === 'rating') {
      q = query(q, orderBy('rating', 'desc'));
    } else if (sort === 'likes') {
      q = query(q, orderBy('likes', 'desc'));
    } else {
      q = query(q, orderBy('createdAt', 'desc'));
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    q = query(q, limit(limitCount));

    const snapshot = await getDocs(q);
    // Filter out hidden builds (only visible to author/admin)
    const builds = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Build))
      .filter(build => !build.hidden);
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

    return { builds, lastDoc: newLastDoc };
  } catch (error) {
    console.error('Error fetching builds:', error);
    return { builds: [], lastDoc: null };
  }
};

export const getBuildsAll = async (
  sort: 'recent' | 'popular' | 'rating' | 'likes' = 'recent',
  limitCount: number = 50,
  lastDoc?: QueryDocumentSnapshot | null
): Promise<{ builds: Build[], lastDoc: QueryDocumentSnapshot | null }> => {
  try {
    const buildsRef = collection(db, COLLECTION);
    let q = query(buildsRef);

    if (sort === 'popular') {
      q = query(q, orderBy('views', 'desc'));
    } else if (sort === 'rating') {
      q = query(q, orderBy('rating', 'desc'));
    } else if (sort === 'likes') {
      q = query(q, orderBy('likes', 'desc'));
    } else {
      q = query(q, orderBy('createdAt', 'desc'));
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    q = query(q, limit(limitCount));

    const snapshot = await getDocs(q);
    // Filter out hidden builds (only visible to author/admin)
    const builds = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Build))
      .filter(build => !build.hidden);
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

    return { builds, lastDoc: newLastDoc };
  } catch (error) {
    console.error('Error fetching all builds:', error);
    return { builds: [], lastDoc: null };
  }
};

export const getBuild = async (id: string, userId?: string): Promise<Build | null> => {
  try {
    const docRef = doc(db, COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const build = { id: docSnap.id, ...docSnap.data() } as Build;
      
      // If build is hidden, only show to author or admin
      if (build.hidden && userId) {
        const isAuthor = build.authorId === userId;
        if (isAuthor) return build;
        
        // Check if user is admin
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        if (userData?.isAdmin) return build;
        
        // Hidden build, user is not author or admin
        return null;
      }
      
      // Build is not hidden, return it
      return build;
    }
    return null;
  } catch (error) {
    console.error('Error fetching build:', error);
    return null;
  }
};

export const createBuild = async (build: Omit<Build, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'ratingCount' | 'views' | 'likes'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...build,
      rating: 0,
      ratingCount: 0,
      views: 0,
      likes: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Check for rank up (fire and forget)
    getUserBuilds(build.authorId).then(({ builds }) => {
      checkAndNotifyRankUp(build.authorId, builds);
    }).catch(err => console.error('Error checking rank up:', err));

    try {
      const host = 'https://albionkit.com';
      const category = encodeURIComponent(build.category);
      const buildUrl = `${host}/builds/${category}/${docRef.id}`;
      const listingUrl = `${host}/builds`;
      submitToIndexNow([buildUrl, listingUrl]);
    } catch (e) {
      console.error('Error submitting build to IndexNow', e);
    }

    return docRef.id;
  } catch (error) {
    console.error('Error creating build:', error);
    throw error;
  }
};

export const getUserBuilds = async (userId: string, limitCount: number = 20, lastDoc?: QueryDocumentSnapshot | null): Promise<{ builds: Build[], lastDoc: QueryDocumentSnapshot | null }> => {
  try {
    let q = query(collection(db, COLLECTION), where('authorId', '==', userId), orderBy('createdAt', 'desc'));
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    q = query(q, limit(limitCount));

    const snapshot = await getDocs(q);
    const builds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Build));
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

    return { builds, lastDoc: newLastDoc };
  } catch (error) {
    console.error('Error fetching user builds:', error);
    return { builds: [], lastDoc: null };
  }
};

export const toggleBuildLike = async (buildId: string, userId: string): Promise<boolean> => {
  if (!userId || !buildId) return false;
  
  const buildRef = doc(db, COLLECTION, buildId);
  const likeRef = doc(db, COLLECTION, buildId, 'likes', userId);

  try {
    await runTransaction(db, async (transaction) => {
      const likeDoc = await transaction.get(likeRef);

      if (likeDoc.exists()) {
        transaction.delete(likeRef);
        transaction.update(buildRef, { likes: increment(-1) });
      } else {
        transaction.set(likeRef, { createdAt: serverTimestamp() });
        transaction.update(buildRef, { likes: increment(1) });
      }
    });
    return true;
  } catch (e) {
    console.error("Error toggling like", e);
    return false;
  }
};

export const getBuildLikeStatus = async (buildId: string, userId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, COLLECTION, buildId, 'likes', userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error('Error checking like status:', error);
    return false;
  }
};

export const rateBuild = async (buildId: string, userId: string, rating: number) => {
  try {
    if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');

    const buildRef = doc(db, COLLECTION, buildId);
    const ratingRef = doc(db, COLLECTION, buildId, 'ratings', userId);

    await runTransaction(db, async (transaction) => {
      const buildDoc = await transaction.get(buildRef);
      const ratingDoc = await transaction.get(ratingRef);

      if (!buildDoc.exists()) {
        throw new Error("Build does not exist!");
      }

      const buildData = buildDoc.data() as Build;
      const currentRatingCount = buildData.ratingCount || 0;
      const currentAverage = buildData.rating || 0;
      const currentTotalScore = currentAverage * currentRatingCount;

      if (ratingDoc.exists()) {
        // User is updating their rating
        const oldRating = ratingDoc.data().value;
        const newTotalScore = currentTotalScore - oldRating + rating;
        const newAverage = newTotalScore / currentRatingCount;

        transaction.update(ratingRef, { 
          value: rating, 
          updatedAt: serverTimestamp() 
        });
        
        transaction.update(buildRef, { 
          rating: newAverage 
        });
      } else {
        // User is rating for the first time
        const newTotalScore = currentTotalScore + rating;
        const newRatingCount = currentRatingCount + 1;
        const newAverage = newTotalScore / newRatingCount;

        transaction.set(ratingRef, { 
          value: rating, 
          createdAt: serverTimestamp() 
        });

        transaction.update(buildRef, { 
          rating: newAverage,
          ratingCount: increment(1)
        });
      }
    });
  } catch (error) {
    console.error('Error rating build:', error);
    throw error;
  }
};

export const getBuildUserRating = async (buildId: string, userId: string): Promise<number | null> => {
  try {
    const docRef = doc(db, COLLECTION, buildId, 'ratings', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().value;
    }
    return null;
  } catch (error) {
    console.error('Error getting user rating:', error);
    return null;
  }
};

export const updateBuild = async (buildId: string, updates: Partial<Build>, authorId: string) => {
  try {
    const buildRef = doc(db, COLLECTION, buildId);
    const buildSnap = await getDoc(buildRef);

    if (!buildSnap.exists()) {
      throw new Error('Build not found');
    }

    const buildData = buildSnap.data() as Build;
    
    // Check if user is authorized (author or admin)
    if (buildData.authorId !== authorId) {
      // Check if user is admin
      const userRef = doc(db, 'users', authorId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      if (!userData?.isAdmin) {
        throw new Error('Unauthorized: Only the author or admin can update this build');
      }
    }

    await updateDoc(buildRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('Error updating build:', error);
    throw error;
  }
};

export const deleteBuild = async (buildId: string, authorId: string) => {
  try {
    const buildRef = doc(db, COLLECTION, buildId);
    const buildSnap = await getDoc(buildRef);

    if (!buildSnap.exists()) {
      throw new Error('Build not found');
    }

    const buildData = buildSnap.data() as Build;
    
    // Check if user is authorized (author or admin)
    if (buildData.authorId !== authorId) {
      // Check if user is admin
      const userRef = doc(db, 'users', authorId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      if (!userData?.isAdmin) {
        throw new Error('Unauthorized: Only the author or admin can delete this build');
      }
    }

    // Delete the build document (subcollections will be automatically deleted)
    await deleteDoc(buildRef);

    return true;
  } catch (error) {
    console.error('Error deleting build:', error);
    throw error;
  }
};

export const hideBuild = async (buildId: string, authorId: string, hidden: boolean = true) => {
  try {
    const buildRef = doc(db, COLLECTION, buildId);
    const buildSnap = await getDoc(buildRef);

    if (!buildSnap.exists()) {
      throw new Error('Build not found');
    }

    const buildData = buildSnap.data() as Build;
    
    // Check if user is authorized (author or admin)
    if (buildData.authorId !== authorId) {
      // Check if user is admin
      const userRef = doc(db, 'users', authorId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      if (!userData?.isAdmin) {
        throw new Error('Unauthorized: Only the author or admin can hide this build');
      }
    }

    await updateDoc(buildRef, {
      hidden,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('Error hiding build:', error);
    throw error;
  }
};
