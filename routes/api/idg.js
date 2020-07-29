const router = require("express").Router();
const idgController = require("../../controllers/idgController");

// Matches with "/api/idg/:user_id"
router.route("/:user_id")
    .get(idgController.findAll)
    .post(idgController.create);

// Matches with "/api/idg/:user_id/:id"
router
    .route("/:user_id/:id")
    .get(idgController.findById)
    // .put(idgController.update)
    .delete(idgController.remove);

module.exports = router;