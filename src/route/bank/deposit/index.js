import express from 'express';
import { rightsAllocator, userRetriever } from '../../../utils';
import * as deposit from './methods';

const router = express.Router();

router.get('/deposits', [ userRetriever, rightsAllocator('user') ], deposit.getDeposits);
router.post('/deposits', [ userRetriever, rightsAllocator('user') ], deposit.createDeposit);
router.delete('/deposits', [ userRetriever, rightsAllocator('user') ], deposit.closeDeposit);

export default router;