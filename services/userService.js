import User from "../models/User.js";
import jwt from "jsonwebtoken";
import getTokenFrom from "../utils/getTokenFrom.js";

function verifyToken(req, secretKey) {
  const token = jwt.verify(getTokenFrom(req), secretKey);

  if (!token.id) {
    throw new Error("Token missing or invalid");
  }

  return token;
}

async function getUser(id) {
  return await User.findById(id);
}

async function savePerson(personId, user) {
  user.persons.push(personId);
  await user.save();
}

export default {
  getUser,
  savePerson,
  verifyToken,
};
