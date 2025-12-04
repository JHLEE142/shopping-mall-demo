const { Router } = require('express');
const authenticate = require('../middleware/authMiddleware');
const {
  getLookbookSettings,
  upsertLookbookSettings,
  listLookbookCampaigns,
  createLookbookCampaign,
  updateLookbookCampaign,
  deleteLookbookCampaign,
  listEditorials,
  createEditorial,
  updateEditorial,
  deleteEditorial,
  listStyleNotes,
  getStyleNoteById,
  createStyleNote,
  updateStyleNote,
  deleteStyleNote,
} = require('../controllers/lookbookController');

const router = Router();

router.use(authenticate);

router
  .route('/settings')
  .get(getLookbookSettings)
  .put(upsertLookbookSettings);

router
  .route('/campaigns')
  .get(listLookbookCampaigns)
  .post(createLookbookCampaign);

router
  .route('/campaigns/:id')
  .put(updateLookbookCampaign)
  .delete(deleteLookbookCampaign);

router
  .route('/editorials')
  .get(listEditorials)
  .post(createEditorial);

router
  .route('/editorials/:id')
  .put(updateEditorial)
  .delete(deleteEditorial);

router
  .route('/style-notes')
  .get(listStyleNotes)
  .post(createStyleNote);

router
  .route('/style-notes/:id')
  .get(getStyleNoteById)
  .put(updateStyleNote)
  .delete(deleteStyleNote);

module.exports = router;



