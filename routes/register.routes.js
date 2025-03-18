const express = require("express");
const { registerUser } = require("../controllers/register.controller");
const { validateUserRegistration } = require("../middlewares/register.middleware");

const router = express.Router();

// ✅ Define the registration route
router.post("/register", validateUserRegistration, registerUser);

module.exports = router;
