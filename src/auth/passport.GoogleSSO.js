const passport = require("passport");
const { ErrorResponse } = require("../core/error.response");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const shopModel = require("../models/shop.model");
const ShopService = require("../services/shop.service");
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
      accessType: "offline",
      prompt: "consent",
    },
    async function (req, accessToken, refreshToken, profile, cb) {
      console.log("profile", profile);
      const defaultUser = {
        fullName: `${profile.name.givenName} ${profile.name.familyName} `,
        email: profile.emails[0].value,
        avatar: profile.photos[0].value,
        googleId: profile.id,
      };

      const user = await ShopService.findByOAuthId(
        "Google",
        defaultUser.googleId
      );

      if (user) {
        return cb(null, user);
      }

      if (!user) {
        try {
          const newUser = await ShopService.createByOAuth({
            name: defaultUser.fullName,
            email: defaultUser.email,
            oauthId: defaultUser.googleId,
            oauthStrategy: "Google",
          });
          return cb(null, newUser);
        } catch (error) {
          cb(error, null);
        }
      }
    }
  )
);

passport.serializeUser((user, callback) => {
  console.log("serializeUser ", user);
  callback(null, user._id);
});

passport.deserializeUser(async (id, callback) => {
  try {
    const user = await ShopService.findByUserId({ userId: id });
    console.log("deserialized user: ", user);
    callback(null, user);
  } catch (error) {
    callback(error, null);
  }
});
