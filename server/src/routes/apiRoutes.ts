import { Router } from 'express';
import { RoomController } from '../controllers/roomController';

const router = Router();

router.get('/health', RoomController.getHealth);
router.get('/rooms/:roomId', RoomController.getRoomInfo);

export default router;
