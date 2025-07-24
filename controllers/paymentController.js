const axios = require("axios");
const User = require("../models/user-model");

const PAYPRO_API_KEY = process.env.PAYPRO_API_KEY;
const CALLBACK_URL = "https://your-domain.com/api/payment/webhook";

const paymentController = {};

// Create invoice
paymentController.createInvoice = async (req, res) => {
  try {
    const user = req.session.user;
    const amount = 500; // fixed or dynamic

    const payload = {
      customer_name: user.name,
      customer_email: user.email,
      customer_mobile: user.phone || "03001234567", // required by PayPro
      amount,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        .toISOString()
        .split("T")[0],
      send_email: true,
      send_sms: true,
      payment_method: "easy_paisa,jazz_cash",
      redirect_url: "https://your-domain.com/payment-success",
      webhook_url: CALLBACK_URL,
    };

    const { data } = await axios.post(
      "https://sandbox.paypro.com.pk/api/invoice",
      payload,
      {
        headers: { Authorization: `Bearer ${PAYPRO_API_KEY}` },
      }
    );

    res.json({ invoiceUrl: data.invoice_url });
  } catch (err) {
    console.error("Create Invoice Error:", err.message);
    res.status(500).json({ message: "Failed to create invoice" });
  }
};

// Check payment status manually (optional)
paymentController.checkPaymentStatus = async (req, res) => {
  try {
    const invoiceRef = req.query.ref;

    const { data } = await axios.get(
      `https://sandbox.paypro.com.pk/api/invoice/${invoiceRef}`,
      {
        headers: { Authorization: `Bearer ${PAYPRO_API_KEY}` },
      }
    );

    res.json({ status: data.status });
  } catch (err) {
    console.error("Check Status Error:", err.message);
    res.status(500).json({ message: "Unable to fetch payment status" });
  }
};

// Handle Webhook from PayPro
paymentController.handleWebhook = async (req, res) => {
  try {
    const { invoice_ref, status, email } = req.body;

    if (status === "Paid") {
      const user = await User.findOne({ email });

      if (user) {
        const now = new Date();
        const expiry = new Date();
        expiry.setDate(now.getDate() + 30); // 30-day subscription

        user.isSubscribed = true;
        user.subscriptionStart = now;
        user.subscriptionEnd = expiry;
        user.paymentReference = invoice_ref;

        await user.save();
      }
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook Error:", err.message);
    res.status(500).send("Webhook error");
  }
};

module.exports = paymentController;
