"use strict";

const development = {
  app: {
    port: process.env.PORT || 8080,
  },
  db: {
    host: process.env.DEV_DB_HOST || "127.0.0.1",
    port: process.env.DEV_DB_PORT || 27017,
    name: process.env.DEV_DB_NAME,
  },
};

const production = {
  app: {
    port: process.env.PORT || 8080,
  },
  db: {
    host: process.env.PROD_DB_HOST || "127.0.0.1",
    port: process.env.PROD_DB_PORT || 27017,
    name: process.env.PROD_DB_NAME,
  },
};

const config = { development, production };
const env = process.env.NODE_ENV || "development";

module.exports = config[env];
