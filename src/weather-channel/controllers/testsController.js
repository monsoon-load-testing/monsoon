const HttpError = require("../models/httpError");
const { validationResult } = require("express-validator");

// const getBoards = (req, res, next) => {
//   Board.find({}, "title _id createdAt updatedAt").then((boards) => {
//     res.json({
//       boards,
//     });
//   });
// };

// const getBoard = (req, res, next) => {
//   Board.findById(req.params.id)
//     .populate({
//       path: "lists",
//       populate: { path: "cards", populate: { path: "comments" } },
//     })
//     .then((board) => {
//       res.json({ board });
//     })
//     .catch((err) => {
//       next(new HttpError("Board doesn't exist, please try again", 404));
//     });
// };

module.exports = {
  // getBoards
};
