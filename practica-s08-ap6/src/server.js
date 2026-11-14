const http = require('node:http');
const { MongoClient } = require('mongodb');

const port = Number(process.env.APP_PORT || 3000);
const dbName = process.env.DB_NAME || 'practica_s08';
const host = process.env.DB_HOST || 'mongo-service';
const user = process.env.DB_USER;
const pass = process.env.DB_PASS;

if (!user || !pass) {
  throw new Error('Faltan DB_USER o DB_PASS en el entorno');
}

const uri = `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:27017/${dbName}?authSource=admin`;
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
let database;
let connecting = false;

async function connectMongo() {
  if (database || connecting) return;
  connecting = true;
  try {
    await client.connect();
    database = client.db(dbName);
    console.log(`Conectado a MongoDB: ${dbName} en ${host}`);
  } catch (error) {
    console.error(`MongoDB no disponible: ${error.message}`);
  } finally {
    connecting = false;
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    return res.end('ok');
  }

  if (req.url === '/readyz') {
    const ready = Boolean(database);
    res.writeHead(ready ? 200 : 503, { 'content-type': 'text/plain; charset=utf-8' });
    return res.end(ready ? 'ready' : 'waiting for MongoDB');
  }

  if (req.url === '/') {
    if (!database) {
      res.writeHead(503, { 'content-type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ status: 'starting', database: dbName }));
    }
    try {
      const collection = database.collection('visits');
      const result = await collection.insertOne({ at: new Date() });
      const count = await collection.countDocuments();
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({
        status: 'ok',
        message: 'Backend conectado a MongoDB',
        database: dbName,
        totalVisits: count,
        visitId: result.insertedId,
      }));
    } catch (error) {
      console.error(`Error de consulta MongoDB: ${error.message}`);
      res.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ status: 'error', message: 'No se pudo consultar MongoDB' }));
    }
  }

  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Backend escuchando en el puerto ${port}`);
  void connectMongo();
  setInterval(() => void connectMongo(), 5000).unref();
});

function shutdown() {
  server.close(async () => {
    await client.close().catch(() => {});
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
