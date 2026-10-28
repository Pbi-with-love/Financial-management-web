import { Router } from 'express';
import { expenseController } from '../controllers/expenseController.js';

const router = Router();

router.get('/', expenseController.list);
router.post('/', expenseController.create);
router.post('/:id/void', expenseController.void);

export default router;
