const LandingPage = require('../../models/LandingPage.model');
const { AppError } = require('../../middlewares/error.middleware');

/**
 * @desc    Get landing page configuration (Public)
 * @route   GET /api/landing
 * @access  Public
 */
exports.getLandingConfig = async (req, res, next) => {
  try {
    let config = await LandingPage.findOne();
    
    // If no config exists, return default empty structure
    if (!config) {
      config = {
        isDisabled: false,
        header: { menuItems: [] },
        hero: { floatingImages: [] },
        branding: { brandLogos: [] },
        features: { highlights: [] },
        platform: { nodes: [] },
        pricing: { selectedPlans: [] },
        testimonials: { selectedTestimonials: [] },
        faq: { questions: [] },
        footer: { globalActionButtons: [], socialLinks: [] }
      };
    }

    res.status(200).json({
      success: true,
      data: config
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update landing page configuration
 * @route   PUT /api/landing
 * @access  Private (Admin)
 */
exports.updateLandingConfig = async (req, res, next) => {
  try {
    let config = await LandingPage.findOne();
    
    if (config) {
      // Update existing
      config = await LandingPage.findByIdAndUpdate(config._id, req.body, {
        new: true,
        runValidators: true
      });
    } else {
      // Create new
      config = await LandingPage.create(req.body);
    }

    res.status(200).json({
      success: true,
      data: config
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Upload media for landing page
 * @route   POST /api/landing/upload
 * @access  Private (Admin)
 */
exports.uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      // If AppError isn't exported as AppError from error.middleware it might throw an error. 
      // Let's just use res.status(400)
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    // Construct URL path based on local setup (in production, this would be S3 URL)
    const fileUrl = `/uploads/landing/${req.file.filename}`;

    res.status(200).json({
      success: true,
      url: fileUrl
    });
  } catch (err) {
    next(err);
  }
};
