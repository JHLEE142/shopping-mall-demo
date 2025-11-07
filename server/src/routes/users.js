const { Router } = require('express');
const dotenv = require('dotenv');
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
} = require('../controllers/userController');

const router = Router();

router.post('/', createUser);

router.post('/login', loginUser);

router.get('/', getUsers);

router.get('/:id', getUserById);

router.put('/:id', updateUser);

router.delete('/:id', deleteUser);

module.exports = router;

