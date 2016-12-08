import express from 'express';
import { rightsAllocator, userRetriever } from '../../../utils';
import * as account from './methods';

const router = express.Router();

router.get('/cards', [ userRetriever, rightsAllocator('user') ], account.getCards);
router.post('/cards', [ userRetriever, rightsAllocator('user') ], account.createCard);

export default router;