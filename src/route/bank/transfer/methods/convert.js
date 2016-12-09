import Promise from 'bluebird';
import {
  Account, Card, Currency, CurrencyExchangeFee
} from '../../../../models';
import swap from 'node-currency-swap';

const currencyQuote = Promise.promisify(swap.quote);

export default function convert(req, res, next) {
  let user = req.user;
  let params = req.query;
  
  Promise.resolve().then(() => {
    return _convert(params, user);
  }).then(totalExchange => {
    res.json(totalExchange);
  }).catch(next);
}

async function _convert({ amount, fromAccountNumber, to } = {}, user) {
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
    });
    if (!exchangeFee) {
      throw new HttpError('Something went wrong');
    }

    let currencyRate = await currencyQuote({
      currency: `${fromCurrency.code}/${toCurrency.code}`
    });
    var currencyRateValue = currencyRate[0].value;
    
    var exchangeFeePercent = exchangeFee.percent;
    var convertedAmount = withdrawAmount * currencyRateValue;
    incomeAmount *= currencyRateValue * (1 - exchangeFeePercent / 100);
    feeAmount = convertedAmount - incomeAmount;
  }
  
  return {
    feeAmount,
    fromCurrency,
    toCurrency,
    incomeAmount,
    withdrawAmount,
    exchangeFeePercent: exchangeFeePercent || 0,
    convertedAmount: convertedAmount || withdrawAmount,
    rate: currencyRateValue || 1
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