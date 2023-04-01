const passport = require("passport");
const ShopService = require("../services/shop.service");
const LocalStrategy = require("passport-local").Strategy;

passport.use(
  "local.register",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    },
    async function (req, email, password, done) {
      try {
        const user = await ShopService.findByEmail({ email });
        if (user) {
          return done(null, false, {
            message: "Email already exists",
          });
        } 

        const newUser = {
          name: req.body.name,
          email: req.body.email,

        };
      } catch (error) {
        console.log("error local register: ", error);
        return done(error);
      }
    }
  )
);
