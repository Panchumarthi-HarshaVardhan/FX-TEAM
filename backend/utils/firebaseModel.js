const bcrypt = require('bcryptjs');
const { db } = require('../config/firebase');
const {
  getAll,
  getById,
  create,
  updateById,
  deleteById
} = require('./firebaseHelpers');

const COLLECTIONS = {
  User: 'users',
  Startup: 'startups',
  Post: 'posts',
  Comment: 'comments',
  Message: 'messages',
  JobSeekerProfile: 'jobSeekerProfiles',
  FounderProfile: 'founderProfiles',
  InvestorProfile: 'investorProfiles',
  StartupRoleRequest: 'startupRoleRequests',
  InvestmentRequest: 'investmentRequests',
  InvestorStartupConnection: 'investorStartupConnections',
  StartupUpdate: 'startupUpdates',
  Mail: 'mails',
  Conversation: 'conversations',
  JobApplication: 'jobApplications',
  StartupTeamMember: 'startupTeamMembers',
  Notification: 'notifications',
  Application: 'applications',
  JobOpening: 'jobOpenings',
  Product: 'products',
  Order: 'orders',
  Reservation: 'reservations',
  Watchlist: 'watchlists',
  TeamInvitation: 'teamInvitations',
  Video: 'videos',
  InvestorInterest: 'investorInterests',
  Question: 'questions',
  Report: 'reports',
  Follow: 'follows',
  SavedItem: 'savedItems',
  MessageRequest: 'messageRequests',
  VerificationRequest: 'verificationRequests'
};

const toStr = (v) => (v == null ? '' : v.toString());

const matchQuery = (doc, query) => {
  if (!query || Object.keys(query).length === 0) return true;
  return Object.entries(query).every(([key, val]) => {
    if (key === '$or') {
      return val.some((clause) => matchQuery(doc, clause));
    }
    if (key === '$and') {
      return val.every((clause) => matchQuery(doc, clause));
    }
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      const fieldVal = doc[key];
      if (val.$in) return val.$in.map(toStr).includes(toStr(fieldVal));
      if (val.$ne !== undefined) return toStr(fieldVal) !== toStr(val.$ne);
      if (val.$gte !== undefined) return fieldVal >= val.$gte;
      if (val.$lte !== undefined) return fieldVal <= val.$lte;
      if (val.$lt !== undefined) return fieldVal < val.$lt;
      if (val.$gt !== undefined) return fieldVal > val.$gt;
      if (val.$exists !== undefined) return val.$exists ? fieldVal !== undefined : fieldVal === undefined;
      if (val.$regex) {
        const re = new RegExp(val.$regex, val.$options || '');
        return re.test(String(fieldVal || ''));
      }
      if (val.$all) {
        const arr = Array.isArray(fieldVal) ? fieldVal.map(toStr) : [];
        return val.$all.every((v) => arr.includes(toStr(v)));
      }
    }
    if (Array.isArray(doc[key]) && typeof val === 'string') {
      return doc[key].map(toStr).includes(toStr(val));
    }
    return toStr(doc[key]) === toStr(val);
  });
};

const applyUpdate = (doc, update) => {
  if (update.$inc) {
    Object.entries(update.$inc).forEach(([k, v]) => {
      doc[k] = (doc[k] || 0) + v;
    });
  }
  if (update.$set) Object.assign(doc, update.$set);
  if (update.$push) {
    Object.entries(update.$push).forEach(([k, v]) => {
      if (!doc[k]) doc[k] = [];
      doc[k].push(v);
    });
  }
  if (update.$pull) {
    Object.entries(update.$pull).forEach(([k, v]) => {
      if (Array.isArray(doc[k])) {
        doc[k] = doc[k].filter((item) => toStr(item) !== toStr(v) && toStr(item.userId) !== toStr(v));
      }
    });
  }
  if (!update.$inc && !update.$set && !update.$push && !update.$pull) {
    Object.assign(doc, update);
  }
  return doc;
};

class FirebaseDocument {
  constructor(collection, data, modelName) {
    this._collection = collection;
    this._modelName = modelName;
    this._isNew = !data.id && !data._id;
    Object.assign(this, data);
    this._id = data.id || data._id;
    this.id = this._id;
    this._doc = { ...data, _id: this._id, id: this._id };
    this.likes = this.likes || [];
    this.saves = this.saves || [];
    this.comments = this.comments || [];
    this.metrics = this.metrics || { views: 0, engagement: 0, investorInterest: 0, profileVisits: 0 };
    this.followers = this.followers || [];
    this.following = this.following || [];
    this.teamMembers = this.teamMembers || [];
    this.blockedUsers = this.blockedUsers || [];
    this.savedStartups = this.savedStartups || [];
    this.savedPosts = this.savedPosts || [];
    this.investorReactions = this.investorReactions || [];
    this.unreadCount = this.unreadCount instanceof Map ? this.unreadCount : new Map(Object.entries(this.unreadCount || {}));
    attachMethods(this);
  }

  toObject() {
    return { ...this._doc, _id: this._id, id: this._id };
  }

  async save() {
    const { _collection, _id, _isNew, _modelName, _doc, ...rest } = this;
    const payload = { ...rest };
    delete payload._collection;
    delete payload._modelName;
    delete payload._isNew;
    delete payload._doc;
    if (payload.unreadCount instanceof Map) {
      payload.unreadCount = Object.fromEntries(payload.unreadCount);
    }

    if (_isNew || !_id) {
      const created = await create(_collection, payload);
      Object.assign(this, created);
      this._id = created.id;
      this.id = created.id;
      this._isNew = false;
      this._doc = { ...created, _id: created.id };
      attachMethods(this);
      return this;
    }

    const updated = await updateById(_collection, _id, payload);
    Object.assign(this, updated);
    this._doc = { ...updated, _id: updated.id };
    attachMethods(this);
    return this;
  }

  async remove() {
    if (this._id) await deleteById(this._collection, this._id);
  }

  get(path) {
    if (path === 'unreadCount') return this.unreadCount;
    return this[path];
  }

  set(path, val) {
    if (path === 'unreadCount') this.unreadCount = val;
    else this[path] = val;
  }

  async populate(pathOrSpec, select) {
    const refMap = {
      sender: 'users',
      senderId: 'users',
      receiver: 'users',
      receiverId: 'users',
      recipient: 'users',
      authorId: 'users',
      userId: 'users',
      founderId: 'users',
      startupId: 'startups',
      productId: 'products',
      conversationId: 'conversations',
      lastMessage: 'messages',
      replyTo: 'messages',
      repostOf: 'posts',
      parentPostId: 'posts',
      relatedStartupId: 'startups',
      applicantId: 'users',
      investorId: 'users',
      jobId: 'jobOpenings',
      entityId: null
    };

    const specs = typeof pathOrSpec === 'string'
      ? [{ path: pathOrSpec, select }]
      : [pathOrSpec];

    for (const spec of specs) {
      const coll = refMap[spec.path] || spec.path;
      const val = this[spec.path];
      if (!val || !coll) continue;
      if (Array.isArray(val)) {
        this[spec.path] = (await Promise.all(val.map((id) => getById(coll, toStr(id))))).filter(Boolean);
      } else {
        const related = await getById(coll, toStr(val));
        this[spec.path] = related || val;
      }
      if (spec.populate && this[spec.path]) {
        const nested = new FirebaseDocument(coll, this[spec.path], '');
        await nested.populate(spec.populate);
        this[spec.path] = nested;
      }
    }
    return this;
  }
}

const attachMethods = (doc) => {
  const name = doc._modelName;
  if (name === 'User') {
    doc.comparePassword = async function (candidatePassword) {
      const hash = this.passwordHash;
      if (!hash) return false;
      return bcrypt.compare(candidatePassword, hash);
    };
    doc.toPublicJSON = function () {
      return {
        _id: this._id,
        id: this._id,
        fullName: this.fullName,
        name: this.fullName || this.name,
        username: this.username,
        email: this.email,
        role: this.role,
        profileImage: this.profileImage,
        coverImage: this.coverImage,
        bio: this.bio,
        headline: this.headline,
        skills: this.skills,
        followers: this.followers,
        following: this.following,
        isVerified: this.isVerified,
        isEmailVerified: this.isEmailVerified,
        founderScore: this.founderScore || 0,
        socialLinks: this.socialLinks,
        location: this.location,
        profileCompleted: this.profileCompleted,
        isProfileComplete: this.profileCompleted || this.isProfileComplete,
        createdAt: this.createdAt
      };
    };
  }
  if (name === 'Post') {
    doc.isLikedBy = function (userId) {
      return (this.likes || []).some((l) => toStr(l.userId) === toStr(userId));
    };
    doc.isSavedBy = function (userId) {
      return (this.saves || []).some((s) => toStr(s.userId) === toStr(userId));
    };
    doc.calculateEngagement = function () {
      const likeCount = (this.likes || []).length;
      const commentCount = (this.comments || []).length;
      const saveCount = (this.saves || []).length;
      this.likeCount = likeCount;
      this.commentCount = commentCount;
      this.saveCount = saveCount;
      this.metrics = this.metrics || {};
      this.metrics.engagement = likeCount + commentCount + (this.shares || 0) + saveCount;
      return doc.save.call(this);
    };
    doc.addLike = function (userId) {
      if (!this.isLikedBy(userId)) this.likes.push({ userId });
      return this.calculateEngagement();
    };
    doc.removeLike = function (userId) {
      this.likes = (this.likes || []).filter((l) => toStr(l.userId) !== toStr(userId));
      return this.calculateEngagement();
    };
    doc.addSave = function (userId) {
      if (!this.isSavedBy(userId)) this.saves.push({ userId });
      return this.save();
    };
    doc.removeSave = function (userId) {
      this.saves = (this.saves || []).filter((s) => toStr(s.userId) !== toStr(userId));
      return this.save();
    };
    doc.toPublicJSON = function (userId = null) {
      return {
        _id: this._id,
        id: this._id,
        authorId: this.authorId,
        startupId: this.startupId,
        contentType: this.contentType,
        category: this.category,
        type: this.type,
        content: this.content,
        mediaUrl: this.mediaUrl,
        likeCount: (this.likes || []).length,
        commentCount: (this.comments || []).length,
        saveCount: (this.saves || []).length,
        shares: this.shares,
        metrics: this.metrics,
        isLikedBy: userId ? this.isLikedBy(userId) : false,
        isSavedBy: userId ? this.isSavedBy(userId) : false,
        createdAt: this.createdAt
      };
    };
  }
  if (name === 'Startup') {
    doc.isFounder = function (userId) {
      return toStr(this.founderId) === toStr(userId);
    };
    doc.isSavedBy = function (userId) {
      return (this.saves || []).some((s) => toStr(s.userId) === toStr(userId));
    };
    doc.incrementViews = function () {
      this.metrics = this.metrics || { views: 0 };
      this.metrics.views += 1;
      return this.save();
    };
    doc.toPublicJSON = function (currentUser = null) {
      return {
        _id: this._id,
        id: this._id,
        founderId: this.founderId,
        name: this.name,
        logo: this.logo,
        oneLinePitch: this.oneLinePitch,
        description: this.description,
        industry: this.industry,
        stage: this.stage,
        metrics: this.metrics,
        createdAt: this.createdAt,
        isSavedBy: currentUser ? this.isSavedBy(currentUser._id || currentUser.id) : false
      };
    };
  }
};

class Query {
  constructor(collection, modelName, query = {}) {
    this._collection = collection;
    this._modelName = modelName;
    this._query = query;
    this._sort = null;
    this._limit = null;
    this._skip = null;
    this._select = null;
    this._populates = [];
    this._lean = false;
  }

  sort(spec) {
    this._sort = spec;
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  skip(n) {
    this._skip = n;
    return this;
  }

  select(fields) {
    this._select = fields;
    return this;
  }

  lean() {
    this._lean = true;
    return this;
  }

  populate(pathOrSpec, select) {
    if (typeof pathOrSpec === 'string') {
      this._populates.push({ path: pathOrSpec, select });
    } else if (pathOrSpec.path) {
      this._populates.push(pathOrSpec);
    }
    return this;
  }

  async _execute() {
    let items = await getAll(this._collection);
    items = items.filter((doc) => matchQuery(doc, this._query));

    if (this._sort) {
      const sortKey = typeof this._sort === 'string' ? this._sort.replace('-', '') : Object.keys(this._sort)[0];
      const desc = typeof this._sort === 'string' ? this._sort.startsWith('-') : this._sort[sortKey] === -1;
      items.sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av < bv) return desc ? 1 : -1;
        if (av > bv) return desc ? -1 : 1;
        return 0;
      });
    }

    if (this._skip) items = items.slice(this._skip);
    if (this._limit) items = items.slice(0, this._limit);

    for (const pop of this._populates) {
      const refMap = {
        authorId: 'users',
        userId: 'users',
        founderId: 'users',
        senderId: 'users',
        receiverId: 'users',
        sender: 'users',
        recipient: 'users',
        startupId: 'startups',
        productId: 'products',
        jobId: 'jobOpenings',
        applicantId: 'users',
        investorId: 'users',
        relatedStartupId: 'startups',
        entityId: null,
        followers: 'users',
        following: 'users',
        savedStartups: 'startups',
        savedPosts: 'posts',
        founderProfile: 'founderProfiles',
        investorProfile: 'investorProfiles',
        jobSeekerProfile: 'jobSeekerProfiles',
        'profileViews.viewerId': 'users',
        'teamMembers.userId': 'users',
        lastMessage: 'messages',
        replyTo: 'messages',
        repostOf: 'posts',
        parentPostId: 'posts'
      };
      const coll = refMap[pop.path] || pop.path;
      for (const item of items) {
        const val = pop.path.includes('.') ? null : item[pop.path];
        if (!val) continue;
        if (Array.isArray(val)) {
          item[pop.path] = (
            await Promise.all(val.map((id) => getById(coll, toStr(id))))
          ).filter(Boolean);
        } else {
          const related = await getById(coll, toStr(val));
          item[pop.path] = related || val;
        }
      }
    }

    if (this._select) {
      const exclude = this._select.startsWith('-');
      const fields = this._select.replace(/^-/, '').split(' ');
      items = items.map((item) => {
        if (exclude) {
          const copy = { ...item };
          fields.forEach((f) => delete copy[f]);
          return copy;
        }
        const picked = { id: item.id };
        fields.forEach((f) => {
          if (item[f] !== undefined) picked[f] = item[f];
        });
        picked.id = item.id;
        picked._id = item.id;
        return picked;
      });
    }

    if (this._lean) {
      return items.map((i) => ({ ...i, _id: i.id }));
    }

    return items.map((i) => new FirebaseDocument(this._collection, i, this._modelName));
  }

  then(resolve, reject) {
    return this._execute().then(resolve, reject);
  }
}

const createModel = (modelName) => {
  const collection = COLLECTIONS[modelName];
  if (!collection) throw new Error(`Unknown model: ${modelName}`);

  const Model = {
    collection,
    modelName,

    find(query = {}) {
      return new Query(collection, modelName, query);
    },

    findOne(query = {}) {
      return new Query(collection, modelName, query).limit(1)._execute().then((r) => r[0] || null);
    },

    async findById(id) {
      if (!id) return null;
      const data = await getById(collection, toStr(id));
      return data ? new FirebaseDocument(collection, data, modelName) : null;
    },

    async create(data) {
      const created = await create(collection, data);
      return new FirebaseDocument(collection, created, modelName);
    },

    async countDocuments(query = {}) {
      const items = await getAll(collection);
      return items.filter((doc) => matchQuery(doc, query)).length;
    },

    async findByIdAndUpdate(id, update, opts = {}) {
      const existing = await getById(collection, toStr(id));
      if (!existing) return null;
      const merged = applyUpdate({ ...existing }, update);
      const updated = await updateById(collection, toStr(id), merged);
      const doc = new FirebaseDocument(collection, updated, modelName);
      return opts.new !== false ? doc : existing;
    },

    async findOneAndUpdate(query, update, opts = {}) {
      const items = await getAll(collection);
      const found = items.find((doc) => matchQuery(doc, query));
      if (!found) return null;
      const merged = applyUpdate({ ...found }, update);
      const updated = await updateById(collection, found.id, merged);
      return new FirebaseDocument(collection, updated, modelName);
    },

    async findOneAndDelete(query) {
      const items = await getAll(collection);
      const found = items.find((doc) => matchQuery(doc, query));
      if (!found) return null;
      await deleteById(collection, found.id);
      return new FirebaseDocument(collection, found, modelName);
    },

    async deleteOne(query) {
      const items = await getAll(collection);
      const found = items.find((doc) => matchQuery(doc, query));
      if (!found) return { deletedCount: 0 };
      await deleteById(collection, found.id);
      return { deletedCount: 1 };
    },

    async updateMany(query, update) {
      const items = await getAll(collection);
      const matched = items.filter((doc) => matchQuery(doc, query));
      await Promise.all(matched.map((doc) => updateById(collection, doc.id, applyUpdate({ ...doc }, update))));
      return { modifiedCount: matched.length };
    },

    async exists(query) {
      const items = await getAll(collection);
      return items.some((doc) => matchQuery(doc, query));
    },

    async distinct(field, query = {}) {
      const items = await getAll(collection);
      const values = new Set();
      items.filter((doc) => matchQuery(doc, query)).forEach((doc) => {
        if (doc[field] !== undefined) values.add(doc[field]);
      });
      return Array.from(values);
    },

    aggregate() {
      return {
        _pipeline: [],
        match(q) {
          this._pipeline.push({ $match: q });
          return this;
        },
        unwind(f) {
          this._pipeline.push({ $unwind: f });
          return this;
        },
        group(g) {
          this._pipeline.push({ $group: g });
          return this;
        },
        sort(s) {
          this._pipeline.push({ $sort: s });
          return this;
        },
        limit(n) {
          this._pipeline.push({ $limit: n });
          return this;
        },
        async exec() {
          let items = await getAll(collection);
          for (const stage of this._pipeline) {
            if (stage.$match) items = items.filter((d) => matchQuery(d, stage.$match));
            if (stage.$unwind) {
              const field = stage.$unwind.replace('$', '');
              const next = [];
              items.forEach((d) => {
                (d[field] || []).forEach((v) => next.push({ ...d, [field]: v }));
              });
              items = next;
            }
            if (stage.$group) {
              const groups = {};
              items.forEach((d) => {
                const key = d[stage.$group._id?.replace('$', '') || '_id'];
                if (!groups[key]) groups[key] = { _id: key, count: 0 };
                groups[key].count += 1;
              });
              items = Object.values(groups);
            }
            if (stage.$sort) {
              const key = Object.keys(stage.$sort)[0];
              const desc = stage.$sort[key] === -1;
              items.sort((a, b) => (desc ? b[key] - a[key] : a[key] - b[key]));
            }
            if (stage.$limit) items = items.slice(0, stage.$limit);
          }
          return items;
        }
      };
    }
  };

  return Model;
};

const models = {};
Object.keys(COLLECTIONS).forEach((name) => {
  models[name] = createModel(name);
});

const mongooseCompat = {
  Types: {
    ObjectId: {
      isValid(id) {
        return typeof id === 'string' && id.length > 0;
      }
    }
  },
  connect: async () => ({ connection: { host: 'firebase' } }),
  connection: { close: async () => {} }
};

module.exports = {
  createModel,
  models,
  FirebaseDocument,
  mongooseCompat,
  COLLECTIONS
};
