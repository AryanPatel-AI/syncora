import { Router } from 'express';
import { RoomController } from '../controllers/roomController';
import { VideoController } from '../controllers/videoController';
import { AuthController } from '../controllers/authController';
import { UserDataController } from '../controllers/userDataController';
import { QueueController } from '../controllers/queueController';
import { BroadcastController } from '../controllers/broadcastController';
import { requireAuth, optionalAuth } from '../utils/authMiddleware';

const router = Router();

// Health & Room Status
router.get('/health', RoomController.getHealth);
router.get('/rooms/:roomId', RoomController.getRoomInfo);

// Videos & Discovery (YouTube Data API Proxy + Curated Catalog)
router.get('/videos/search', VideoController.search);
router.get('/videos/live', VideoController.getLive);
router.get('/videos/popular', VideoController.getPopular);
router.get('/videos/categories', VideoController.getCategories);
router.get('/videos/:videoId', VideoController.getDetails);

// Authentication & Profile
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.get('/auth/me', requireAuth, AuthController.getMe);
router.put('/auth/profile', requireAuth, AuthController.updateProfile);

// User Personal Data (Saved / Watch Later, History, Follows, Notifications)
router.get('/user/saved', requireAuth, UserDataController.getSaved);
router.post('/user/saved', requireAuth, UserDataController.addSaved);
router.delete('/user/saved/:videoId', requireAuth, UserDataController.removeSaved);

router.get('/user/history', requireAuth, UserDataController.getHistory);
router.post('/user/history', requireAuth, UserDataController.recordHistory);
router.delete('/user/history', requireAuth, UserDataController.clearHistory);

router.get('/user/follows', requireAuth, UserDataController.getFollows);
router.post('/user/follows', requireAuth, UserDataController.followChannel);
router.delete('/user/follows/:channelId', requireAuth, UserDataController.unfollowChannel);

router.get('/user/notifications', requireAuth, UserDataController.getNotifications);
router.post('/user/notifications/read', requireAuth, UserDataController.markNotificationsRead);

// Reporting
router.post('/reports', optionalAuth, UserDataController.createReport);

// Room Queue
router.get('/rooms/:roomId/queue', QueueController.getQueue);
router.post('/rooms/:roomId/queue', QueueController.addToQueue);
router.delete('/rooms/:roomId/queue/:queueId', QueueController.removeFromQueue);
router.post('/rooms/:roomId/queue/next', QueueController.advanceQueue);

// Creator Broadcasting (Optional Module / Mux & Amazon IVS)
router.get('/broadcasts/status', BroadcastController.getStatus);
router.post('/broadcasts/create', optionalAuth, BroadcastController.createBroadcast);
router.get('/broadcasts/:id', BroadcastController.getBroadcast);
router.post('/broadcasts/:id/end', optionalAuth, BroadcastController.endBroadcast);
router.post('/broadcasts/webhook', BroadcastController.webhook);

export default router;
