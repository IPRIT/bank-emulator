import express from 'express';
import cors from './cors';
import test from './test';
import user from './user';
import bank from './bank';

const router = express.Router();

router.all('*', cors);

router.use('/test', test);
router.use('/user', user);
router.use('/bank', bank);

export default router;