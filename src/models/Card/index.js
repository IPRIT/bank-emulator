import Sequelize from 'sequelize';
import sequelize from '../sequelize';
import deap from 'deap';
import * as utils from '../../utils';

let Card = sequelize.define('Card', {
  id: {
    type: Sequelize.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  ccNumber: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      isCreditCard: true,
      isCardControlNumberValid: utils.isCardControlNumberValid
    }
  },
  ccType: {
    type: Sequelize.ENUM('VISA', 'MASTERCARD')
  },
  cvv2: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  ccExpiration: {
    type: Sequelize.DATE,
    allowNull: false
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
}, {
  paranoid: true,
  engine: 'INNODB',
  indexes: [{
    name: 'account_index',
    method: 'BTREE',
    fields: [ 'accountNumber' ]
  }],
  defaultScope () {
    return {
      where: {
        isActive: true
      }
    };
  }
});

export default Card;