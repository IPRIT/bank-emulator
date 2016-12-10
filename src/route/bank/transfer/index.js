import express from 'express';
import { rightsAllocator, userRetriever } from '../../../utils';
import * as transfer from './methods';

const router = express.Router();

router.get('/history', [ userRetriever, rightsAllocator('user') ], transfer.getHistory);
router.post('/client', [ userRetriever, rightsAllocator('user') ], transfer.clientTransfer);
router.post('/b2b', [ userRetriever, rightsAllocator('user') ], transfer.b2bTransfer);

router.get('/convert', [ userRetriever, rightsAllocator('user') ], transfer.convert);
router.get('/getCurrencies', [ userRetriever, rightsAllocator('user') ], transfer.getCurrencies);

export default router;