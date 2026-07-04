const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  title: String,
  linkType: { type: String, enum: ['link', 'dropdown'], default: 'link' },
  path: String,
  description: String,
  icon: String,
  badgeText: String,
  badgeColor: String,
  targetBlank: { type: Boolean, default: false },
  status: { type: Boolean, default: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', default: null }
});

const buttonSchema = new mongoose.Schema({
  label: String,
  targetUrl: String
});

const floatingImageSchema = new mongoose.Schema({
  mediaUrl: String,
  screenPosition: { type: String, enum: ['Left', 'Right', 'Center'], default: 'Left' }
});

const featureHighlightSchema = new mongoose.Schema({
  title: String,
  description: String,
  mediaUrl: String
});

const platformNodeSchema = new mongoose.Schema({
  stepTitle: String,
  briefNarrative: String,
  smallTag: String,
  mediaUrl: String,
  order: Number,
  keyFeatures: [String]
});

const faqSchema = new mongoose.Schema({
  question: String,
  answer: String
});

const socialLinkSchema = new mongoose.Schema({
  platform: String,
  url: String
});

const landingPageSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: false
  },
  isDisabled: { type: Boolean, default: false },
  
  header: {
    brandLogo: String,
    menuItems: [menuItemSchema]
  },
  
  hero: {
    badgeText: String,
    sectionTitle: String,
    description: String,
    mainImage: String,
    primaryButton: buttonSchema,
    floatingImages: [floatingImageSchema]
  },
  
  branding: {
    trustedLabelText: String,
    brandLogos: [String]
  },
  
  features: {
    sectionBadge: String,
    headline: String,
    descriptionText: String,
    ctaButton: buttonSchema,
    highlights: [featureHighlightSchema]
  },
  
  platform: {
    sectionBadge: String,
    mainHeadline: String,
    nodes: [platformNodeSchema]
  },
  
  pricing: {
    sectionBadge: String,
    sectionTitle: String,
    briefDescription: String,
    selectedPlans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
  },
  
  testimonials: {
    sectionBadge: String,
    headline: String,
    selectedTestimonials: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Testimonial' }]
  },
  
  faq: {
    sectionBadge: String,
    mainHeadline: String,
    contextualDescription: String,
    questions: [faqSchema]
  },
  
  contact: {
    sectionTitle: String,
    supportTagline: String,
    narrative: String,
    businessPhone: String,
    corporateEmail: String,
    interactiveForm: { type: Boolean, default: true }
  },
  
  footer: {
    preFooterCtaTitle: String,
    ctaSupportingDescription: String,
    globalActionButtons: [buttonSchema],
    socialLinks: [socialLinkSchema],
    copyrightDisclaimer: String
  }
}, { timestamps: true });

module.exports = mongoose.model('LandingPage', landingPageSchema);
