import express from 'express';
import { firestore } from '../config/firebase.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Collection name for company info
const COLLECTION_NAME = 'companyInfo';

/**
 * GET /api/company/info
 * Get company info for the authenticated user
 */
router.get('/info', verifyFirebaseToken, async (req, res) => {
  try {
    if (!firestore) {
      return res.status(503).json({
        success: false,
        error: 'Firestore not available',
      });
    }

    const userId = req.user.uid;
    const docRef = firestore.collection(COLLECTION_NAME).doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.json({
        success: true,
        data: null,
        message: 'No company info found',
      });
    }

    res.json({
      success: true,
      data: doc.data(),
    });
  } catch (error) {
    console.error('Error getting company info:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/company/info
 * Save company info for the authenticated user
 */
router.post('/info', verifyFirebaseToken, async (req, res) => {
  try {
    if (!firestore) {
      return res.status(503).json({
        success: false,
        error: 'Firestore not available',
      });
    }

    const userId = req.user.uid;
    const { companyName, companyAddress, logoUrl, theme, layout } = req.body;

    // Validate required fields
    if (!companyName) {
      return res.status(400).json({
        success: false,
        error: 'Company name is required',
      });
    }

    const companyData = {
      companyName: companyName.trim(),
      companyAddress: companyAddress?.trim() || '',
      logoUrl: logoUrl || null,
      theme: theme || 'classic',
      layout: layout || 'classic',
      updatedAt: new Date().toISOString(),
      userId,
    };

    const docRef = firestore.collection(COLLECTION_NAME).doc(userId);
    await docRef.set(companyData, { merge: true });

    res.json({
      success: true,
      message: 'Company info saved successfully',
      data: companyData,
    });
  } catch (error) {
    console.error('Error saving company info:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/company/info
 * Delete company info for the authenticated user
 */
router.delete('/info', verifyFirebaseToken, async (req, res) => {
  try {
    if (!firestore) {
      return res.status(503).json({
        success: false,
        error: 'Firestore not available',
      });
    }

    const userId = req.user.uid;
    const docRef = firestore.collection(COLLECTION_NAME).doc(userId);
    await docRef.delete();

    res.json({
      success: true,
      message: 'Company info deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting company info:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

