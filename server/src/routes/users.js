const { Router } = require('express');
const dotenv = require('dotenv');
const authenticate = require('../middleware/authMiddleware');
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

router.get('/:id', authenticate, getUserById);

router.put('/:id', authenticate, updateUser);

router.delete('/:id', authenticate, deleteUser);

module.exports = router;

