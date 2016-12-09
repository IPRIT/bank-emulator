import Sequelize from 'sequelize';
import sequelize from '../sequelize';
import deap from 'deap';

let Deposit = sequelize.define('Deposit', {
  uuid: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV1,
    primaryKey: true
  },
  title: {
    type: Sequelize.STRING,
    defaultValue: 'Unnamed Deposit'
  },
  annualInterest: {
    type: Sequelize.FLOAT,
    defaultValue: 0
  },
  lastTimeRewarded: {
    type: Sequelize.DATE,
    defaultValue: () => new Date()
  },
  timeFrame: {
    type: Sequelize.ENUM('half_year', 'year', 'two_years'),
    allowNull: false
  },
  finishDate: {
    type: Sequelize.DATE,
    allowNull: false
  },
  status: {
    type: Sequelize.ENUM('opened', 'finished', 'closed'),
    defaultValue: 'opened'
  }
}, {
  engine: 'INNODB',
  indexes: [{
    name: 'timeframe_stats_index',
    method: 'BTREE',
    fields: [ 'timeFrame' ]
  }],
  defaultScope () {
    return {
      where: {
        status: {
          $ne: 'closed'
        }
      }
    };
  },
  scopes: {
    opened: {
      where: {
        status: 'opened',
        finishDate: {
          $gte: new Date()
        }
      }
    }
  }
});

export default Deposit;