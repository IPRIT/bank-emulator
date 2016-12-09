import Sequelize from 'sequelize';
import sequelize from '../sequelize';
import deap from 'deap';

let TransactionFee = sequelize.define('TransactionFee', {
  uuid: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV1,
    primaryKey: true
  },
  feePercent: {
    type: Sequelize.FLOAT,
    defaultValue: 0
  },
  feeAmount: {
    type: Sequelize.DECIMAL(65, 2),
    defaultValue: 0
  }
}, {
  timestamps: false,
  engine: 'INNODB'
});

export default TransactionFee;