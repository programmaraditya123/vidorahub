const express = require("express");
const { allUsers, userAction } = require("./users.controller");

const router = express.Router();

router.get("/allusers",allUsers)

router.patch("/user/:id/action", userAction);

module.exports = router;