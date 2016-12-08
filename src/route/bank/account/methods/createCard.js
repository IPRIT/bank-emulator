import { filterEntity as filter, ensureValue, cardGenerator } from '../../../../utils';
import Promise from 'bluebird';
import { Account } from '../../../../models';
import sequelize from '../../../../models/sequelize';
import deap from 'deap';
import { transliterate } from 'transliteration';

export default function createCard(req, res, next) {
  let user = req.user;
  let params = req.body;
  
  Promise.resolve().then(() => {
    return create(params, user);
  }).then(card => {
    card = card.get({ plain: true });
    deap.extend(card, {
      ccHolder: transliterate(user.fullName)
    });
    res.json(card);
  }).catch(next);
}

async function create({ title = '', currencyNumber, parentId } = {}, user) {
  let t = await sequelize.transaction();
  try {
    let account = await user.createAccount({
      title,
      balance: 1,
      currencyNumber,
      parentId
    }, { transaction: t });
    let card = await account.createCard(cardGenerator(16).generate(), { transaction: t });
    await t.commit();
    return card;
  } catch (err) {
    t.rollback();
    console.error('[ Create Card Error ] [ Operation rollback ]', err);
    
    throw new HttpError('Card creation error');
  }
}