const axios = require("axios");
const generateUUID = require("../generateUUID");
require("dotenv").config(); // Load environment variables

/**
 * @function receiveMoney
 * @description Handles receiving money via MTN Collections API.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const receiveMoney = async (req, res) => {
    try {
        console.log("Incoming Request Body:", req.body);

        let { amount, currency, payerNumber, externalId } = req.body;

        // ✅ Validate request body
        if (!amount || !currency || !payerNumber) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: amount, currency, payerNumber"
            });
        }

        // Ensure amount is a positive number
        if (isNaN(amount) || Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount. It must be a positive number."
            });
        }

        // Ensure payer number is valid
        if (!/^\d+$/.test(payerNumber)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payer number. It should contain only digits."
            });
        }

        // ✅ Generate UUID if not provided
        if (!externalId) {
            externalId = generateUUID();
        }
        console.log("Generated External ID:", externalId);

        // ✅ Define API credentials
        const authUrl = process.env.MTN_AUTH_COLLECTIONS_URL;
        const apiBaseUrl = process.env.MTN_COLLECTIONS_URL;
        const subscriptionKey = process.env.MTN_COLLECTION_PRIMARY_KEY;
        const userId = process.env.MTN_COLLECTION_USER_ID;
        const apiSecret = process.env.MTN_COLLECTION_API_SECRET;

        if (!authUrl || !apiBaseUrl || !subscriptionKey || !userId || !apiSecret) {
            console.error("Missing MTN API credentials.");
            return res.status(500).json({ success: false, message: "MTN API credentials are missing!" });
        }

        console.log("🔹 Getting access token...");

        // ✅ Step 1: Get Access Token
        const authResponse = await axios.post(
            authUrl,
            new URLSearchParams({ grant_type: "client_credentials" }).toString(),
            {
                headers: {
                    "Ocp-Apim-Subscription-Key": subscriptionKey,
                    Authorization: `Basic ${Buffer.from(`${userId}:${apiSecret}`).toString("base64")}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                }
            }
        );

        const accessToken = authResponse.data.access_token;
        if (!accessToken) {
            throw new Error("Failed to retrieve access token.");
        }
        console.log("Access Token Received:", accessToken);

        // ✅ Step 2: Request Payment (Ask user to send money)
        console.log("Requesting Payment...");

        const collectionResponse = await axios.post(
            `${apiBaseUrl}/requesttopay`,
            {
                amount,
                currency,
                externalId,
                payer: { partyIdType: "MSISDN", partyId: payerNumber },
                payerMessage: "Please send money via API",
                payeeNote: "Payment request received",
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Ocp-Apim-Subscription-Key": subscriptionKey,
                    "X-Reference-Id": externalId,
                    "X-Target-Environment": process.env.MTN_ENVIRONMENT,
                    "Content-Type": "application/json",
                }
            }
        );

        console.log("Payment Request Sent Successfully:", collectionResponse.data);
        return res.status(200).json({
            success: true,
            message: "Payment request sent successfully!",
            data: collectionResponse.data,
        });

    } catch (error) {
        console.error("Error Requesting Payment:", error.response?.data || error.message);

        // Handle specific error responses
        if (error.response) {
            return res.status(error.response.status || 500).json({
                success: false,
                message: "Failed to request payment",
                error: error.response.data,
            });
        } else {
            return res.status(500).json({
                success: false,
                message: "Failed to request payment due to an internal error",
                error: error.message,
            });
        }
    }
};

module.exports = { receiveMoney };
