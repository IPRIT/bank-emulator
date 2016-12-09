import Sequelize from 'sequelize';
import sequelize from '../sequelize';
import deap from 'deap';

let OutsideTransfer = sequelize.define('OutsideTransfer', {
  uuid: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV1,
    primaryKey: true
  },
  gatewayAccount: {
    type: Sequelize.STRING
  },
  withdrawAmount: {
    type: Sequelize.DECIMAL(65, 2),
    allowNull: false
  },
  incomeAmount: {
    type: Sequelize.DECIMAL(65, 2),
    allowNull: false
  }
}, {
  timestamps: false,
  engine: 'INNODB',
  indexes: [{
    name: 'gateway_account_index',
    method: 'BTREE',
    fields: [ 'gatewayAccount' ]
  }]
});

export default OutsideTransfer;