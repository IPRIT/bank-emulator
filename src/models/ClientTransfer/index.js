import Sequelize from 'sequelize';
import sequelize from '../sequelize';
import deap from 'deap';

let ClientTransfer = sequelize.define('ClientTransfer', {
  uuid: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV1,
    primaryKey: true
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
  indexes: []
});

export default ClientTransfer;