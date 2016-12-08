import { Deposit } from '../../../models';
import Promise from 'bluebird';

const timeFrameMs = .5 * 1000;

let interval;

function start() {
  if (interval) {
    stop();
  }
  interval = setInterval(record, timeFrameMs);
}

function record() {
  return Promise.resolve().then(() => {
    return _record();
  }).catch(console.error.bind(console, '[ Deposit Recorder Error ]'));
}

async function _record() {
  const count = 10;
  let [ offset, limit ] = [ 0, count ];
  while (true) {
    let deposits = await Deposit.scope('opened').findAll({ offset, limit });
    //handle
    deposits.forEach(async deposit => {
      let account = await deposit.getAccount();
      let balance = account.balance;
      let newRecord = {
        balance,
        recordDate: new Date()
      };
      //console.log(`[ ${account.number} ] Balance: ${account.balance}`);
      let record = await deposit.createDepositRecord(newRecord);
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

