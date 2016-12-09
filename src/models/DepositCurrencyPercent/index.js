import Sequelize from 'sequelize';
import sequelize from '../sequelize';
import deap from 'deap';

let DepositCurrencyPercent = sequelize.define('DepositCurrencyPercent', {
  id: {
    type: Sequelize.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  annualInterest: {
    type: Sequelize.FLOAT,
    defaultValue: 0
  }
}, {
  engine: 'INNODB',
  timestamps: false
});

export default DepositCurrencyPercent;