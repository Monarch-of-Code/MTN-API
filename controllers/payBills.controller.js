// payBills.controller.js

const axios = require("axios");
const generateUUID = require('../generateUUID');
const https = require('https');
require("dotenv").config();

// Create axios instance with SSL configuration
const axiosInstance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false // Disable SSL verification for sandbox environment
    }),
    timeout: 60000 // Set timeout to 60 seconds
});

// Function to format phone number to MSISDN format
const formatToMSISDN = (phoneNumber) => {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If number starts with 0, replace it with country code (256 for Uganda)
    if (cleaned.startsWith('0')) {
        return '256' + cleaned.substring(1);
    }
    
    // If number doesn't start with country code, add it
    if (!cleaned.startsWith('256')) {
        return '256' + cleaned;
    }
    
    return cleaned;
};

// Function to check transaction status
const checkTransactionStatus = async (transactionId, accessToken) => {
    try {
        const statusUrl = `${process.env.MTN_DISBURSEMENTS_URL}/transfer/${transactionId}`.replace(/([^:]\/)\/+/g, "$1");

        const response = await axiosInstance.get(
            statusUrl,
            {
                headers: {
                    "X-Target-Environment": process.env.MTN_ENVIRONMENT,
                    "Ocp-Apim-Subscription-Key": process.env.MTN_DISBURSEMENT_PRIMARY_KEY,
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );
        
        console.log("Transaction Status Response:", {
            status: response.status,
            data: response.data
        });
        
        return response.data;
    } catch (error) {
        console.error("Error checking transaction status:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            url: error.config?.url,
            headers: error.config?.headers
        });
        throw error;
    }
};

// Function to handle bill payment
const payBill = async (req, res) => {
    try {
        const { billType, billerCode, billId, amount, currency } = req.validatedData;
        const { referenceNumber, phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                status: "error",
                message: "Phone number is required for the payment"
            });
        }

        // Generate a unique transaction ID
        const transactionId = generateUUID();

        // Format amount to have exactly 2 decimal places
        const formattedAmount = Number(amount).toFixed(2);

        // Format the phone number to MSISDN
        const formattedPhoneNumber = formatToMSISDN(phoneNumber);

        // Prepare API request payload
        const payload = {
            amount: formattedAmount,
            currency: "EUR", // Using EUR as it's supported in the sandbox
            externalId: transactionId,
            payee: {
                partyIdType: "MSISDN",
                partyId: formattedPhoneNumber
            },
            payerMessage: `Payment for ${billType} - Bill ID: ${billId} - Biller: ${billerCode}`,
            payeeNote: referenceNumber || `Bill ID: ${billId}`
        };

        // Only add callback URL if it's configured
        if (process.env.MTN_CALLBACK_HOST) {
            payload.callbackUrl = process.env.MTN_CALLBACK_HOST;
        }

        console.log("Prepared payment payload:", JSON.stringify(payload, null, 2));
        console.log("Original phone number:", phoneNumber);
        console.log("Formatted MSISDN:", formattedPhoneNumber);

        // Clean up the URL by removing any double slashes
        const paymentUrl = `${process.env.MTN_DISBURSEMENTS_URL}/transfer`.replace(/([^:]\/)\/+/g, "$1");
        console.log('Payment URL:', paymentUrl);

        // Send request to MTN Disbursement API
        const paymentResponse = await axiosInstance.post(
            paymentUrl,
            payload,
            {
                headers: {
                    "X-Reference-Id": transactionId,
                    "X-Target-Environment": process.env.MTN_ENVIRONMENT,
                    "Ocp-Apim-Subscription-Key": process.env.MTN_DISBURSEMENT_PRIMARY_KEY,
                    "Authorization": `Bearer ${req.mtnToken}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }
        );

        console.log("Payment API Response:", {
            status: paymentResponse.status,
            statusText: paymentResponse.statusText,
            data: paymentResponse.data,
            headers: paymentResponse.headers
        });

        // Wait a moment before checking status
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check initial transaction status
        let status;
        try {
            status = await checkTransactionStatus(transactionId, req.mtnToken);
        } catch (statusError) {
            console.warn("Could not fetch initial status:", statusError.message);
            status = { status: 'PENDING' };
        }

        // Return success response with transaction details
        res.status(202).json({
            status: "success",
            message: "Bill payment initiated successfully",
            data: {
                transactionId,
                billType,
                billerCode,
                billId,
                phoneNumber: formattedPhoneNumber,
                amount: formattedAmount,
                currency: "EUR",
                referenceNumber,
                transactionStatus: status.status || 'PENDING',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("Error processing bill payment:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            url: error.config?.url,
            headers: error.config?.headers,
            payload: error.config?.data
        });
        
        let errorMessage = "Failed to process bill payment";
        let errorDetails = error.message;

        // Handle specific MTN API errors
        if (error.response?.data) {
            errorMessage = error.response.data.message || errorMessage;
            errorDetails = error.response.data;
        }
        
        const errorResponse = {
            status: "error",
            message: errorMessage,
            error: {
                code: error.response?.status || 500,
                details: errorDetails,
                timestamp: new Date().toISOString()
            }
        };

        // Send error response
        res.status(error.response?.status || 500).json(errorResponse);
    }
};

// Function to get bill payment status
const getBillPaymentStatus = async (req, res) => {
    try {
        const { transactionId } = req.params;

        if (!transactionId) {
            return res.status(400).json({
                status: "error",
                message: "Transaction ID is required"
            });
        }

        const status = await checkTransactionStatus(transactionId, req.mtnToken);

        res.status(200).json({
            status: "success",
            data: {
                transactionId,
                status: status.status,
                details: status,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("Error checking bill payment status:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            url: error.config?.url,
            headers: error.config?.headers
        });
        
        res.status(500).json({
            status: "error",
            message: "Failed to check bill payment status",
            error: {
                details: error.response?.data || error.message,
                timestamp: new Date().toISOString()
            }
        });
    }
};

module.exports = { payBill, getBillPaymentStatus };
