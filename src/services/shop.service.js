"use strict";

const { SHOP_ROLE } = require("../constant");
const shopModel = require("../models/shop.model");

const selectOptions = { email: 1, password: 1, name: 1, verify: 1, roles: 1 };

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
}

module.exports = ShopService;
