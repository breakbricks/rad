const router = require("express").Router();
const idgController = require("../../controllers/idgController");

router.route("/").get(idgController.findAll).post(idgController.create);

// new post route
// post to /api/idg/getroutes along with user_id(email)
// instead of .get /api/idg/user_id (@ in the email a;fjdjljdfskla), do post
// see API.js - getAllRoutes: axios.post("/api/idg/getroutes/", data);
// see idgController.js - findRoutes
// get routes in database by user_id (email) - where user_id = req.body.user_id
router.route("/getroutes").post(idgController.findRoutes);

router
  .route("/:user_id/:id")
  .get(idgController.findById)
  // .put(idgController.update)
  .delete(idgController.remove);

module.exports = router;
