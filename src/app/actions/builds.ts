'use server';

import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';

export async function incrementBuildViewAction(buildId: string) {
  try {
    const buildRef = adminDb.collection('builds').doc(buildId);

    // Check if document exists first to avoid errors
    const doc = await buildRef.get();
    if (!doc.exists) {
      return { success: false, error: 'Build not found' };
    }

    await buildRef.update({
      views: FieldValue.increment(1)
    });

    return { success: true };
  } catch (error) {
    console.error('[BuildAction] Error incrementing view:', error);
    return { success: false, error: 'Failed to increment view' };
  }
}

export async function deleteBuildAction(buildId: string, userId: string) {
  try {
    if (!userId) {
      return { success: false, error: 'Unauthorized - Please log in' };
    }

    // Get build to check authorship
    const buildRef = adminDb.collection('builds').doc(buildId);
    const buildDoc = await buildRef.get();

    if (!buildDoc.exists) {
      return { success: false, error: 'Build not found' };
    }

    const buildData = buildDoc.data();
    
    // Check if user is author or admin
    const isAuthor = buildData?.authorId === userId;
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const isAdmin = userDoc.data()?.isAdmin === true;

    if (!isAuthor && !isAdmin) {
      return { success: false, error: 'Unauthorized - Only author or admin can delete' };
    }

    // Delete the build
    await buildRef.delete();
    
    // Revalidate builds page
    revalidatePath('/builds');
    revalidatePath(`/builds/${buildData?.category}/${buildId}`);

    return { success: true };
  } catch (error) {
    console.error('[BuildAction] Error deleting build:', error);
    return { success: false, error: 'Failed to delete build' };
  }
}

export async function hideBuildAction(buildId: string, userId: string, hidden: boolean) {
  try {
    if (!userId) {
      return { success: false, error: 'Unauthorized - Please log in' };
    }

    // Get build to check authorship
    const buildRef = adminDb.collection('builds').doc(buildId);
    const buildDoc = await buildRef.get();

    if (!buildDoc.exists) {
      return { success: false, error: 'Build not found' };
    }

    const buildData = buildDoc.data();
    
    // Check if user is author or admin
    const isAuthor = buildData?.authorId === userId;
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const isAdmin = userDoc.data()?.isAdmin === true;

    if (!isAuthor && !isAdmin) {
      return { success: false, error: 'Unauthorized - Only author or admin can hide' };
    }

    // Update hidden status
    await buildRef.update({
      hidden,
      updatedAt: FieldValue.serverTimestamp()
    });
    
    // Revalidate builds page
    revalidatePath('/builds');
    revalidatePath(`/builds/${buildData?.category}/${buildId}`);

    return { success: true };
  } catch (error) {
    console.error('[BuildAction] Error hiding build:', error);
    return { success: false, error: 'Failed to hide build' };
  }
}

export async function updateBuildAction(buildId: string, userId: string, updates: any) {
  try {
    if (!userId) {
      return { success: false, error: 'Unauthorized - Please log in' };
    }

    // Get build to check authorship
    const buildRef = adminDb.collection('builds').doc(buildId);
    const buildDoc = await buildRef.get();

    if (!buildDoc.exists) {
      return { success: false, error: 'Build not found' };
    }

    const buildData = buildDoc.data();
    
    // Check if user is author or admin
    const isAuthor = buildData?.authorId === userId;
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const isAdmin = userDoc.data()?.isAdmin === true;

    if (!isAuthor && !isAdmin) {
      return { success: false, error: 'Unauthorized - Only author or admin can update' };
    }

    // Update build
    await buildRef.update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp()
    });
    
    // Revalidate pages
    revalidatePath('/builds');
    revalidatePath(`/builds/${buildData?.category}/${buildId}`);

    return { success: true };
  } catch (error) {
    console.error('[BuildAction] Error updating build:', error);
    return { success: false, error: 'Failed to update build' };
  }
}
