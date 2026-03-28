const Order = require("../models/order");

// CREATE ORDER
exports.createOrder = async (req, res) => {
  try {

    const { userName, email, artName, price, image } = req.body;

    const order = new Order({
      userName,
      email,
      artName,
      price,
      image
    });

    await order.save();

    res.json({ message: "Order saved" });

  } catch (err) {
    res.status(500).json({ message: "Error saving order" });
  }
};


// GET ALL ORDERS (ADMIN)
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders" });
  }
};