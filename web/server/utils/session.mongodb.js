'use strict'

Object.defineProperty(exports, '__esModule', { value: true })

var mongodb = require('mongodb')
var shopifyApi = require('@shopify/shopify-api')

function _interopNamespace(e) {
  if (e && e.__esModule) return e
  var n = Object.create(null)
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k)
        Object.defineProperty(
          n,
          k,
          d.get
            ? d
            : {
                enumerable: true,
                get: function () {
                  return e[k]
                }
              }
        )
      }
    })
  }
  n['default'] = e
  return Object.freeze(n)
}

var mongodb__namespace = /*#__PURE__*/ _interopNamespace(mongodb)

const defaultMongoDBSessionStorageOptions = {
  sessionCollectionName: 'shopify_sessions'
}
class MongoDBSessionStorage {
  static withCredentials(host, dbName, username, password, opts) {
    return new MongoDBSessionStorage(
      new URL(
        `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(
          password
        )}@${host}/`
      ),
      dbName,
      opts
    )
  }
  constructor(dbUrl, dbName, opts = {}) {
    this.dbUrl = dbUrl
    this.dbName = dbName
    this.ready = void 0
    this.options = void 0
    // `mongodb` has no types for `MongoClient`???!
    this.client = void 0
    if (typeof this.dbUrl === 'string') {
      this.dbUrl = new URL(this.dbUrl)
    }
    this.options = {
      ...defaultMongoDBSessionStorageOptions,
      ...opts
    }
    this.ready = this.init()
  }
  async storeSession(session) {
    await this.ready
    await this.collection.findOneAndReplace(
      {
        id: session.id
      },
      session.toObject(),
      {
        upsert: true
      }
    )
    return true
  }
  async loadSession(id) {
    await this.ready
    const result = await this.collection.findOne({
      id
    })
    return result ? new shopifyApi.Session(result) : undefined
  }
  async deleteSession(id) {
    await this.ready
    await this.collection.deleteOne({
      id
    })
    return true
  }
  async deleteSessions(ids) {
    await this.ready
    await this.collection.deleteMany({
      id: {
        $in: ids
      }
    })
    return true
  }
  async findSessionsByShop(shop) {
    await this.ready
    const rawResults = await this.collection
      .find({
        shop
      })
      .toArray()
    if (
      !rawResults ||
      (rawResults === null || rawResults === void 0
        ? void 0
        : rawResults.length) === 0
    )
      return []
    return rawResults.map((rawResult) => new shopifyApi.Session(rawResult))
  }
  async disconnect() {
    await this.client.close()
  }
  get collection() {
    return this.client
      .db(this.dbName)
      .collection(this.options.sessionCollectionName)
  }
  async init() {
    this.client = new mongodb__namespace.MongoClient(this.dbUrl.toString())
    await this.client.connect()
    await this.client.db().command({
      ping: 1
    })
    await this.createCollection()
  }
  async hasSessionCollection() {
    const collections = await this.client.db().collections()
    return collections
      .map((collection) => collection.collectionName)
      .includes(this.options.sessionCollectionName)
  }
  async createCollection() {
    const hasSessionCollection = await this.hasSessionCollection()
    if (!hasSessionCollection) {
      await this.client.db().collection(this.options.sessionCollectionName)
    }
  }
}

exports.MongoDBSessionStorage = MongoDBSessionStorage
