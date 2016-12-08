import Sequelize from 'sequelize';
import sequelize from '../sequelize';
import User from '../User';
import deap from 'deap';

let AuthToken = sequelize.define('AuthToken', {
  id: {
    type: Sequelize.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  token: {
    type: Sequelize.CHAR(96),
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
    name: 'token_index',
    method: 'BTREE',
    fields: [ 'token' ]
  }],
  defaultScope () {
    return {
      where: {
        isActive: true
      }
    };
  },
  scopes: {
    disabledOnly: {
      where: {
        isActive: false
      }
    }
  },
  instanceMethods: {
    getUser: function (options = {}) {
      if (!this.isActive) {
        return null;
      }
      let defaultOptions = {
        where: {
          uuid: this.userUuid
        }
      };
      deap.extend(options, defaultOptions);
      return User.findOne(options);
    }
  }
});

export default AuthToken;