import { Router } from 'express';
import { depositController } from '../controllers/depositController.js';

const router = Router();

router.get('/', depositController.list);
router.post('/', depositController.create);
router.post('/:id/void', depositController.void);

export default router;
