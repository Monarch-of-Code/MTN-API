const axios = require("axios");
const generateUUID = require("../generateUUID");
require("dotenv").config(); // Load environment variables

/**
 * @function sendMoney
 * @description Handles sending money via MTN Disbursement API.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendMoney = async (req, res) => {
    try {
        console.log("Incoming Request Body:", req.body);

        let { amount, currency, recipientNumber, externalId } = req.body;

        // ✅ Validate request body
        if (!amount || !currency || !recipientNumber) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: amount, currency, recipientNumber"
            });
        }

        // Ensure amount is a positive number
        if (isNaN(amount) || Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount. It must be a positive number."
            });
        }

        // Ensure recipient number is valid
        if (!/^\d+$/.test(recipientNumber)) {
            return res.status(400).json({
                success: false,
                message: "Invalid recipient number. It should contain only digits."
            });
        }

        // ✅ Generate UUID if not provided
        if (!externalId) {
            externalId = generateUUID();
        }
        console.log("Generated External ID:", externalId);

        // ✅ Define API credentials
        const authUrl = process.env.MTN_AUTH_DISBURSEMENTS_URL;
        const apiBaseUrl = process.env.MTN_DISBURSEMENTS_URL;
        const subscriptionKey = process.env.MTN_DISBURSEMENT_PRIMARY_KEY;
        const userId = process.env.MTN_DISBURSEMENT_USER_ID;
        const apiSecret = process.env.MTN_DISBURSEMENT_API_SECRET;

        if (!authUrl || !apiBaseUrl || !subscriptionKey || !userId || !apiSecret) {
            console.error("Missing MTN API credentials.");
            return res.status(500).json({ success: false, message: "MTN API credentials are missing!" });
        }

        console.log("Getting access token...");

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

        // ✅ Step 2: Send Money Request
        console.log("🔹 Sending Money...");

        const disbursementResponse = await axios.post(
            `${apiBaseUrl}/transfer`,
            {
                amount,
                currency,
                externalId,
                payee: { partyIdType: "MSISDN", partyId: recipientNumber },
                payerMessage: "Money sent via API",
                payeeNote: "Payment received",
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

        console.log("Money Sent Successfully:", disbursementResponse.data);
        return res.status(200).json({
            success: true,
            message: "Money sent successfully!",
            data: disbursementResponse.data,
        });

    } catch (error) {
        console.error("Error Sending Money:", error.response?.data || error.message);

        // Handle specific error responses
        if (error.response) {
            return res.status(error.response.status || 500).json({
                success: false,
                message: "Failed to send money",
                error: error.response.data,
            });
        } else {
            return res.status(500).json({
                success: false,
                message: "Failed to send money due to an internal error",
                error: error.message,
            });
        }
    }
};

module.exports = { sendMoney };
