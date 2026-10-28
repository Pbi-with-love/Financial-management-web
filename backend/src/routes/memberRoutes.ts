import { Router } from 'express';
import { memberController } from '../controllers/memberController.js';

const router = Router();

router.get('/', memberController.list);
router.get('/:id', memberController.getOne);
router.post('/', memberController.create);
router.patch('/:id', memberController.update);

export default router;
