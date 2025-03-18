const generateUUID = require('../generateUUID')

/**
 * Middleware to validate and format bank transfer requests.
 */
const validateBankTransfer = (req, res, next) => {
    try {
        const {
            senderFirstName,
            senderLastName,
            senderNumber,
            receiverFirstName,
            receiverLastName,
            receiverNumber,
            receiverAccountNo, // ✅ This will be used as payeeId
            receiverBankName,
            amount,
            currency,
        } = req.body;

        // ✅ Validate required fields
        if (!senderFirstName || !senderLastName || !senderNumber) {
            return res.status(400).json({
                success: false,
                message: "Sender information is incomplete.",
            });
        }

        if (!receiverFirstName || !receiverLastName || !receiverNumber || !receiverAccountNo || !receiverBankName) {
            return res.status(400).json({
                success: false,
                message: "Receiver information is incomplete.",
            });
        }

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount. Amount must be a positive number.",
            });
        }

        if (!currency) {
            return res.status(400).json({
                success: false,
                message: "Currency is required.",
            });
        }

        // ✅ Generate externalId (Unique Transaction ID)
        const externalId = generateUUID();

        // ✅ Set payeeId as receiverAccountNo
        const payeeId = receiverAccountNo;

        // ✅ Attach values to req.body for the controller
        req.body.externalId = externalId;
        req.body.payeeId = payeeId;

        console.log("Middleware Validated Bank Transfer Request:", req.body);
        
        next(); // Proceed to controller

    } catch (error) {
        console.error("Error in Bank Transfer Middleware:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error in validation.",
            error: error.message,
        });
    }
};

module.exports = { validateBankTransfer };
