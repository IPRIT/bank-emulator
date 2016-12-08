import Sequelize from 'sequelize';
import sequelize from '../sequelize';
import userGroups from './userGroups';
import config from '../../utils/config';
import crypto from 'crypto';

let User = sequelize.define('User', {
  uuid: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV1,
    primaryKey: true
  },
  firstName: {
    type: Sequelize.STRING
  },
  lastName: {
    type: Sequelize.STRING
  },
  email: {
    type: Sequelize.STRING,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      len: [ 6, 50 ]
    },
    set (value) {
      this.setDataValue('password', User.getPwdCryptoFingerprint(value));
    }
  },
  phoneNumber: {
    type: Sequelize.STRING,
    allowNull: true
  },
  photo: {
    type: Sequelize.STRING,
    defaultValue: 'https://pp.vk.me/c638716/v638716446/11e3b/nYOJbugtSBI.jpg'
  },
  isBan: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  accessGroup: {
    type: Sequelize.INTEGER,
    defaultValue: userGroups.groups.user.mask,
    get() {
      let mask = this.getDataValue('accessGroup');
      if (this.getDataValue('isBan')) {
        mask = userGroups.groups.locked.mask;
      }
      return userGroups.utils.groupByMask(mask);
    }
  },
  recentActivityTime: {
    type: Sequelize.DATE,
    defaultValue: () => new Date()
  },
  lastLoggedTime: {
    type: Sequelize.DATE,
    defaultValue: () => new Date()
  },
  registerTime: {
    type: Sequelize.DATE,
    defaultValue: () => new Date()
  }
}, {
  getterMethods: {
    fullName() {
      let placeholder = '{firstName} {lastName}';
      return ['firstName', 'lastName'].reduce((placeholder, key) => {
        let regexp = new RegExp(`\{${key}\}`, 'gi');
        return placeholder.replace(regexp, this[ key ]);
      }, placeholder);
    }
  },
  setterMethods: {
    fullName(value) {
      var names = (value || "").trim().split(/\s+/);
      while (names.length !== 2) {
        (names.length > 2 ?
          names.pop : names.push.bind(this, '-'))();
      }
      this.setDataValue('firstname', names.slice(0, -1).join(' '));
      this.setDataValue('lastname', names.slice(-1).join(' '));
    }
  },
  paranoid: true,
  engine: 'INNODB',
  indexes: [{
    name: 'login_index',
    method: 'BTREE',
    fields: [ 'email', 'phoneNumber' ]
  }],
  defaultScope() {
    let lockedGroup = userGroups.groups.locked;
    return {
      where: {
        $and: {
          isBan: false,
          accessGroup: {
            $ne: lockedGroup.mask
          }
        }
      }
    };
  },
  scopes: {
    deleted: {
      where: {
        deletedAt: {
          $ne: null
        }
      }
    },
    banned: {
      where: {
        isBan: true
      }
    },
    accessGroup(...args) {
      let groups = userGroups.utils.resolveAllGroups(...args);
      return {
        where: {
          accessGroup: {
            $in: groups.map(group => group.mask)
          }
        }
      }
    }
  },
  instanceMethods: {
    hasRight(mask) {
      return userGroups.utils.hasRight(
        this.accessGroup,
        mask
      );
    }
  },
  classMethods: {
    getPwdCryptoFingerprint(originalPassword) {
      let { pwdSecret } = config.system;
      return crypto.createHash('md5').update(`${originalPassword}-.-${pwdSecret}`).digest('hex');
    }
  }
});

export default User;