import express from 'express';
import account from './account';
import deposit from './deposit';
import transfer from './transfer';

const router = express.Router();

router.use('/account', account);
router.use('/deposit', deposit);
router.use('/transfer', transfer);

export default router;