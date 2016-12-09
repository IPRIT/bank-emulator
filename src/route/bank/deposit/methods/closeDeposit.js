import { filterEntity as filter, ensureValue, cardGenerator } from '../../../../utils';
import Promise from 'bluebird';
import { Account, Deposit, DepositCurrencyPercent } from '../../../../models';
import sequelize from '../../../../models/sequelize';
import deap from 'deap';

export default function closeDeposit(req, res, next) {
  let user = req.user;
  let params = req.body;
  
  Promise.resolve().then(() => {
    return close(params, user);
  }).then(() => {
    res.json({
      status: 'ok'
    });
  }).catch(next);
}

async function close({ depositUuid } = {}, user) {
  let t = await sequelize.transaction();
  try {
    await Deposit.update({
      status: 'closed'
    }, {
      where: {
        uuid: depositUuid
      }
    }, { transaction: t });
    
    return t.commit();
  } catch (err) {
    t.rollback();
    console.error('[ Create Deposit Error ] [ Operation rollback ]', err);
    
    throw new HttpError('Deposit creation error');
  }
}