import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface UserPreferences {
  watchlist: string[];
  customItems: string[];
  premium?: boolean;
  travelCost?: number;
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log('User preferences loaded from Firestore');
      return docSnap.data() as UserPreferences;
    } else {
      console.log('No user preferences found in Firestore');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }
}

export async function saveUserPreferences(userId: string, preferences: Partial<UserPreferences>) {
  try {
    console.log('Saving user preferences to Firestore...', userId, preferences);
    const docRef = doc(db, 'users', userId);
    // setDoc with merge: true allows updating specific fields without overwriting the whole document
    await setDoc(docRef, preferences, { merge: true });
    console.log('User preferences saved successfully');
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
}
