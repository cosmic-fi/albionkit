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
  limit as limitQuery,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  deleteDoc,
  startAfter,
  runTransaction
} from 'firebase/firestore';
import { submitToIndexNow } from './indexnow';
import { checkAndNotifyRankUp } from './notification-service';
import { getCachedBuilds, cacheBuilds } from './builds-cache';

export type BuildCategory = 'solo' | 'small-scale' | 'pvp' | 'zvz' | 'large-scale' | 'group';

export interface BuildItem {
  Type: string;
  Quality?: number;
  Alternatives?: string[];
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
  description: string;
  longDescription?: string;
  category: BuildCategory;
  items: BuildEquipment;
  authorId: string;
  authorName: string;
  rating: number;
  ratingCount: number;
  likes: number;
  views: number;
  createdAt: Timestamp | any;
  updatedAt: Timestamp | any;
  tags?: string[];
  youtubeLink?: string;
  hidden?: boolean;

  // Advanced Details
  strengths?: string[];
  weaknesses?: string[];
  mobility?: 'low' | 'medium' | 'high';
  difficulty?: 'easy' | 'medium' | 'hard';
}

// Pagination result type
export interface PaginatedBuilds {
  builds: Build[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
  total?: number;
  currentPage?: number;
}

// Filter options type
export interface BuildFilters {
  sort?: 'recent' | 'popular' | 'rating' | 'likes';
  tag?: string;
  zone?: string;
  activity?: string;
  role?: string;
  search?: string;
  limit?: number;
  page?: number; // Page number (1-based)
}

const COLLECTION = 'builds';
const PAGE_SIZE = 24; // Optimal for grid layout (8x3, 6x4, 4x6)

function getItemSlot(itemId: string): keyof BuildEquipment | null {
  if (itemId.includes('_HEAD_')) return 'Head';
  if (itemId.includes('_ARMOR_')) return 'Armor';
  if (itemId.includes('_SHOES_')) return 'Shoes';
  if (itemId.includes('_CAPE_')) return 'Cape';
  if (itemId.includes('_BAG')) return 'Bag';
  if (itemId.includes('_MOUNT_')) return 'Mount';
  if (itemId.includes('_POTION_')) return 'Potion';
  if (itemId.includes('_MEAL_') || itemId.includes('_SANDWICH_') || itemId.includes('_SOUP_') || itemId.includes('_STEW_') || itemId.includes('_PIE_') || itemId.includes('_SALAD_') || itemId.includes('_ROAST_')) return 'Food';
  if (itemId.includes('_OFF_')) return 'OffHand';
  if (itemId.includes('_SHIELD_') || itemId.includes('_TORCH_') || itemId.includes('_BOOK_') || itemId.includes('_TOTEM_') || itemId.includes('_HORN_')) return 'OffHand';
  if (itemId.includes('_MAIN_') || itemId.includes('_2H_')) return 'MainHand';
  return 'MainHand';
}

/**
 * Get paginated builds with SERVER-SIDE filtering
 * Efficient for large datasets with thousands of builds
 */
export const getPaginatedBuilds = async (
  filters: BuildFilters = {},
  lastDoc?: QueryDocumentSnapshot | null
): Promise<PaginatedBuilds> => {
  const {
    sort = 'recent',
    tag,
    zone,
    activity,
    role,
    search,
    limit = PAGE_SIZE,
    page
  } = filters;

  try {
    const buildsRef = collection(db, COLLECTION);
    const constraints: any[] = [];
    
    // Start with hidden filter
    constraints.push(where('hidden', '==', false));

    // SERVER-SIDE tag filtering using array-contains
    // This ensures we only fetch matching builds from Firestore
    if (tag && tag !== 'all') {
      constraints.push(where('tags', 'array-contains', tag));
    } else if (zone && zone !== 'all') {
      constraints.push(where('tags', 'array-contains', zone));
    } else if (activity && activity !== 'all') {
      constraints.push(where('tags', 'array-contains', activity));
    } else if (role && role !== 'all') {
      constraints.push(where('tags', 'array-contains', role));
    }

    // Add sorting
    if (sort === 'popular') {
      constraints.push(orderBy('views', 'desc'));
    } else if (sort === 'rating') {
      constraints.push(orderBy('rating', 'desc'));
    } else if (sort === 'likes') {
      constraints.push(orderBy('likes', 'desc'));
    } else {
      constraints.push(orderBy('createdAt', 'desc'));
    }

    // Add pagination cursor
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    constraints.push(limitQuery(limit));

    let q = query(buildsRef, ...constraints);
    const snapshot = await getDocs(q);

    let builds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Build));

    // CLIENT-SIDE search (text search can't be done with Firestore queries)
    if (search && search.trim()) {
      const term = search.toLowerCase();
      builds = builds.filter(b => 
        b.title.toLowerCase().includes(term) ||
        b.authorName.toLowerCase().includes(term) ||
        b.category.toLowerCase().includes(term) ||
        b.tags?.some(t => t.toLowerCase().includes(term))
      );
    }

    const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
    const hasMore = snapshot.docs.length === limit;

    // Get total count for pagination - MUST respect filters
    let total: number | undefined;
    if (!page || page === 1) {
      try {
        // Count query that respects the active filters
        const countConstraints: any[] = [where('hidden', '==', false)];
        
        // Add the same tag filter we used for the main query
        if (tag && tag !== 'all') {
          countConstraints.push(where('tags', 'array-contains', tag));
        } else if (zone && zone !== 'all') {
          countConstraints.push(where('tags', 'array-contains', zone));
        } else if (activity && activity !== 'all') {
          countConstraints.push(where('tags', 'array-contains', activity));
        } else if (role && role !== 'all') {
          countConstraints.push(where('tags', 'array-contains', role));
        }
        
        const countQuery = query(buildsRef, ...countConstraints);
        const countSnapshot = await getDocs(countQuery);
        total = countSnapshot.size;
      } catch (countError) {
        console.warn('Could not get filtered total count:', countError);
        // Fallback: use the number of builds we got
        total = builds.length;
      }
    }

    const result: PaginatedBuilds = {
      builds,
      lastDoc: newLastDoc,
      hasMore,
      currentPage: page || 1,
      total
    };

    return result;
  } catch (error) {
    console.error('Error fetching paginated builds:', error);
    return { builds: [], lastDoc: null, hasMore: false, currentPage: page || 1 };
  }
};

/**
 * Optimized version of getBuildsAll using pagination
 */
export const getBuildsAll = async (
  sort: 'recent' | 'popular' | 'rating' | 'likes' = 'recent',
  limitCount: number = PAGE_SIZE,
  lastDoc?: QueryDocumentSnapshot | null
): Promise<{ builds: Build[], lastDoc: QueryDocumentSnapshot | null }> => {
  const result = await getPaginatedBuilds({ sort, limit: limitCount }, lastDoc);
  return { builds: result.builds, lastDoc: result.lastDoc };
};

// Keep existing functions for backwards compatibility
export const getBuilds = async (
  category: BuildCategory,
  sort: 'recent' | 'popular' | 'rating' | 'likes' = 'recent',
  limitCount: number = PAGE_SIZE,
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

    q = query(q, limitQuery(limitCount));

    const snapshot = await getDocs(q);
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

export const searchBuildsService = async (queryText: string, itemIds: string[] = []): Promise<Build[]> => {
  try {
    const buildsRef = collection(db, COLLECTION);
    const results: Map<string, Build> = new Map();

    if (queryText.length >= 2) {
      const qTitle = query(
        buildsRef,
        where('title', '>=', queryText),
        where('title', '<=', queryText + '\uf8ff'),
        limitQuery(5)
      );
      const snapshot = await getDocs(qTitle);
      snapshot.forEach(doc => results.set(doc.id, { id: doc.id, ...doc.data() } as Build));
    }

    if (itemIds.length > 0) {
      const targetItemId = itemIds[0];
      const slot = getItemSlot(targetItemId);

      if (slot) {
        const qItem = query(
          buildsRef,
          where(`items.${slot}.Type`, '==', targetItemId),
          limitQuery(5)
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

export const getBuild = async (id: string, userId?: string): Promise<Build | null> => {
  try {
    const docRef = doc(db, COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const build = { id: docSnap.id, ...docSnap.data() } as Build;

      if (build.hidden && userId) {
        const isAuthor = build.authorId === userId;
        if (isAuthor) return build;

        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        if (userData?.isAdmin) return build;

        return null;
      }

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

export const getUserBuilds = async (
  userId: string,
  limitCount: number = 20,
  lastDoc?: QueryDocumentSnapshot | null
): Promise<{ builds: Build[], lastDoc: QueryDocumentSnapshot | null }> => {
  try {
    let q = query(collection(db, COLLECTION), where('authorId', '==', userId), orderBy('createdAt', 'desc'));

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    q = query(q, limitQuery(limitCount));

    const snapshot = await getDocs(q);
    const builds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Build));
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

    return { builds, lastDoc: newLastDoc };
  } catch (error) {
    console.error('Error fetching user builds:', error);
    return { builds: [], lastDoc: null };
  }
};

/**
 * Get paginated user builds with caching
 */
export const getUserBuildsPaginated = async (
  userId: string,
  page: number = 1,
  limit: number = 12
): Promise<{ builds: Build[], hasMore: boolean, total: number }> => {
  try {
    const buildsRef = collection(db, COLLECTION);
    const q = query(
      buildsRef,
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limitQuery(limit)
    );

    // For page > 1, we need to fetch all previous docs to get the last one
    // This is a limitation of Firestore cursor-based pagination
    // For better performance with many pages, consider using a subcollection or denormalization
    let lastDoc: QueryDocumentSnapshot | null = null;
    if (page > 1) {
      // Fetch previous pages to get the cursor
      const prevDocsCount = (page - 1) * limit;
      const prevQuery = query(
        buildsRef,
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc'),
        limitQuery(prevDocsCount)
      );
      const prevSnapshot = await getDocs(prevQuery);
      lastDoc = prevSnapshot.docs[prevSnapshot.docs.length - 1] || null;
    }

    const qWithCursor = lastDoc
      ? query(buildsRef, where('authorId', '==', userId), orderBy('createdAt', 'desc'), startAfter(lastDoc), limitQuery(limit))
      : q;

    const snapshot = await getDocs(qWithCursor);
    const builds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Build));
    const hasMore = snapshot.docs.length === limit;

    // Get total count (only on first page to save reads)
    let total = 0;
    if (page === 1) {
      try {
        const countQuery = query(buildsRef, where('authorId', '==', userId));
        const countSnapshot = await getDocs(countQuery);
        total = countSnapshot.size;
      } catch (countError) {
        console.warn('Could not get total build count:', countError);
        total = hasMore ? ((page - 1) * limit) + builds.length : ((page - 1) * limit) + builds.length;
      }
    }

    return { builds, hasMore, total };
  } catch (error) {
    console.error('Error fetching paginated user builds:', error);
    return { builds: [], hasMore: false, total: 0 };
  }
};

/**
 * Get user's total build count (lightweight)
 */
export const getUserBuildCount = async (userId: string): Promise<number> => {
  try {
    const buildsRef = collection(db, COLLECTION);
    const countQuery = query(buildsRef, where('authorId', '==', userId));
    const countSnapshot = await getDocs(countQuery);
    return countSnapshot.size;
  } catch (error) {
    console.error('Error getting build count:', error);
    return 0;
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
        const oldRating = ratingDoc.data().value;
        const newTotalScore = currentTotalScore - oldRating + rating;
        const newAverage = newTotalScore / currentRatingCount;

        transaction.update(ratingRef, { value: rating, updatedAt: serverTimestamp() });
        transaction.update(buildRef, { rating: newAverage });
      } else {
        const newTotalScore = currentTotalScore + rating;
        const newRatingCount = currentRatingCount + 1;
        const newAverage = newTotalScore / newRatingCount;

        transaction.set(ratingRef, { value: rating, createdAt: serverTimestamp() });
        transaction.update(buildRef, { rating: newAverage, ratingCount: increment(1) });
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

    if (buildData.authorId !== authorId) {
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

    if (buildData.authorId !== authorId) {
      const userRef = doc(db, 'users', authorId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      if (!userData?.isAdmin) {
        throw new Error('Unauthorized: Only the author or admin can delete this build');
      }
    }

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

    if (buildData.authorId !== authorId) {
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
