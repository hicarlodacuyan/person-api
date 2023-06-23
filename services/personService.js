import Person from "../models/Person.js";

async function createPerson(person) {
  return await Person.create(person);
}

export default {
  createPerson,
};
