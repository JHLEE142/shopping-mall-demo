const { Schema, model } = require('mongoose');

const styleNoteMediaSchema = new Schema(
  {
    kind: {
      type: String,
      enum: ['image', 'video', 'quote', 'list'],
      default: 'image',
    },
    src: { type: String, required: true, trim: true },
    caption: { type: String, default: '', trim: true },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const styleNoteSectionSchema = new Schema(
  {
    layout: {
      type: String,
      enum: ['split', 'full', 'gallery', 'grid', 'text'],
      default: 'full',
    },
    heading: { type: String, required: true, trim: true },
    subheading: { type: String, default: '', trim: true },
    body: { type: String, default: '' },
    highlights: { type: [String], default: [] },
    media: { type: [styleNoteMediaSchema], default: [] },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const styleNoteSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    theme: {
      palette: { type: [String], default: [] },
      typography: { type: String, default: '', trim: true },
      background: { type: String, default: '', trim: true },
    },
    hero: {
      headline: { type: String, required: true, trim: true },
      kicker: { type: String, default: '', trim: true },
      description: { type: String, default: '' },
      imageUrl: { type: String, default: '', trim: true },
      badge: { type: String, default: '', trim: true },
    },
    summary: { type: String, default: '' },
    sections: { type: [styleNoteSectionSchema], default: [] },
    gallery: {
      title: { type: String, default: '', trim: true },
      items: {
        type: [
          {
            imageUrl: { type: String, required: true, trim: true },
            caption: { type: String, default: '', trim: true },
            order: { type: Number, default: 0 },
          },
        ],
        default: [],
      },
    },
    relatedCampaigns: [{ type: Schema.Types.ObjectId, ref: 'LookbookCampaign' }],
    seo: {
      title: { type: String, default: '', trim: true },
      description: { type: String, default: '' },
      keywords: { type: [String], default: [] },
      ogImage: { type: String, default: '', trim: true },
    },
    isPublished: { type: Boolean, default: true },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const lookbookSettingsSchema = new Schema(
  {
    hero: {
      badgeLabel: { type: String, default: '', trim: true },
      title: { type: String, required: true, trim: true },
      description: { type: String, default: '' },
      cta: {
        label: { type: String, default: '', trim: true },
        url: { type: String, default: '', trim: true },
        target: { type: String, enum: ['_self', '_blank'], default: '_blank' },
      },
      backgroundImage: { type: String, default: '', trim: true },
    },
    accessories: {
      title: { type: String, default: '', trim: true },
      description: { type: String, default: '' },
      imageUrl: { type: String, default: '', trim: true },
      highlights: { type: [String], default: [] },
    },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const lookbookCampaignSchema = new Schema(
  {
    season: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '', trim: true },
    description: { type: String, default: '' },
    heroImage: { type: String, required: true, trim: true },
    videoUrl: { type: String, default: '', trim: true },
    order: { type: Number, default: 0, index: true },
    isFeatured: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
    styleNote: { type: Schema.Types.ObjectId, ref: 'StyleNote' },
    metadata: {
      ctaLabel: { type: String, default: '스타일 노트 보기', trim: true },
      ctaVariant: { type: String, enum: ['primary', 'secondary'], default: 'primary' },
    },
    publishedAt: { type: Date, default: null },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

lookbookCampaignSchema.index({ season: 1, title: 1 }, { unique: true });

const lookbookEditorialSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, default: '' },
    imageUrl: { type: String, required: true, trim: true },
    readMoreUrl: { type: String, default: '', trim: true },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = {
  LookbookSettings: model('LookbookSettings', lookbookSettingsSchema),
  LookbookCampaign: model('LookbookCampaign', lookbookCampaignSchema),
  LookbookEditorial: model('LookbookEditorial', lookbookEditorialSchema),
  StyleNote: model('StyleNote', styleNoteSchema),
};



