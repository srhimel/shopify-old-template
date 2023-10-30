const dbString = process.env.MONGO_STRING
const dbName = process.env.MONGO_DATABASE
const mongoString = dbString + '/' + dbName

export { dbString, dbName, mongoString }
