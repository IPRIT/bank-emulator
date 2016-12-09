import Log from 'log4js';
import sequelize from './sequelize';
import User from './User';
import AuthToken from './AuthToken';
import Account from './Account';
import Currency from './Currency';
import Card from './Card';
import Transaction from './Transaction';
import OutsideTransfer from './OutsideTransfer';
import ClientTransfer from './ClientTransfer';
import TransactionFee from './TransactionFee';
import CurrencyExchangeFee from './CurrencyExchangeFee';
import Deposit from './Deposit';
import DepositReward from './DepositReward';
import DepositRecord from './DepositRecord';
import DepositCurrencyPercent from './DepositCurrencyPercent';

const log = Log.getLogger('models');

log.info('Models are syncing...');
sequelize.sync(/**{ force: true }/**/).then(() => {
  log.info('Models synced!');
}).catch(log.fatal.bind(log, 'Error:'));

/**
 * Define relatives between models
 */
User.hasMany(AuthToken, { foreignKey: 'userUuid', targetKey: 'uuid' });
User.hasMany(Account, { foreignKey: 'userUuid', targetKey: 'uuid' });

Account.belongsTo(User, { foreignKey: 'userUuid', targetKey: 'uuid' });
Account.belongsTo(Currency, { foreignKey: 'currencyNumber', targetKey: 'number' });
Account.hasOne(Account, { foreignKey: 'parentId', as: 'ParentAccount' });
Account.hasMany(Card, { foreignKey: 'accountNumber', targetKey: 'number' });
Account.hasMany(Transaction, { foreignKey: 'initiatorAccountNumber', targetKey: 'number' });
Account.hasMany(ClientTransfer, { foreignKey: 'appointedAccountNumber', targetKey: 'number', as: 'AppointedAccount' });

Transaction.belongsTo(Account, { foreignKey: 'initiatorAccountNumber', targetKey: 'number' });

Transaction.belongsTo(TransactionFee, { foreignKey: 'feeUuid', targetKey: 'uuid' });

OutsideTransfer.belongsTo(Transaction, { foreignKey: 'transactionUuid', targetKey: 'uuid' });

ClientTransfer.belongsTo(Transaction, { foreignKey: 'transactionUuid', targetKey: 'uuid' });
ClientTransfer.belongsTo(Account, { foreignKey: 'appointedAccountNumber', targetKey: 'number', as: 'AppointedAccount' });

CurrencyExchangeFee.belongsTo(Currency, { foreignKey: 'fromCurrencyNumber', targetKey: 'number', as: 'FromCurrency' });
CurrencyExchangeFee.belongsTo(Currency, { foreignKey: 'toCurrencyNumber', targetKey: 'number', as: 'ToCurrency' });

DepositCurrencyPercent.belongsTo(Currency, { foreignKey: 'currencyNumber', targetKey: 'number' });

Deposit.belongsTo(Account, { foreignKey: 'accountNumber', targetKey: 'number' });
Deposit.hasMany(DepositReward, { foreignKey: 'depositUuid', targetKey: 'uuid' });
Deposit.hasMany(DepositRecord, { foreignKey: 'depositUuid', targetKey: 'uuid' });


export {
  User, AuthToken, Account, Currency, CurrencyExchangeFee, Card,
  Transaction, TransactionFee, OutsideTransfer, ClientTransfer,
  Deposit, DepositReward, DepositRecord, DepositCurrencyPercent
};
