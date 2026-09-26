const dns = require("dns");
const mongoose = require("mongoose");

const DEFAULT_DB_NAME = "HomeBite";
const PUBLIC_DNS_SERVERS = ["8.8.8.8", "1.1.1.1"];

// A URI like mongodb+srv://user:pass@host/?appName=x has no database name,
// and Mongoose would silently use a database called "test".
const uriHasDatabase = (uri) =>
  /^mongodb(?:\+srv)?:\/\/[^/]+\/[^/?]+/.test(uri);

const connectOnce = () => {
  const options = uriHasDatabase(process.env.MONGO_URI)
    ? {}
    : { dbName: process.env.MONGO_DB_NAME || DEFAULT_DB_NAME };

  return mongoose.connect(process.env.MONGO_URI, options);
};

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MongoDB Connection Error: MONGO_URI is not set in .env");
    process.exit(1);
  }

  try {
    await connectOnce();
  } catch (error) {
    let finalError = error;

    // mongodb+srv:// needs a DNS "SRV" lookup. Some routers and ISPs refuse
    // it (querySrv ECONNREFUSED / ETIMEOUT), so retry once through public DNS.
    if (/querySrv/.test(error.message)) {
      console.warn(
        "System DNS refused the SRV lookup; retrying with public DNS servers...",
      );

      dns.setServers(PUBLIC_DNS_SERVERS);

      try {
        await connectOnce();
        finalError = null;
      } catch (retryError) {
        finalError = retryError;
      }
    }

    if (finalError) {
      console.error("MongoDB Connection Error:", finalError.message);
      process.exit(1);
    }
  }

  console.log(`MongoDB Connected Successfully (database: ${mongoose.connection.name})`);
};

module.exports = connectDB;
