import Sequelize from 'sequelize';
import sequelize from '../sequelize';
import deap from 'deap';

let DepositReward = sequelize.define('DepositReward', {
  uuid: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV1,
    primaryKey: true
  },
  rewardAmount: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  rewardDate: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: () => new Date()
  }
}, {
  engine: 'INNODB'
});

export default DepositReward;