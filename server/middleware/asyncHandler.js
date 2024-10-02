const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next))
    .then(() => {
      if (!res.headersSent) {
        next();
      }
    })
    .catch((error) => {
      if (!res.headersSent) {
        res.status(500).json({ message: error.message });
      } else {
        console.error("Error after headers were sent:", error);
        next(error);
      }
    });
};

export default asyncHandler; 
