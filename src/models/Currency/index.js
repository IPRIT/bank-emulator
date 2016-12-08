import Sequelize from 'sequelize';
import sequelize from '../sequelize';
import deap from 'deap';

let Currency = sequelize.define('Currency', {
  number: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  exponent: {
    type: Sequelize.INTEGER(6),
    allowNull: true
  },
  code: {
    type: Sequelize.STRING,
    allowNull: false
  },
  symbol: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
  paranoid: true,
  timestamps: false,
  engine: 'INNODB',
  indexes: [{
    name: 'code_index',
    method: 'BTREE',
    fields: [ 'code' ]
  }]
});

export default Currency;