import Promise from 'bluebird';
import {
  Account, Card, Transaction, ClientTransfer, Currency, CurrencyExchangeFee
} from '../../../../models';
import sequelize from '../../../../models/sequelize';
import swap from 'node-currency-swap';

swap.addProvider(new swap.providers.GoogleFinance());
const currencyQuote = Promise.promisify(swap.quote);

export default function clientTransfer(req, res, next) {
  let user = req.user;
  let params = req.body;
  
  Promise.resolve().then(() => {
    return _clientTransfer(params, user);
  }).then(transfer => {
    res.json(transfer);
  }).catch(next);
}

async function _clientTransfer({ amount, fromAccountNumber, to } = {}, user) {
  let initiatorAccount = await Account.findByPrimary(fromAccountNumber);
  if (!initiatorAccount) {
    throw new HttpError('Initiator account not found');
  } else if (initiatorAccount.userUuid !== user.uuid) {
    throw new HttpError('Access denied', 403);
  }
  let destinationAccount = await resolveAccount(to);
  
  let [ fromCurrency, toCurrency ] = [
    await Currency.findByPrimary(initiatorAccount.currencyNumber),
    await Currency.findByPrimary(destinationAccount.currencyNumber)
  ];
  
  let transaction = await sequelize.transaction();
  
  let transactionBlock = await Transaction.create({
    type: 'client_transfer',
    initiatorAccountNumber: initiatorAccount.number
  });
  
  try {
    let initiatorBalance = initiatorAccount.balance;
    if (initiatorBalance < amount) {
      throw new HttpError('Insufficient Funds');
    }
    
    let withdrawAmount = Math.max(0, Number(amount));
    let incomeAmount = withdrawAmount; // amount that will added to another account
    let feeAmount = 0;
    
    if (fromCurrency.number !== toCurrency.number) {
      let exchangeFee = await CurrencyExchangeFee.findOne({
        fromCurrencyNumber: fromCurrency.number,
        toCurrencyNumber: toCurrency.number
      }, { transaction });
      if (!exchangeFee) {
        throw new HttpError('Exchange Error');
      }
  
      let currencyRate = await currencyQuote({
        currency: `${fromCurrency.code}/${toCurrency.code}`
      });
      let currencyRateValue = currencyRate[0].value;
      
      let exchangeFeePercent = exchangeFee.percent;
      let convertedAmount = withdrawAmount * currencyRateValue;
      incomeAmount *= currencyRateValue * (1 - exchangeFeePercent / 100);
      feeAmount = convertedAmount - incomeAmount;
  
      let transactionFee = await transactionBlock.createTransactionFee({
        feePercent: exchangeFeePercent,
        feeAmount
      }, { transaction });
    }
    
    let clientTransfer = await ClientTransfer.create({
      withdrawAmount,
      incomeAmount,
      transactionUuid: transactionBlock.uuid,
      appointedAccountNumber: destinationAccount.number
    }, { transaction });
    
    await initiatorAccount.decrement({
      balance: clientTransfer.withdrawAmount
    }, { transaction });
    await destinationAccount.increment({
      balance: clientTransfer.incomeAmount
    }, { transaction });
  
    await transactionBlock.update({
      status: 'succeed'
    }, { transaction });
    await transaction.commit();
    
    console.log(
      `[ Internal Transfer ] Client [${initiatorAccount.number}] ` +
      `transferred [${fromCurrency.symbol}${withdrawAmount} -> ${toCurrency.symbol}${incomeAmount}] ` +
      `to client [${destinationAccount.number}]`
    );
    
    return clientTransfer;
  } catch (err) {
    transaction.rollback();
    await transactionBlock.update({
      status: 'failed'
    });
    console.error('[ Create Client Transfer Error ] [ Operation rollback ]', err);
    throw new HttpError(`Error [ Transfer creation error ]: ${err.description || err.message}`);
  }
}

async function resolveAccount(value) {
  const accountDoesntExistErr = new HttpError('Account does not exist');
  if (!value) {
    throw accountDoesntExistErr;
  }
  let account = await Account.findOne({
    where: {
      number: value
    }
  });
  if (account) {
    return account;
  }
  let card = await Card.findOne({
    where: {
      ccNumber: value
    }
  });
  if (!card) {
    throw accountDoesntExistErr;
  }
  let cardAppointedAccount = await Account.findOne({
    where: {
      number: card.accountNumber
    }
  });
  if (!cardAppointedAccount) {
    throw accountDoesntExistErr;
  }
  return cardAppointedAccount;
}