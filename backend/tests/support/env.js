// Each test file gets its own database; the real .env (dotenv does not override what is set)
// and the real database are never used.
process.env.MONGO_URI = `${process.env.TEST_MONGO_URI}akart_${process.env.JEST_WORKER_ID}_${Date.now()}`;
process.env.PORT = "0";
process.env.JWT_SECRET = "test-admin-secret";
process.env.RAZORPAY_KEY_ID = "rzp_test_key";
process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret";
