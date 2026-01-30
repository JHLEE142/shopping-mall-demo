const { Router } = require('express');
const dotenv = require('dotenv');
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
  googleLogin,
} = require('../controllers/userController');

const router = Router();

router.post('/', createUser);

router.post('/login', loginUser);

router.post('/google-login', googleLogin);

router.get('/', getUsers);

router.get('/:id', getUserById);

router.put('/:id', updateUser);

router.delete('/:id', deleteUser);

module.exports = router;

