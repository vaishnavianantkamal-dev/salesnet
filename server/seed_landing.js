require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./src/config/env');
const LandingPage = require('./src/models/LandingPage.model');

async function seedLandingPage() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('MongoDB connected');

    const landingData = {
      isDisabled: false,
      header: {
        brandLogo: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Meta-Logo.png', // Just a placeholder logo
        menuItems: [
          { title: 'Home', path: '/', status: true },
          { title: 'Features', path: '#features', status: true },
          { title: 'Pricing', path: '#pricing', status: true },
          { title: 'Contact', path: '#contact', status: true }
        ]
      },
      hero: {
        badgeText: 'New Release 2026',
        sectionTitle: 'Supercharge Your Sales Team',
        description: 'The all-in-one CRM solution designed to automate workflows, capture leads instantly, and close deals at lightning speed.',
        mainImage: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2850&auto=format&fit=crop',
        primaryButton: { label: 'Get Started for Free', targetUrl: '/register' },
        floatingImages: [
          { mediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=200&auto=format&fit=crop', screenPosition: 'Left' },
          { mediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=200&auto=format&fit=crop', screenPosition: 'Right' }
        ]
      },
      branding: {
        trustedLabelText: 'TRUSTED BY INNOVATIVE TEAMS WORLDWIDE',
        brandLogos: [
          'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
          'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg',
          'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg',
          'https://upload.wikimedia.org/wikipedia/commons/b/b9/Slack_Technologies_Logo.svg',
          'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg'
        ]
      },
      features: {
        sectionBadge: 'Features',
        headline: 'Everything you need in one place',
        descriptionText: 'SalesNets provides a comprehensive suite of modern tools to manage your leads, contacts, and deals effortlessly.',
        ctaButton: { label: 'View All Features', targetUrl: '#features' },
        highlights: [
          { title: 'Intelligent Lead Management', description: 'Track every lead from capture to close with AI-powered scoring and automated assignments.', mediaUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop' },
          { title: 'Stunning Landing Pages', description: 'Create beautiful, high-converting landing pages in minutes using our drag-and-drop builder.', mediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop' },
          { title: 'Advanced Analytics', description: 'Get deep insights into your sales pipeline, team performance, and revenue growth.', mediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop' }
        ]
      },
      platform: {
        sectionBadge: 'How it Works',
        mainHeadline: 'Seamless Workflow Integration',
        nodes: [
          { stepTitle: '1. Connect Your Data', briefNarrative: 'Easily import leads from multiple sources in seconds.', order: 1, keyFeatures: ['1-click imports', 'Real-time sync', 'Duplicate detection'] },
          { stepTitle: '2. Automate Outreach', briefNarrative: 'Set up intelligent email and WhatsApp sequences.', order: 2, keyFeatures: ['Visual builder', 'A/B testing', 'Smart scheduling'] },
          { stepTitle: '3. Close Deals Faster', briefNarrative: 'Collaborate with your team and track pipeline stages.', order: 3, keyFeatures: ['Kanban view', 'Team chat', 'E-signatures'] }
        ]
      },
      pricing: {
        sectionBadge: 'Pricing',
        sectionTitle: 'Simple, transparent pricing',
        briefDescription: 'Choose the plan that fits your needs.',
        selectedPlans: [
          { name: 'Starter', price: '$29', period: '/month', features: ['Up to 5 Users', 'Basic CRM', '1,000 Contacts', 'Email Support'], isPopular: false },
          { name: 'Professional', price: '$99', period: '/month', features: ['Up to 20 Users', 'Advanced Automations', 'Unlimited Contacts', 'Priority Support', 'Custom Domains'], isPopular: true },
          { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited Users', 'Dedicated Success Manager', 'SSO & Advanced Security', 'Custom Integrations'], isPopular: false }
        ]
      },
      testimonials: {
        sectionBadge: 'Testimonials',
        headline: 'Loved by sales teams',
        selectedTestimonials: [
          { name: 'Sarah Jenkins', role: 'VP of Sales, TechFlow', content: 'SalesNets completely transformed our pipeline management. Our team is closing 30% more deals.', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop' },
          { name: 'David Chen', role: 'Founder, GrowthWorks', content: 'The easiest CRM we have ever used. The automated outreach sequences save us hours every single day.', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop' },
          { name: 'Elena Rodriguez', role: 'Marketing Director, Nova', content: 'The landing page builder combined with the CRM is a game-changer. Everything is in one place.', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop' }
        ]
      },
      faq: {
        sectionBadge: 'FAQ',
        mainHeadline: 'Got questions? We have answers.',
        contextualDescription: 'Find answers to common questions about SalesNets and how it can help your business.',
        questions: [
          { question: 'How quickly can I get set up?', answer: 'Most teams are up and running within 24 hours. Our intuitive interface requires minimal training.' },
          { question: 'Do you offer custom integrations?', answer: 'Yes! We have an open API and offer custom integration services for enterprise plans.' },
          { question: 'Is my data secure?', answer: 'Absolutely. We use bank-level encryption and are fully GDPR compliant to ensure your data is safe.' }
        ]
      },
      contact: {
        sectionTitle: 'Ready to transform your sales?',
        supportTagline: 'We are here to help',
        narrative: 'Join thousands of fast-growing companies that use SalesNets to close more deals.',
        businessPhone: '+1 (800) 123-4567',
        corporateEmail: 'hello@salesnets.com',
        interactiveForm: true
      },
      footer: {
        preFooterCtaTitle: 'Boost your sales today.',
        ctaSupportingDescription: 'Start your free 14-day trial. No credit card required.',
        globalActionButtons: [
          { label: 'Start Free Trial', targetUrl: '/register' }
        ],
        socialLinks: [
          { platform: 'Twitter', url: 'https://twitter.com' },
          { platform: 'LinkedIn', url: 'https://linkedin.com' },
          { platform: 'GitHub', url: 'https://github.com' }
        ],
        copyrightDisclaimer: '© 2026 SalesNets Inc. All rights reserved.'
      }
    };

    let landing = await LandingPage.findOne();
    if (landing) {
      await LandingPage.findByIdAndUpdate(landing._id, landingData, { new: true });
      console.log('Landing page updated.');
    } else {
      await LandingPage.create(landingData);
      console.log('Landing page created.');
    }

  } catch (error) {
    console.error('Error seeding landing page:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

seedLandingPage();
