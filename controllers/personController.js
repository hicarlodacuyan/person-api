import User from "../models/User.js";
import Person from "../models/Person.js";
import isString from "../utils/isString.js";
import getTokenFrom from "../utils/getTokenFrom.js";
import jwt from "jsonwebtoken";
import config from "../utils/config.js";
import storage from "../utils/firebaseConfig.js";
import { ref, uploadBytes, deleteObject } from "firebase/storage";
import generateUniqueImageFileName from "../utils/generateUniqueImageFileName.js";

async function getPersons(req, res) {
  const decodedToken = jwt.verify(getTokenFrom(req), config.SECRET);
  const persons = await Person.find({ user: decodedToken.id });

  return res.json(persons);
}

async function getPerson(req, res, next) {
  try {
    const { id } = req.params;
    const person = await Person.findById(id);

    if (person) return res.json(person);

    return res.status(404).json({ error: "Person not found" });
  } catch (error) {
    next(error);
  }
}

async function createPerson(req, res, next) {
  try {
    const { name, number } = req.body;
    const decodedToken = jwt.verify(getTokenFrom(req), config.SECRET);

    if (!decodedToken.id) {
      return res.status(401).json({ error: "Token missing or invalid" });
    }

    const user = await User.findById(decodedToken.id);
    const storageRef = ref(storage, generateUniqueImageFileName(req.file));
    const metadata = {
      contentType: "image/jpeg",
    };
    const snapshot = await uploadBytes(storageRef, req.file.buffer, metadata);
    const photoUrl = `https://firebasestorage.googleapis.com/v0/b/${
      snapshot.ref.bucket
    }/o/${encodeURIComponent(snapshot.ref.fullPath)}?alt=media`;

    const person = new Person({
      name,
      number,
      user: user._id,
      photoInfo: {
        url: photoUrl,
        filename: snapshot.ref.fullPath,
      },
    });

    const savedPerson = await person.save();

    user.persons.push(savedPerson._id);
    await user.save();

    return res.status(201).json(savedPerson);
  } catch (error) {
    next(error);
  }
}

async function updatePerson(req, res, next) {
  const id = req.params.id;
  const { name, number } = req.body;

  if (name === undefined || number === undefined)
    return res.status(400).json({ error: "Content is missing" });

  if (name === "" || number === "")
    return res.status(400).json({ error: "Name and number are required" });

  if (!isString(name) || !isString(number))
    return res.status(400).json({ error: "Name and number must be strings" });

  const person = {
    name,
    number,
  };

  try {
    const updatedPerson = await Person.findByIdAndUpdate(id, person, {
      new: true,
      runValidators: true,
      context: "query",
    });

    if (updatedPerson) return res.json(updatedPerson);

    return res.status(404).json({ error: "Person not found" });
  } catch (error) {
    next(error);
  }
}

async function deletePerson(req, res, next) {
  try {
    const { id } = req.params;
    const decodedToken = jwt.verify(getTokenFrom(req), config.SECRET);

    if (!decodedToken.id) {
      return res.status(401).json({ error: "Token missing or invalid" });
    }

    const user = await User.findById(decodedToken.id);
    const person = await Person.findByIdAndDelete(id);
    const photoRef = ref(storage, person.photoInfo.filename);

    await deleteObject(photoRef);
    user.persons = user.persons.filter(
      (personId) => personId.toString() !== person._id.toString()
    );
    await user.save();

    return res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export default {
  getPersons,
  getPerson,
  createPerson,
  updatePerson,
  deletePerson,
};
