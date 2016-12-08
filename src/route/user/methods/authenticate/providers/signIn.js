import { User } from '../../../../../models';
import Log from 'log4js';
import { rememberUser } from "../session-manager";

const log = Log.getLogger('[Sign In]');

export default (req, res, next) => {
  let { login, password } = req.body;

  signIn(login, password).then(user => {
    return rememberUser(user);
  }).then(tokenInstance => {
    res.json({
      token: tokenInstance.token
    });
  }).catch(next);
};

function signIn(login, password) {
  let pwdFingerprint = User.getPwdCryptoFingerprint(password);
  return User.findOne({
    where: {
      $and: {
        password: pwdFingerprint,
        $or: {
          email: login,
          phoneNumber: login
        }
      }
    }
  }).tap(user => {
    if (user) {
      log.info('Received user:', user && user.get({ plain: true }).fullName);
    }
  }).then(user => {
    if (!user) {
      throw new HttpError('User not found');
    }
    return user;
  });
}