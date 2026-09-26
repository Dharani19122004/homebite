const express = require("express");

const router = express.Router();

const { getAllUsers, getUserById } = require("../controllers/userController");
const adminMiddleware = require("../middleware/adminMiddleware");

router.get("/", adminMiddleware, getAllUsers);

router.get("/:id", adminMiddleware, getUserById);

module.exports = router;
