import Promise from 'bluebird';
import {
  Account, ClientTransfer, Transaction, User, OutsideTransfer
} from '../../../../models';

export default function getHistory(req, res, next) {
  let user = req.user;
  let params = req.query;
  
  Promise.resolve().then(() => {
    return _getHistory(params, user);
  }).then(history => {
    res.json(history);
  }).catch(next);
}

async function _getHistory({ accountNumber, offset = 0, limit = 20 } = {}, user) {
  offset = Number(offset);
  limit = Number(limit);
  
  let targetAccount = await Account.findOne({
    where: {
      number: accountNumber,
      userUuid: user.uuid
    }
  });
  if (!targetAccount) {
    throw new HttpError('No such account');
  }
  let incomes = [];
  let outgoing = [];
  
  let incomesResults = await ClientTransfer.findAll({
    where: {
      appointedAccountNumber: targetAccount.number
    },
    include: [{
      model: Transaction,
      include: [{
        model: Account,
        include: [{
          model: User
        }]
      }]
    }]
  });
  
  incomes.push(...incomesResults.map(transfer => {
    return {
      balanceChange: transfer.incomeAmount,
      balanceChangeDate: transfer.Transaction.createdAt,
      operationId: transfer.Transaction.operationId,
      type: 'income_' + transfer.Transaction.type,
      status: transfer.Transaction.status,
      fromAccount: transfer.Transaction.Account
    }
  }));
  
  let outgoingResults = await Transaction.findAll({
    where: {
      initiatorAccountNumber: targetAccount.number
    }
  });
  let outgoingTransactionsUuids = outgoingResults.map(transaction => transaction.uuid);
  let outgoingTransfers = await ClientTransfer.findAll({
    where: {
      transactionUuid: {
        $in: outgoingTransactionsUuids
      }
    },
    include: [{
      model: Transaction
    }, {
      model: Account,
      association: ClientTransfer.associations.AppointedAccount,
      include: [{
        model: User
      }]
    }]
  });
  
  outgoing.push(...outgoingTransfers.map(transfer => {
    return {
      balanceChange: -transfer.withdrawAmount,
      balanceChangeDate: transfer.Transaction.createdAt,
      operationId: transfer.Transaction.operationId,
      type: 'outgoing_' + transfer.Transaction.type,
      status: transfer.Transaction.status,
      toAccount: transfer.AppointedAccount
    }
  }));
  
  let outgoingOutsideTransfers = await OutsideTransfer.findAll({
    where: {
      transactionUuid: {
        $in: outgoingTransactionsUuids
      }
    },
    include: [{
      model: Transaction
    }]
  });
  
  outgoing.push(...outgoingOutsideTransfers.map(transfer => {
    return {
      balanceChange: -transfer.withdrawAmount,
      balanceChangeDate: transfer.Transaction.createdAt,
      operationId: transfer.Transaction.operationId,
      type: 'outgoing_' + transfer.Transaction.type,
      status: transfer.Transaction.status,
      toAccount: {
        gatewayAccount: transfer.gatewayAccount
      }
    }
  }));
  
  return incomes.concat(...outgoing)
    .sort((a, b) => b.balanceChangeDate - a.balanceChangeDate)
    .slice(offset, offset + limit);
}