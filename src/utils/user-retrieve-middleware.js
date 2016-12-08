import { User, AuthToken, Subscription } from '../models';

export default async (req, res, next) => {
  req._ip = req.headers['x-forwarded-for']
    || req.connection.remoteAddress
    || req.headers['x-real-ip']
    || 'Not specified';
  
  let { token } = req.params;
  let queryStringToken = req.query.token;
  token = req.header('X-Token') || token || queryStringToken;
  if (!token || typeof token !== 'string') {
    return next();
  }
  getUser(token).then(user => {
    if (!user) {
      return next();
    }
    req.user = user;
    req.token = token;
    next();
  }).catch(next);
};

async function getUser(token) {
  let tokenInstance = await AuthToken.findOne({
    where: { token }
  });
  if (!tokenInstance) {
    return null;
  }
  let user = await tokenInstance.getUser({
    attributes: {
      exclude: [ 'deletedAt' ]
    }
  });
  if (!user) {
    return null;
  }
  return user;
}