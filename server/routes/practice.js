const express = require('express');
const { body, validationResult } = require('express-validator');
const requireAuth = require('../middleware/requireAuth');
const { getPuzzle } = require('../services/bananaService');

const router = express.Router();

router.get('/puzzle', requireAuth, async (req, res) => {
  try {
    const puzzle = await getPuzzle();
    req.session.practiceSolution = puzzle.solution; // stays on the server
    res.json({ image: puzzle.image });               // browser gets the image only
  } catch (err) {
    res.status(502).json({ error: 'Puzzle service busy. Please press Retry.' });
  }
});

router.post('/answer', requireAuth, body('answer').isInt({ min: 0, max: 9 }), (req, res) => {
  if (!validationResult(req).isEmpty()) {
    return res.status(400).json({ error: 'Answer must be a digit from 0 to 9' });
  }
  if (req.session.practiceSolution === undefined) {
    return res.status(400).json({ error: 'Get a puzzle first' });
  }
  const correct = Number(req.body.answer) === req.session.practiceSolution;
  res.json({ correct });
});

module.exports = router;