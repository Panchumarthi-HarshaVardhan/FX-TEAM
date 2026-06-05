const { db } = require('../config/firebase');

const snapshotToArray = (snapshot) => {
  if (!snapshot.exists()) return [];
  const value = snapshot.val();
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).map(([id, data]) => ({ id, ...data }));
};

const getAll = async (collection) => {
  const snapshot = await db.ref(collection).once('value');
  return snapshotToArray(snapshot);
};

const getById = async (collection, id) => {
  const snapshot = await db.ref(`${collection}/${id}`).once('value');
  return snapshot.exists() ? { id, ...snapshot.val() } : null;
};

const create = async (collection, data) => {
  const newRef = db.ref(collection).push();
  const timestamped = { ...data, createdAt: Date.now() };
  await newRef.set(timestamped);
  return { id: newRef.key, ...timestamped };
};

const updateById = async (collection, id, data) => {
  await db.ref(`${collection}/${id}`).update(data);
  const snapshot = await db.ref(`${collection}/${id}`).once('value');
  return snapshot.exists() ? { id, ...snapshot.val() } : null;
};

const deleteById = async (collection, id) => {
  await db.ref(`${collection}/${id}`).remove();
  return true;
};

const findOneByField = async (collection, field, value) => {
  const items = await getAll(collection);
  return items.find((item) => item && item[field] === value) || null;
};

const findOne = async (collection, predicate) => {
  const items = await getAll(collection);
  return items.find(predicate) || null;
};

const filter = async (collection, predicate) => {
  const items = await getAll(collection);
  return items.filter(predicate);
};

const filterByFields = async (collection, fieldMap) => {
  const items = await getAll(collection);
  return items.filter((item) =>
    Object.entries(fieldMap).every(([field, value]) => {
      if (value === undefined) return true;
      const itemVal = item[field];
      if (itemVal && typeof itemVal === 'object' && itemVal.toString) {
        return itemVal.toString() === value.toString();
      }
      return itemVal === value;
    })
  );
};

const findOneByFields = async (collection, fieldMap) => {
  const items = await filterByFields(collection, fieldMap);
  return items[0] || null;
};

const count = async (collection, predicate) => {
  if (!predicate) {
    const snapshot = await db.ref(collection).once('value');
    if (!snapshot.exists()) return 0;
    const val = snapshot.val();
    return typeof val === 'object' ? Object.keys(val).length : 0;
  }
  const items = await filter(collection, predicate);
  return items.length;
};

const updateMany = async (collection, predicate, data) => {
  const items = await filter(collection, predicate);
  await Promise.all(items.map((item) => updateById(collection, item.id, data)));
  return items.length;
};

const deleteMany = async (collection, predicate) => {
  const items = await filter(collection, predicate);
  await Promise.all(items.map((item) => deleteById(collection, item.id)));
  return items.length;
};

const populate = async (item, field, collection, selectFields) => {
  if (!item || !item[field]) return item;
  const ref = item[field];
  if (Array.isArray(ref)) {
    const populated = await Promise.all(ref.map((id) => getById(collection, id)));
    item[field] = populated.filter(Boolean).map((doc) => pickFields(doc, selectFields));
  } else {
    const doc = await getById(collection, ref);
    item[field] = doc ? pickFields(doc, selectFields) : null;
  }
  return item;
};

const pickFields = (doc, selectFields) => {
  if (!doc || !selectFields) return doc;
  const fields = selectFields.split(' ').filter(Boolean);
  const result = { id: doc.id };
  fields.forEach((f) => {
    if (doc[f] !== undefined) result[f] = doc[f];
  });
  return result;
};

module.exports = {
  getAll,
  getById,
  create,
  updateById,
  deleteById,
  findOneByField,
  findOne,
  findOneByFields,
  filter,
  filterByFields,
  count,
  updateMany,
  deleteMany,
  populate
};
