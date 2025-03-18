const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const sendMoneyRoutes = require("./routes/sendMoney.routes");
const receiveMoneyRoutes = require("./routes/receiveMoney.routes");
const registerRoutes = require('./routes/register.routes');
const bankTransferRoutes = require('./routes/bankTransfer.routes');

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Define API routes
app.use("/api/disbursements", sendMoneyRoutes);
app.use("/api/collection", receiveMoneyRoutes);
app.use("/api/auth", registerRoutes);
app.use("/api/bank-transfer", bankTransferRoutes); // Changed from /api/remittances to /api/bank-transfer

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Something went wrong!'
    });
});

// ✅ Start server
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
