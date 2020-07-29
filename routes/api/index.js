const router = require("express").Router();
const idgRoutes = require("./idg");

// idg routes
router.use("/idg", idgRoutes);

module.exports = router;
