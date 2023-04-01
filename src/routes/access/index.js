"use strict";

const express = require("express");
const AccessController = require("../../controllers/access.controller");
const asyncHandler = require("../../helpers/asyncHandler");
const verifyAccessToken = require("../../middlewares/verifyAccessToken");
const verifyRefreshToken = require("../../middlewares/verifyRefreshToken");
const router = express.Router();
const passport = require("passport");

router.post("/shop/signup", AccessController.signUp);
router.post("/shop/login", asyncHandler(AccessController.logIn));

router.get(
  "/auth/login/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    accessType: "offline",
    prompt: "consent",
  })
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureMessage: "Login failed",
    failureRedirect: process.env.CLIENT_ERROR_LOGIN_URL,
    successRedirect: process.env.CLIENT_SUCCESS_LOGIN_URL,
    accessType: "offline",
    prompt: "consent",
  }),
  (req, res) => {
    console.log("get call back and login success message");
    console.log("user: ", req.user);
    // res.send("Thank you for logging in");
    res.send("Login successfully!");
  }
);

router.get("/auth/google/logout", (req, res) => {
  req.logout();
  res.clearCookie("session.sig", { path: "/" });
  res.clearCookie("session", { path: "/" });
  res.send("Logout");
});

router.get(
  "/shop/refresh-token",
  asyncHandler(AccessController.handleRefreshToken)
);
router.post("/shop/logout", [
  asyncHandler(verifyRefreshToken),
  asyncHandler(AccessController.handleLogout),
]);
router.get("/shop/profile", [
  asyncHandler(verifyAccessToken),
  asyncHandler(AccessController.handleProfile),
]);

module.exports = router;
