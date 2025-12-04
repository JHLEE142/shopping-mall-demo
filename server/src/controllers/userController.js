const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  delete userObj.__v;

  return userObj;
}

function createAuthToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing JWT_SECRET environment variable');
  }

  return jwt.sign({ sub: userId }, secret, { expiresIn: '60m' });
}

async function createUser(req, res, next) {
  try {
    const { password, confirmPassword, ...rest } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const normalizedEmail = rest.email ? rest.email.trim().toLowerCase() : '';
    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      ...rest,
      email: normalizedEmail,
      password: hashedPassword,
    });

    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
}

async function getUsers(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;
    const userType = req.query.user_type; // 'customer' or 'admin' 필터링

    const filter = {};
    if (userType) {
      filter.user_type = userType;
    }

    const [items, totalItems] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

    res.json({
      page,
      limit,
      totalItems,
      totalPages,
      items: items.map(sanitizeUser),
    });
  } catch (error) {
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const updatePayload = { ...req.body };

    if (Object.prototype.hasOwnProperty.call(updatePayload, 'password')) {
      if (!updatePayload.password) {
        delete updatePayload.password;
      } else {
        updatePayload.password = await bcrypt.hash(updatePayload.password, 10);
      }
    }

    if (Object.prototype.hasOwnProperty.call(updatePayload, 'email') && updatePayload.email) {
      updatePayload.email = updatePayload.email.trim().toLowerCase();
    }

    delete updatePayload.confirmPassword;

    const user = await User.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = createAuthToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (error.message === 'Missing JWT_SECRET environment variable') {
      error.status = 500;
    }
    next(error);
  }
}

function getCurrentUser(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  res.json({ user: sanitizeUser(req.user) });
}

function logoutUser(req, res) {
  res.status(200).json({ message: '로그아웃되었습니다.' });
}

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
  getCurrentUser,
  logoutUser,
};

