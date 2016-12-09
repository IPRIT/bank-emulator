import { filterEntity as filter, ensureValue, cardGenerator } from '../../../../utils';
import Promise from 'bluebird';
import { Account, Deposit, DepositCurrencyPercent } from '../../../../models';
import sequelize from '../../../../models/sequelize';
import deap from 'deap';
import { transliterate } from 'transliteration';

export default function createDeposit(req, res, next) {
  let user = req.user;
  let params = req.body;
  
  Promise.resolve().then(() => {
    return create(params, user);
  }).then(deposit => {
    res.json(deposit);
  }).catch(next);
}

async function create({ title = '', currencyNumber, timeFrame = 'year' } = {}, user) {
  let t = await sequelize.transaction();
  try {
    let account = await user.createAccount({
      title,
      balance: 0,
      currencyNumber
    }, { transaction: t });
    
    let currencyInterestRate = await DepositCurrencyPercent.findOne({
      where: {
        currencyNumber
      }
    });
    let annualInterest = currencyInterestRate.annualInterest;
    
    const framesMap = {
      half_year: 365.251 / 2,
      year: 365.251,
      two_years: 365.251 * 2
    };
    if (!(timeFrame in framesMap)) {
      timeFrame = 'year';
    }
    const dayPeriodMs = 24 * 60 * 60 * 1000;
    let finishDate = new Date(new Date().getTime() + framesMap[ timeFrame ] * dayPeriodMs);
    
    let deposit = await Deposit.create({
      title,
      timeFrame,
      finishDate,
      annualInterest,
      accountNumber: account.number
    }, { transaction: t });
    await t.commit();
    return deposit;
  } catch (err) {
    t.rollback();
    console.error('[ Create Deposit Error ] [ Operation rollback ]', err);
    
    throw new HttpError('Deposit creation error');
  }
}