/**
 * @middleware validateUserRegistration
 * @description Validates the user registration request
 */
const validateUserRegistration = (req, res, next) => {
    const { firstName, lastName, phoneNumber } = req.body;

    // Ensure required fields are provided
    if (!firstName || !lastName || !phoneNumber) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields: firstName, lastName, phoneNumber",
        });
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{6,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({
            success: false,
            message: "Invalid phone number format.",
        });
    }

    next(); // Proceed to the controller
};

module.exports = { validateUserRegistration };
