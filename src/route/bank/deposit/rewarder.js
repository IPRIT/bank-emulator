import sequelize from '../../../models/sequelize';
import { Deposit, DepositRecord } from '../../../models';
import Promise from 'bluebird';

const annualPeriodMs = 1 * 60 * 1000; // year = 365.251 * 24 * 60 * 60 * 1000
const annualCalculationPeriods = 12;
const monthPeriodMs = annualPeriodMs / annualCalculationPeriods;

const checkPeriod = 3 * 1000;

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
      let avgMonthlyBalance = (await DepositRecord.findOne({
        attributes: [[ sequelize.fn('AVG', sequelize.col('balance')), 'avgBalance' ]],
        where: {
          recordDate: {
            $gte: new Date(new Date().getTime() - monthPeriodMs)
          },
          depositUuid: deposit.uuid
        }
      })).dataValues.avgBalance;
      console.log(`[ ${account.number} ] Avg Balance:`, avgMonthlyBalance);
      
      let rewardAmount = avgMonthlyBalance * deposit.annualPercent / (100 * annualCalculationPeriods);
  
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
        console.log(`[ ${account.number} ] Add To Balance +${rewardAmount.toFixed(2)} with annual percent income: ${deposit.annualPercent}%`);
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

