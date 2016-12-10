import { filterEntity as filter, ensureValue, cardGenerator } from '../../../../utils';
import Promise from 'bluebird';
import sequelize from '../../../../models/sequelize';
import { Card, Currency, Account } from '../../../../models';
import deap from "deap";
import { transliterate } from 'transliteration';

export default function getCards(req, res, next) {
  let user = req.user;
  let params = req.query;
  
  Promise.resolve().then(() => {
    return get(params, user);
  }).then(cards => {
    res.json(cards);
  }).catch(next);
}

function get(params, user) {
  return user.getAccounts({
    include: [{
      model: Card,
      required: true
    }, {
      model: Currency
    }],
    order: [ [Account, 'createdAt', 'DESC'] ]
  }).map(account => {
    account = account.get({ plain: true });
    account.Cards[0] = deap.extend(account.Cards[0], {
      ccHolder: transliterate(user.fullName)
    });
    return account;
  });
}