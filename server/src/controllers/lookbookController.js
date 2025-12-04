const {
  LookbookSettings,
  LookbookCampaign,
  LookbookEditorial,
  StyleNote,
} = require('../models/lookbook');

// -------- Lookbook Settings --------
async function getLookbookSettings(req, res, next) {
  try {
    const settings =
      (await LookbookSettings.findOne().sort({ updatedAt: -1 }).lean()) ||
      (await LookbookSettings.create({
        hero: {
          title: 'Movement, Reimagined',
          description: '',
        },
      }));

    res.json(settings);
  } catch (error) {
    next(error);
  }
}

async function upsertLookbookSettings(req, res, next) {
  try {
    const payload = req.body || {};
    const settings = await LookbookSettings.findOneAndUpdate({}, payload, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    });

    res.json(settings);
  } catch (error) {
    next(error);
  }
}

// -------- Lookbook Campaigns --------
async function listLookbookCampaigns(req, res, next) {
  try {
    const { published } = req.query;
    const filter = {};

    if (published !== undefined) {
      filter.isPublished = published === 'true';
    }

    const campaigns = await LookbookCampaign.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .populate('styleNote', 'title slug')
      .lean();

    res.json(campaigns);
  } catch (error) {
    next(error);
  }
}

async function createLookbookCampaign(req, res, next) {
  try {
    const campaign = await LookbookCampaign.create(req.body);
    const populated = await campaign.populate('styleNote', 'title slug');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
}

async function updateLookbookCampaign(req, res, next) {
  try {
    const updated = await LookbookCampaign.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('styleNote', 'title slug');

    if (!updated) {
      return res.status(404).json({ message: '캠페인을 찾을 수 없습니다.' });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function deleteLookbookCampaign(req, res, next) {
  try {
    const deleted = await LookbookCampaign.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: '캠페인을 찾을 수 없습니다.' });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

// -------- Editorial Stories --------
async function listEditorials(req, res, next) {
  try {
    const { published } = req.query;
    const filter = {};

    if (published !== undefined) {
      filter.isPublished = published === 'true';
    }

    const editorials = await LookbookEditorial.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .lean();
    res.json(editorials);
  } catch (error) {
    next(error);
  }
}

async function createEditorial(req, res, next) {
  try {
    const editorial = await LookbookEditorial.create(req.body);
    res.status(201).json(editorial);
  } catch (error) {
    next(error);
  }
}

async function updateEditorial(req, res, next) {
  try {
    const updated = await LookbookEditorial.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: '에디토리얼을 찾을 수 없습니다.' });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function deleteEditorial(req, res, next) {
  try {
    const deleted = await LookbookEditorial.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: '에디토리얼을 찾을 수 없습니다.' });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

// -------- Style Notes --------
async function listStyleNotes(req, res, next) {
  try {
    const { published } = req.query;
    const filter = {};

    if (published !== undefined) {
      filter.isPublished = published === 'true';
    }

    if (req.query.slug) {
      filter.slug = req.query.slug;
    }

    const notes = await StyleNote.find(filter)
      .sort({ createdAt: -1 })
      .populate('relatedCampaigns', 'title season')
      .lean();

    res.json(notes);
  } catch (error) {
    next(error);
  }
}

async function getStyleNoteById(req, res, next) {
  try {
    const note = await StyleNote.findById(req.params.id)
      .populate('relatedCampaigns', 'title season')
      .lean();

    if (!note) {
      return res.status(404).json({ message: '스타일 노트를 찾을 수 없습니다.' });
    }

    res.json(note);
  } catch (error) {
    next(error);
  }
}

async function createStyleNote(req, res, next) {
  try {
    const payload = { ...req.body };
    if (payload.slug) {
      payload.slug = payload.slug.trim().toLowerCase();
    }

    const note = await StyleNote.create(payload);
    const populated = await note.populate('relatedCampaigns', 'title season');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
}

async function updateStyleNote(req, res, next) {
  try {
    const payload = { ...req.body };
    if (payload.slug) {
      payload.slug = payload.slug.trim().toLowerCase();
    }

    const updated = await StyleNote.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    }).populate('relatedCampaigns', 'title season');

    if (!updated) {
      return res.status(404).json({ message: '스타일 노트를 찾을 수 없습니다.' });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function deleteStyleNote(req, res, next) {
  try {
    const deleted = await StyleNote.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: '스타일 노트를 찾을 수 없습니다.' });
    }

    await LookbookCampaign.updateMany(
      { styleNote: deleted._id },
      { $unset: { styleNote: '' } }
    );

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = {
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
};



