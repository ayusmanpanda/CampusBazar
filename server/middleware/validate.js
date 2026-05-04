const { validationResult } = require('express-validator');

function runValidators(validators) {
  return async (req, res, next) => {
    for (const v of validators) await v.run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    next();
  };
}

module.exports = { runValidators };
