const { sendMoneyToBank } = require("../services/bankTransfer.service");

/**
 * @function handleBankTransfer
 * @description Handles the bank transfer request from the client
 */
const handleBankTransfer = async (req, res) => {
    try {
        console.log("Incoming Bank Transfer Request:", req.body);

        // ✅ Call the service function (Middleware already validated & formatted inputs)
        const response = await sendMoneyToBank(req.body);

        if (!response.success) {
            return res.status(500).json({
                success: false,
                message: response.message || "Failed to transfer funds to the bank",
                error: response.error || "Unknown error occurred",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Funds successfully transferred to the bank!",
            transactionId: response.transactionId,
            data: response.data,
        });

    } catch (error) {
        console.error("Error in Bank Transfer Controller:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

module.exports = { handleBankTransfer };
