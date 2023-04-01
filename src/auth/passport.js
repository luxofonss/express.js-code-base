const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy,
  ExtractJwt = require("passport-jwt").ExtractJwt;
const shopModel = require("../models/shop.model");
const ShopService = require("../services/shop.service");
require("dotenv").config();

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

// define options
// opts.issuer = "accounts.examplesoft.com";
// opts.audience = "yoursite.net";

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      console.log("jwt strategy running");
      console.log("jwt payload: ", jwt_payload);
      const user = await ShopService.findByEmail(jwt_payload.email);
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  })
);
