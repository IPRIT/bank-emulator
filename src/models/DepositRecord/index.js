import Sequelize from 'sequelize';
import sequelize from '../sequelize';
import deap from 'deap';

let DepositRecord = sequelize.define('DepositRecord', {
  uuid: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV1,
    primaryKey: true
  },
  balance: {
    type: Sequelize.DECIMAL(65, 2),
    allowNull: false,
    defaultValue: 0
  },
  recordDate: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: () => new Date()
  }
}, {
  engine: 'INNODB',
  indexes: [{
    name: 'record_date_index',
    method: 'BTREE',
    fields: [ { attribute: 'recordDate', order: 'DESC' } ]
  }]
});

export default DepositRecord;