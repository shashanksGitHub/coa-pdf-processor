import express from 'express';
import { firestore, isFirestoreAvailable } from '../config/firebase.js';
import stripe from '../config/stripe.js';

const router = express.Router();

// Admin secret from environment variable (default for development)
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'coa-processor-2025';

// Collection names
const USERS_COLLECTION = 'users';
const REVIEWS_COLLECTION = 'reviews';

/**
 * Middleware to verify admin access
 */
function verifyAdminAccess(req, res, next) {
  const adminToken = req.headers['x-admin-token'];
  
  if (!adminToken || adminToken !== ADMIN_SECRET) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Invalid admin credentials',
    });
  }
  
  next();
}

/**
 * POST /api/admin/login
 * Verify admin secret and return success
 */
router.post('/login', (req, res) => {
  const { secret } = req.body;
  
  if (!secret) {
    return res.status(400).json({
      success: false,
      error: 'Admin secret is required',
    });
  }
  
  if (secret !== ADMIN_SECRET) {
    return res.status(401).json({
      success: false,
      error: 'Invalid admin secret',
    });
  }
  
  console.log('✅ Admin login successful');
  
  res.json({
    success: true,
    message: 'Admin access granted',
    token: ADMIN_SECRET, // Return the secret as token for subsequent requests
  });
});

/**
 * GET /api/admin/dashboard
 * Get dashboard metrics and analytics
 */
router.get('/dashboard', verifyAdminAccess, async (req, res) => {
  try {
    if (!isFirestoreAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
      });
    }

    // Get all users
    const usersSnapshot = await firestore.collection(USERS_COLLECTION).get();
    const users = usersSnapshot.docs.map(doc => doc.data());

    // Calculate metrics
    const totalUsers = users.length;
    const activeSubscribers = users.filter(u => u.subscriptionStatus === 'active').length;
    const canceledSubscribers = users.filter(u => u.subscriptionStatus === 'canceled').length;
    const freeUsers = users.filter(u => u.accountType === 'free' || !u.accountType).length;

    // Calculate total revenue from subscription history
    // Sum up based on subscription data - each active subscriber pays $39/month
    let totalRevenueCents = 0;
    
    // Try to get revenue from Stripe if available
    try {
      const charges = await stripe.charges.list({
        limit: 100,
      });
      totalRevenueCents = charges.data
        .filter(charge => charge.paid && !charge.refunded)
        .reduce((sum, charge) => sum + charge.amount, 0);
    } catch (stripeError) {
      console.warn('Could not fetch Stripe charges:', stripeError.message);
      // Fallback: estimate based on subscribers
      totalRevenueCents = activeSubscribers * 3900; // $39 per active subscriber
    }

    // Get reviews count
    const reviewsSnapshot = await firestore.collection(REVIEWS_COLLECTION).get();
    const totalReviews = reviewsSnapshot.size;

    // Calculate average rating
    let avgRating = 0;
    if (totalReviews > 0) {
      const totalRating = reviewsSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().rating || 0);
      }, 0);
      avgRating = totalRating / totalReviews;
    }

    // Get total downloads used
    const totalDownloadsUsed = users.reduce((sum, u) => sum + (u.downloadsUsedThisMonth || 0), 0);

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenueCents / 100, // Convert to dollars
        totalRevenueCents,
        totalUsers,
        totalCustomers: activeSubscribers + canceledSubscribers, // Users who have/had subscriptions
        activeSubscribers,
        canceledSubscribers,
        freeUsers,
        totalReviews,
        avgRating: Math.round(avgRating * 10) / 10,
        totalDownloadsUsed,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users with pagination
 */
router.get('/users', verifyAdminAccess, async (req, res) => {
  try {
    if (!isFirestoreAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    // Get all users ordered by creation date
    let query = firestore.collection(USERS_COLLECTION)
      .orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    
    let users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(u => 
        u.email?.toLowerCase().includes(searchLower) ||
        u.displayName?.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const totalUsers = users.length;
    const totalPages = Math.ceil(totalUsers / limit);
    const startIndex = (page - 1) * limit;
    const paginatedUsers = users.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      data: {
        users: paginatedUsers.map(u => ({
          id: u.id,
          uid: u.uid,
          email: u.email,
          displayName: u.displayName || '',
          accountType: u.accountType || 'free',
          subscriptionStatus: u.subscriptionStatus || 'none',
          downloadsRemaining: u.downloadsRemaining || 0,
          downloadsUsedThisMonth: u.downloadsUsedThisMonth || 0,
          currentPeriodEnd: u.currentPeriodEnd || null,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        })),
        pagination: {
          page,
          limit,
          totalUsers,
          totalPages,
          hasMore: page < totalPages,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/reviews
 * Get all reviews with pagination
 */
router.get('/reviews', verifyAdminAccess, async (req, res) => {
  try {
    if (!isFirestoreAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Get all reviews ordered by creation date (newest first)
    const snapshot = await firestore.collection(REVIEWS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();

    const reviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Pagination
    const totalReviews = reviews.length;
    const totalPages = Math.ceil(totalReviews / limit);
    const startIndex = (page - 1) * limit;
    const paginatedReviews = reviews.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      data: {
        reviews: paginatedReviews,
        pagination: {
          page,
          limit,
          totalReviews,
          totalPages,
          hasMore: page < totalPages,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

