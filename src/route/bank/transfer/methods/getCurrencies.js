import Promise from 'bluebird';
import {
  Currency
} from '../../../../models';

export default function getCurrencies(req, res, next) {
  let user = req.user;
  let params = req.query;
  
  Promise.resolve().then(() => {
    return _getCurrencies(params, user);
  }).then(currencies => {
    res.json(currencies);
  }).catch(next);
}

function _getCurrencies(params, user) {
  return Currency.findAll();
}