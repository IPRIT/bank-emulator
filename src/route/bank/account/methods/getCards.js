import { filterEntity as filter, ensureValue, cardGenerator } from '../../../../utils';
import Promise from 'bluebird';
import sequelize from '../../../../models/sequelize';
import { Card, Currency } from '../../../../models';

export default function getCards(req, res, next) {
  let user = req.user;
  let params = req.body;
  
  Promise.resolve().then(() => {
    return get(params, user);
  }).then(cards => {
    res.json(cards);
  }).catch(next);
}

function get(params, user) {
  return user.getAccounts({
    include: [{
      model: Card
    }, {
      model: Currency
    }]
  });
}