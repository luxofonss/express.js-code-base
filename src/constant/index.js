"use strict";

const SHOP_ROLE = {
  SHOP: "SHOP",
  ADMIN: "ADMIN",
};

const HEADER = {
  API_KEY: "x-api-key",
  CLIENT_ID: "x-client-id",
  AUTHORIZATION: "authorization",
};

const ACCESS_TOKEN_EXPIRATION = 30 * 60; // 30 mins

const REFRESH_TOKEN_EXPIRATION = 30 * 24 * 60 * 60 * 1000; // 30 days

module.exports = {
  SHOP_ROLE,
  HEADER,
  ACCESS_TOKEN_EXPIRATION,
  REFRESH_TOKEN_EXPIRATION,
};
