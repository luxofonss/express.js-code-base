"use strict";

const express = require("express");
const AccessController = require("../../controllers/access.controller");
const asyncHandler = require("../../helpers/asyncHandler");
const verifyAccessToken = require("../../middlewares/verifyAccessToken");
const verifyRefreshToken = require("../../middlewares/verifyRefreshToken");
const router = express.Router();

router.post("/shop/signup", AccessController.signUp);
router.post("/shop/login", asyncHandler(AccessController.logIn));
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
