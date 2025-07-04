const express = require("express");
const router = express.Router();


router.get("/home", (req,res)=>{
      let error = req.flash("error")
  let success = req.flash("success")
    res.render("home",
        {
            error: error > 0 ? error[0] : null,
            success: success > 0 ? success[0] : null,
        }
    )
})

module.exports = router;