import { filterEntity as filter, ensureValue, cardGenerator } from '../../../../utils';
import Promise from 'bluebird';
import sequelize from '../../../../models/sequelize';
import { Card, Currency, Deposit, Account } from '../../../../models';

export default function getDeposits(req, res, next) {
  let user = req.user;
  let params = req.query;
  
  Promise.resolve().then(() => {
    return get(params, user);
  }).then(deposits => {
    res.json(deposits);
  }).catch(next);
}

async function get(params, user) {
  let accounts = await user.getAccounts();
  let accountsNumbers = accounts.map(account => {
    return account.number;
  });
  let deposits = await Deposit.findAll({
    where: {
      accountNumber: {
        $in: accountsNumbers
      },
      status: {
        $ne: 'closed'
      }
    },
    include: [{
      model: Account,
      include: [{
        model: Currency
      }]
    }],
    order: 'createdAt DESC'
  });
  return deposits;
}