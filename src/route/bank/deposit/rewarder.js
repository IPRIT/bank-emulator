import sequelize from '../../../models/sequelize';
import { Deposit, DepositRecord, Account } from '../../../models';
import Promise from 'bluebird';

const annualPeriodMs = 60 * 60 * 1000; // year = 365.251 * 24 * 60 * 60 * 1000
const annualCalculationPeriods = 12;
const monthPeriodMs = annualPeriodMs / annualCalculationPeriods;

const checkPeriod = 10 * 1000;

let interval;

function start() {
  if (interval) {
    stop();
  }
  interval = setInterval(reward, checkPeriod);
}

function reward() {
  return Promise.resolve().then(() => {
    return _reward();
  }).catch(console.error.bind(console, '[ Deposit Rewarder Error ]'));
}

async function _reward() {
  const count = 10;
  let [ offset, limit ] = [ 0, count ];
  while (true) {
    let deposits = await Deposit.findAll({
      where: {
        lastTimeRewarded: {
          $lte: new Date(new Date().getTime() - monthPeriodMs)
        },
        status: 'opened'
      },
      offset, limit
    });
    //handle
    deposits.forEach(async deposit => {
      let account = await deposit.getAccount();
      let avgMonthlyBalanceResult = (await DepositRecord.findOne({
        attributes: [[ sequelize.fn('AVG', sequelize.col('balance')), 'avgBalance' ]],
        where: {
          recordDate: {
            $gte: new Date(new Date().getTime() - monthPeriodMs)
          },
          depositUuid: deposit.uuid
        }
      })).get({ plain: true });
      
      let avgMonthlyBalance = avgMonthlyBalanceResult.avgBalance || 0;
      if (avgMonthlyBalance < 1e-6) {
        return;
      }
      
      let rewardAmount = avgMonthlyBalance * deposit.annualInterest / (100 * annualCalculationPeriods);
  
      let t = await sequelize.transaction();
      try {
        let reward = await deposit.createDepositReward({ rewardAmount }, { transaction: t });
        await account.update({
          balance: account.balance + rewardAmount
        }, { transaction: t });
        await deposit.update({
          lastTimeRewarded: new Date()
        }, { transaction: t });
        t.commit();
        console.log(`[ ${account.number} ] Add To Balance +${rewardAmount.toFixed(2)} with annual percent income: ${deposit.annualInterest}%; Avg Balance: ${avgMonthlyBalance}`);
      } catch (err) {
        t.rollback();
        console.error('[ Deposit Rewarder Error ] [ Operation rollback ]', err);
      }
      
      if (deposit.finishDate < new Date()) {
        await deposit.update({
          status: 'finished'
        });
      }
    });
    
    if (deposits.length !== count) {
      break;
    } else {
      offset += count;
    }
  }
  return {
    status: 'handled'
  };
}

function stop() {
  clearInterval(interval);
  interval = null;
}

export default {
  stop, start
}

