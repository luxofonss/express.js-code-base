"use strict";

const {
  BadRequestError,
  AuthFailureError,
  ForbiddenError,
} = require("../core/error.response");
const ShopService = require("./shop.service");
const bcrypt = require("bcrypt");
const createKeys = require("../utils/createKey");
const crypto = require("node:crypto");
const { createTokenPair } = require("../auth/authUtils");
const KeyStoreService = require("./keyToken.service");
const getInfoData = require("../utils/getInfoData");
const verifyJWT = require("../utils/verifyJWT");
const { updateKeyToken } = require("./keyToken.service");
const { REFRESH_TOKEN_EXPIRATION, SHOP_ROLE } = require("../constant");

class AccessService {
  static signUp = async (req, res) => {
    const { name, email, password } = req.body;
    // check if email has already been registered
    const foundShop = await ShopService.findByEmail({ email });
    console.log(foundShop);
    if (foundShop) {
      throw new BadRequestError("Error: Shop has already been registered");
    }

    // hash password
    const passwordHash = await bcrypt.hash(password, 10);

    //create new account
    const newShop = await ShopService.createShop({
      name,
      email,
      password: passwordHash,
    });

    // create shop successfully
    if (newShop) {
      // create public key, private key
      const { privateKey, publicKey } = createKeys();
      console.log({ privateKey, publicKey });

      // create token pair
      const publicKeyObject = crypto.createPublicKey(publicKey);
      const privateKeyObject = crypto.createPrivateKey(privateKey);

      const tokens = await createTokenPair(
        {
          userId: newShop._id,
          email: email,
          roles: [SHOP_ROLE.SHOP],
        },
        publicKeyObject,
        privateKeyObject
      );

      const keyStore = await KeyStoreService.createKeyToken({
        userId: newShop._id,
        privateKey,
        publicKey,
        refreshToken: tokens.refreshToken,
      });

      if (!keyStore) {
        throw new BadRequestError("Error: Key token is not available");
      }

      res.cookie("jwt", tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        path: "/",
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      return {
        code: "xxx",
        shop: await getInfoData({
          fields: ["_id", "name", "email"],
          object: newShop,
        }),
        tokens,
      };
    }
    return {
      code: 400,
      metadata: null,
    };
  };

  static logIn = async (req, res) => {
    const { email, password } = req.body;
    console.log({ email, password });
    const cookies = req.cookies;
    console.log("cookies jwt: ", cookies?.jwt);
    // check if user exists
    const foundShop = await ShopService.findByEmail({ email });
    if (!foundShop)
      throw new AuthFailureError("Error: Email or password is not correct");

    // compare password
    const match = bcrypt.compare(password, foundShop.password);
    if (!match) throw new AuthFailureError("Error: Unauthorized!");

    // create public key, private key
    const keyStore = await KeyStoreService.findByUserId(foundShop._id);
    if (!keyStore) throw new AuthFailureError("Error: Shop not found!");

    // create token pair
    const publicKeyObject = crypto.createPublicKey(keyStore.publicKey);
    const privateKeyObject = crypto.createPrivateKey(keyStore.privateKey);

    const tokens = await createTokenPair(
      {
        userId: foundShop._id,
        email: foundShop.email,
        roles: foundShop.roles,
      },
      publicKeyObject,
      privateKeyObject
    );

    const shopKeyStore = await KeyStoreService.findByUserId(foundShop._id);

    const newRefreshTokens = !cookies?.jwt
      ? shopKeyStore.refreshToken
      : shopKeyStore.refreshToken.filter((rt) => rt !== cookies.jwt);

    // update keyToken schema
    await KeyStoreService.updateKeyToken({
      userId: foundShop._id,
      oldRefreshToken: !cookies?.jwt ? null : cookies.jwt,
      refreshToken: [...newRefreshTokens, tokens.refreshToken],
    });

    // clear old refresh token in cookies
    if (cookies?.jwt) {
      res.clearCookie("jwt", {
        httpOnly: true,
        sameSite: "None",
        secure: true,
      });
    }

    // create secure cookie with refresh token
    res.cookie("jwt", tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return {
      shop: getInfoData({
        object: foundShop,
        fields: ["_id", "email", "roles", "verify"],
      }),
      tokens,
    };
  };

  static refreshToken = async (req, res) => {
    console.log("req", req.cookies);
    const refreshToken = req.cookies?.jwt;

    // check if user exists
    const holderToken = await KeyStoreService.findByRefreshToken(refreshToken);
    console.log("refreshToken: ", refreshToken, holderToken);
    if (!holderToken) throw new AuthFailureError("User not found!");

    // check valid refresh token
    const { userId, email } = await verifyJWT(
      refreshToken,
      holderToken.privateKey
    );

    // check if user not found
    const foundShop = await ShopService.findByEmail({ email });
    if (!foundShop) throw new AuthFailureError("Unauthorized!");

    // check if refreshToken has been used previously
    const foundKeyTokenUsed = await KeyStoreService.findByRefreshTokenUsed(
      refreshToken
    );

    if (foundKeyTokenUsed) {
      // delete all tokens
      await KeyStoreService.removeAllTokens(foundKeyTokenUsed.userId);
      throw new ForbiddenError("Something went wrong, please try again!");
    }

    // create new tokens
    const tokens = await createTokenPair(
      { userId: userId, email: email, roles: foundShop.roles },
      holderToken.publicKey,
      holderToken.privateKey
    );

    //update tokens
    console.log("update tokens", holderToken, refreshToken);
    await holderToken
      .updateOne({
        refreshToken: [
          ...holderToken.refreshToken.filter((token) => token !== refreshToken),
          tokens.refreshToken,
        ],
        $push: {
          refreshTokenUsed: refreshToken, //token has been used
        },
      })
      .exec();

    // clear old refresh token in cookies
    if (req.cookies?.jwt) {
      res.clearCookie("jwt", {
        httpOnly: true,
        sameSite: "None",
        secure: true,
      });
    }

    // create secure cookie with refresh token
    res.cookie("jwt", tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return {
      shop: getInfoData({
        fields: ["_id", "name", "email", "roles"],
        object: foundShop,
      }),
      accessToken: tokens.accessToken,
    };
  };

  static logout = async (res, { keyStore, refreshToken }) => {
    await updateKeyToken({
      userId: keyStore.userId,
      refreshToken: keyStore.refreshToken.filter((rt) => rt !== refreshToken),
      oldRefreshToken: refreshToken,
    });

    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });

    return {};
  };

  static getProfile = async ({ accessToken, keyStore }) => {
    const shop = await ShopService.findByUserId({ userId: keyStore.userId });
    if (!shop) throw new AuthFailureError("Unauthorized");

    return {
      shop: getInfoData({
        fields: ["_id", "name", "email", "roles"],
        object: shop,
      }),
    };
  };
}

module.exports = AccessService;
