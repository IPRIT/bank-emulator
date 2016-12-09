import Promise from 'bluebird';
import {
  Account, Transaction, OutsideTransfer
} from '../../../../models';
import sequelize from '../../../../models/sequelize';

export default function b2bTransfer(req, res, next) {
  let user = req.user;
  let params = req.body;
  
  Promise.resolve().then(() => {
    return _b2bTransfer(params, user);
  }).then(transfer => {
    res.json(transfer);
  }).catch(next);
}

async function _b2bTransfer({ amount, fromAccountNumber, to } = {}, user) {
  let initiatorAccount = await Account.findByPrimary(fromAccountNumber);
  if (!initiatorAccount) {
    throw new HttpError('Initiator account not found');
  } else if (initiatorAccount.userUuid !== user.uuid) {
    throw new HttpError('Access denied', 403);
  }
  let destinationAccount = to;
  
  let transaction = await sequelize.transaction();
  
  let transactionBlock = await Transaction.create({
    type: 'outside_transfer',
    initiatorAccountNumber: initiatorAccount.number
  });
  
  try {
    let initiatorBalance = initiatorAccount.balance;
    if (initiatorBalance < amount) {
      throw new HttpError('Insufficient Funds');
    }
    
    const fixedOutsideTransferFeePercent = .5;
    
    let withdrawAmount = Math.max(0, Number(amount));
    let incomeAmount = withdrawAmount * (1 - fixedOutsideTransferFeePercent / 100);
    let feeAmount = withdrawAmount - incomeAmount;
  
    let transactionFee = await transactionBlock.createTransactionFee({
      feePercent: fixedOutsideTransferFeePercent,
      feeAmount
    }, { transaction });
    
    let outsideTransfer = await OutsideTransfer.create({
      withdrawAmount,
      incomeAmount,
      transactionUuid: transactionBlock.uuid,
      gatewayAccount: destinationAccount
    }, { transaction });
    
    await initiatorAccount.decrement({
      balance: outsideTransfer.withdrawAmount
    }, { transaction });
  
    await transactionBlock.update({
      status: 'succeed'
    }, { transaction });
    await transaction.commit();
    
    console.log(
      `[ External Transfer ] Client [${initiatorAccount.number}] just ` +
      `transferred [${withdrawAmount} -> ${incomeAmount}] funds ` +
      `to the external client [${destinationAccount}]`
    );
    
    return outsideTransfer;
  } catch (err) {
    transaction.rollback();
    await transactionBlock.update({
      status: 'failed'
    });
    console.error('[ Create External Transfer Error ] [ Operation rollback ]', err);
    throw new HttpError(`Error [ Transfer creation error ]: ${err.description || err.message}`);
  }
}