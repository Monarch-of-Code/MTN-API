const axios = require("axios");
require("dotenv").config();
const generateUUID = require("../generateUUID");

/**
 * @function registerUser
 * @description Registers a new user and automatically creates an MTN Disbursement account.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const registerUser = async (req, res) => {
    try {
        console.log("Incoming User Registration Request:", req.body);

        const { firstName, lastName, phoneNumber } = req.body;

        // ✅ Validate required fields
        if (!firstName || !lastName || !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: firstName, lastName, phoneNumber",
            });
        }

        // ✅ Generate a unique user ID
        const userId = generateUUID();

        // ✅ Define API credentials (Disbursement by default)
        const apiBaseUrl = process.env.MTN_API_BASE_URL;
        const subscriptionKey = process.env.MTN_DISBURSEMENT_PRIMARY_KEY; // Default: Disbursements
        const callbackHost = process.env.MTN_CALLBACK_HOST;

        if (!apiBaseUrl || !subscriptionKey || !callbackHost) {
            console.error("Missing MTN API credentials.");
            return res.status(500).json({ success: false, message: "MTN API credentials are missing!" });
        }

        // ✅ Step 1: Create API User in MTN's Disbursement System
        console.log("Creating API User in MTN Disbursement System...");
        await axios.post(
            `${apiBaseUrl}/v1_0/apiuser`,
            { providerCallbackHost: callbackHost },
            {
                headers: {
                    "Ocp-Apim-Subscription-Key": subscriptionKey,
                    "X-Reference-Id": userId,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("API User Created Successfully!");

        // ✅ Step 2: Generate API Key
        console.log("Generating API Key...");
        const apiKeyResponse = await axios.post(
            `${apiBaseUrl}/v1_0/apiuser/${userId}/apikey`,
            {},
            {
                headers: {
                    "Ocp-Apim-Subscription-Key": subscriptionKey,
                },
            }
        );

        const apiKey = apiKeyResponse.data.apiKey;

        return res.status(201).json({
            success: true,
            message: "User registered successfully under MTN Disbursements!",
            data: { userId, firstName, lastName, phoneNumber, apiKey },
        });

    } catch (error) {
        console.error("Error Registering User:", error.response?.data || error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to register user",
            error: error.response?.data || error.message,
        });
    }
};

module.exports = { registerUser };
