"use strict";

const { SHOP_ROLE } = require("../constant");
const shopModel = require("../models/shop.model");

const selectOptions = {
  email: 1,
  password: 1,
  name: 1,
  verify: 1,
  roles: 1,
  oauthId: 1,
  oauthStrategy: 1,
};

class ShopService {
  static findByEmail = async ({ email, select = selectOptions }) => {
    return await shopModel
      .findOne({ email: email })
      .select(select)
      .lean()
      .exec();
  };

  static findByUserId = async ({ userId, select = selectOptions }) => {
    return await shopModel
      .findOne({ _id: userId })
      .select(select)
      .lean()
      .exec();
  };

  static createShop = async ({
    name,
    email,
    password,
    roles = [SHOP_ROLE.SHOP],
  }) => {
    return await shopModel.create({
      name,
      email,
      password,
      roles,
    });
  };

  static createByOAuth = async ({
    name,
    email,
    oauthId,
    oauthStrategy,
    roles = [SHOP_ROLE.SHOP],
  }) => {
    return await shopModel.create({
      name,
      email,
      roles,
      oauthId,
      oauthStrategy,
    });
  };

  static findByOAuthId = async (strategy, id, select = selectOptions) => {
    return await shopModel
      .findOne({
        oauthId: id,
        oauthStrategy: strategy,
      })
      .select(select)
      .exec();
  };
}

module.exports = ShopService;
