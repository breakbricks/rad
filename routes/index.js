const router = require("express").Router();

router.route("/api/test").get((req, res) => {
    res.json({ bikes_success: true })
})

module.exports = router;