import { Router } from 'express';
import { itemShareController } from '../controllers/itemShareController.js';

const router = Router();

router.patch('/:id', itemShareController.update);
router.delete('/:id', itemShareController.remove);

export default router;
