import Sequelize from 'sequelize';
import sequelize from '../sequelize';
import deap from 'deap';

function TRANSACTION_NUMBER(length = 16) {
  return () => Math.floor(Math.pow(10, length) * Math.random());
}

let Transaction = sequelize.define('Transaction', {
  uuid: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV1,
    primaryKey: true
  },
  operationId: {
    type: Sequelize.BIGINT(30),
    allowNull: false,
    defaultValue: TRANSACTION_NUMBER()
  },
  type: {
    type: Sequelize.ENUM('outside_transfer', 'client_transfer'),
    allowNull: false
  },
  status: {
    type: Sequelize.ENUM('succeed', 'failed'),
    allowNull: true
  }
}, {
  engine: 'INNODB',
  indexes: [{
    name: 'operation_index',
    method: 'BTREE',
    fields: [ 'operationId' ]
  }]
});

export default Transaction;