import Event from "../models/event.js";

export const createEvent = async (req, res) => {

  const event = await Event.create(req.body);

  res.json(event);

};

export const getEvents = async (req, res) => {

  const events = await Event.find();

  res.json(events);

};

export const deleteEvent = async (req, res) => {

  await Event.findByIdAndDelete(req.params.id);

  res.json({ message: "Event deleted" });

};