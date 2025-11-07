const { Router } = require('express');
const userRouter = require('./users');

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

router.use('/users', userRouter);

module.exports = router;

