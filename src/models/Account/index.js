import Sequelize from 'sequelize';
import sequelize from '../sequelize';
import deap from 'deap';

function ACCOUNT_NUMBER(length = 16) {
  return () => Math.floor(Math.pow(10, length) * Math.random());
}

let Account = sequelize.define('Account', {
  number: {
    type: Sequelize.BIGINT,
    allowNull: false,
    defaultValue: ACCOUNT_NUMBER(),
    primaryKey: true
  },
  title: {
    type: Sequelize.STRING,
    defaultValue: ''
  },
  balance: {
    type: Sequelize.DECIMAL(10, 2),
    defaultValue: 0
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
}, {
  paranoid: true,
  engine: 'INNODB',
  indexes: [],
  defaultScope () {
    return {
      where: {
        isActive: true
      }
    };
  }
});

export default Account;