const db = require("../models");

//THENABLE
// find all routes saved by user with user_id: ______
// then find route with _id: ________
/*
       Customer.find({ name: 'A' }).
     then(customers => {              
       console.log(customers[0].name); // 'A'
       return Customer.find({ name: 'B' });
     }).
     then(customers => {
       console.log(customers[0].name); // 'B'
     }); */

// Defining methods for the idgController
module.exports = {
  findAll: function (req, res) {
    db.IDGRoute.find(req.query)
      .sort({ date: -1 })
      .then((dbModel) => res.json(dbModel))
      .catch((err) => res.status(422).json(err));
  },
  //get routes in database by user_id (email) - where user_id = req.body.user_id
  findRoutes: function (req, res) {
    db.IDGRoute.find({
      user_id: req.body.user_id,
    }) //sort by date
      .sort({ date: -1 })
      .then((dbModel) => res.json(dbModel))
      .catch((err) => res.status(422).json(err));
  },
  findById: function (req, res) {
    db.IDGRoute.findById(req.params.id)
      .then((dbModel) => res.json(dbModel))
      .catch((err) => res.status(422).json(err));
  },
  create: function (req, res) {
    db.IDGRoute.create(req.body)
      .then((dbModel) => res.json(dbModel))
      .catch((err) => res.status(422).json(err));
  },
  /*update: function (req, res) {
        db.IDGRoute
            .findOneAndUpdate({ _id: req.params.id }, req.body)
            .then(dbModel => res.json(dbModel))
            .catch(err => res.status(422).json(err));
    },*/
  remove: function (req, res) {
    db.IDGRoute.findById({ _id: req.params.id })
      .then((dbModel) => dbModel.remove())
      .then((dbModel) => res.json(dbModel))
      .catch((err) => res.status(422).json(err));
  },
};
