const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

/**
 * Sends money from an MTN account to a bank account.
 * @param {Object} transferData - Transfer details including sender and receiver info.
 * @returns {Object} - Success or failure response.
 */
const sendMoneyToBank = async (transferData) => {
    try {
        console.log("Initiating Bank Transfer...");

        // ✅ Extract already validated & formatted values
        const { amount, currency, externalId, senderNumber, senderFirstName, senderLastName, payeeId } = transferData;

        // ✅ Step 1: Get Authentication Token
        console.log("Requesting MTN Remittance Token...");
        const authResponse = await axios.post(
            process.env.MTN_AUTH_REMITTANCES_URL,
            {},
            {
                headers: {
                    Authorization: "Basic " + Buffer.from(
                        `${process.env.MTN_REMITTANCE_USER_ID}:${process.env.MTN_REMITTANCE_API_SECRET}`
                    ).toString("base64"),
                    "Ocp-Apim-Subscription-Key": process.env.MTN_REMITTANCE_PRIMARY_KEY,
                },
            }
        );


        const accessToken = authResponse.data.access_token;
        console.log("Using Access Token:", accessToken);

        console.log("Authentication Successful!");

        // ✅ Step 2: Prepare Transfer Request Payload
        const requestBody = {
            amount,
            currency,
            externalId,
            payer: {
                partyIdType: "MSISDN",
                partyId: senderNumber,
            },
            payee: {
                partyIdType: "IBAN",
                partyId: payeeId, // Bank account number
            },
            payerMessage: `Transfer from ${senderFirstName} ${senderLastName}`,
            payeeNote: `Received from ${senderNumber}`,
        };
        
        

        const headers = {
            Authorization: `Bearer ${accessToken}`,
            "X-Reference-Id": externalId,
            "X-Target-Environment": process.env.MTN_ENVIRONMENT,
            "Ocp-Apim-Subscription-Key": process.env.MTN_REMITTANCE_PRIMARY_KEY,
            "Content-Type": "application/json",
        };
        
        // ✅ Move logging here
        console.log("Transfer Headers:", headers);
        console.log("Transfer Body:", JSON.stringify(requestBody, null, 2));
        

        console.log("Sending Bank Transfer Request...");
        
        // ✅ Step 3: Send the Transfer Request
        const transferResponse = await axios.post(
            `${process.env.MTN_REMITTANCES_URL}/transfer`,
            requestBody,
            { headers }
        );

        console.log("Bank Transfer Successful!");
        return {
            success: true,
            message: "Bank transfer successful",
            transactionId: externalId,
            data: transferResponse.data,
        };


    } catch (error) {
        console.error("Bank Transfer Failed!");

        let errorMessage = "Bank transfer failed. Please try again.";
        let errorData = null;

        if (error.response) {
            console.error("MTN Response Data:", JSON.stringify(error.response.data, null, 2));
            console.error("MTN Response Status:", error.response.status);
            errorMessage = error.response.data.message || errorMessage;
            errorData = error.response.data;
        } else {
            console.error("Error:", error.message);
        }
        

        return {
            success: false,
            message: errorMessage,
            error: errorData,
        };
    }
};

module.exports = { sendMoneyToBank };
