export const createEvent = (req, res) => {
  const {
    title,
    description,
    type,
    date,
    time,
    location,
    image,
    club,
    collaborators,
  } = req.body;
  res.send(req.body);
};
