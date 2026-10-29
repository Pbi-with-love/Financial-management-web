import { Router } from 'express';
import { expenseController } from '../controllers/expenseController.js';

const router = Router();

router.get('/', expenseController.list);
router.post('/', expenseController.create);
router.get('/:id', expenseController.getById);
router.post('/:id/void', expenseController.void);
router.put('/:id/revise', expenseController.revise);

export default router;
