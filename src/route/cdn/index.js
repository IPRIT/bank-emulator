import express from 'express';
import { rightsAllocator, userRetriever, isJsonRequest } from '../../utils';

const router = express.Router();

router.all('/images/covers/:name', [ isJsonRequest(false) ], express.static('cdn'));

export default router;