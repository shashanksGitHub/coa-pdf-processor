import express from 'express';
import { firestore, isFirestoreAvailable } from '../config/firebase.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Collection name for reviews
const REVIEWS_COLLECTION = 'reviews';

/**
 * POST /api/reviews
 * Submit a new review (authenticated users only)
 */
router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    if (!isFirestoreAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
      });
    }

    const { rating, title, comment } = req.body;
    const userId = req.user.uid;
    const userEmail = req.user.email;

    // Validation
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be a number between 1 and 5',
      });
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Comment must be at least 10 characters long',
      });
    }

    if (comment.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Comment must be less than 2000 characters',
      });
    }

    if (title && title.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Title must be less than 100 characters',
      });
    }

    // Check for duplicate submission (same user within 1 minute)
    const recentReviews = await firestore
      .collection(REVIEWS_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!recentReviews.empty) {
      const lastReview = recentReviews.docs[0].data();
      const lastReviewTime = new Date(lastReview.createdAt).getTime();
      const oneMinuteAgo = Date.now() - 60000;

      if (lastReviewTime > oneMinuteAgo) {
        return res.status(429).json({
          success: false,
          error: 'Please wait before submitting another review',
        });
      }
    }

    // Create review document
    const reviewData = {
      userId,
      userEmail,
      rating: Math.round(rating),
      title: title?.trim() || '',
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await firestore.collection(REVIEWS_COLLECTION).add(reviewData);

    console.log(`✅ Review submitted by user: ${userId}, id: ${docRef.id}`);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: {
        id: docRef.id,
        ...reviewData,
      },
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit review',
    });
  }
});

/**
 * GET /api/reviews/my-reviews
 * Get current user's reviews
 */
router.get('/my-reviews', verifyFirebaseToken, async (req, res) => {
  try {
    if (!isFirestoreAvailable()) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const userId = req.user.uid;

    const snapshot = await firestore
      .collection(REVIEWS_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const reviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

