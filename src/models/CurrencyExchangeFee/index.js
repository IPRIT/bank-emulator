import Sequelize from 'sequelize';
import sequelize from '../sequelize';
import deap from 'deap';

let CurrencyExchangeFee = sequelize.define('CurrencyExchangeFee', {
  percent: {
    type: Sequelize.FLOAT,
    defaultValue: 0
  }
}, {
  timestamps: false,
  engine: 'INNODB'
});

export default CurrencyExchangeFee;