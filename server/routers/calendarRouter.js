import express from 'express';
import { requireAuth } from '../middleware/middleware.js';
import { getTodaysEvents, getEventsByDate } from '../controllers/calendarController.js';

const router = express.Router();

// Route pour récupérer les événements d'une date spécifique (format: YYYY-MM-DD)
router.get(['/date', '/date/:date'], requireAuth, getEventsByDate);

// Ancienne route maintenue pour la rétrocompatibilité
router.get('/today', requireAuth, getTodaysEvents);

export default router;
