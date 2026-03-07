const { validateCreateBidPayload } = require("../validators/bids.validator");
const { createBid } = require("../services/bids.service");

const createBidController = async (req, res) => {
  const orderId = req.params.orderId;
  const payload = validateCreateBidPayload(req.body);
  const contractorId = req.user.id;

  const bid = await createBid(
    {
      orderId,
      ...payload
    },
    contractorId
  );

  return res.status(201).json({
    success: true,
    data: bid
  });
};

module.exports = { createBidController };
