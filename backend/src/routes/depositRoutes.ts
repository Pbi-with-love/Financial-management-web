import { Router } from 'express';
import { depositController } from '../controllers/depositController.js';

const router = Router();

router.get('/', depositController.list);
router.post('/', depositController.create);
router.patch('/:id', depositController.update);
router.delete('/:id', depositController.remove);

export default router;
