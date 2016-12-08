import { User } from '../../../../../models';
import Log from 'log4js';
import { rememberUser } from "../session-manager";

const log = Log.getLogger('[Sign Up]');

export default (req, res, next) => {
  signUp(req.body).then(user => {
    return rememberUser(user);
  }).then(tokenInstance => {
    res.json({
      token: tokenInstance.token
    });
  }).catch(next);
};

function signUp(user) {
  let { firstName, lastName, password, confirmPassword, email, phoneNumber = '' } = user;
  
  if (password !== confirmPassword) {
    throw new HttpError('Passwords do not equal');
  }
  
  return findUser(user).then(foundUser => {
    if (foundUser) {
      throw new HttpError('User does exist');
    }
    log.info('Creating user...:\t', `[${firstName} ${lastName}]`);
    let newUserObject = {
      firstName,
      lastName,
      email,
      phoneNumber,
      password
    };
    return User.create(newUserObject);
  });
}

function findUser(user) {
  let { email, phoneNumber = '' } = user;
  return User.findOne({
    where: {
      $or: {
        email,
        phoneNumber
      }
    }
  }).tap(user => {
    if (user) {
      log.info('Received user:', user && user.get({ plain: true }).fullName);
    }
  });
}