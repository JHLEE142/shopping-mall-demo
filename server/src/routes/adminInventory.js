const { Router } = require('express');
const authenticate = require('../middleware/authMiddleware');
const { listInventory, updateInventory } = require('../controllers/inventoryController');

const router = Router();

router.use(authenticate);

router.get('/', listInventory);
router.put('/:id', updateInventory);

module.exports = router;














