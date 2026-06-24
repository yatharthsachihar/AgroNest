const express = require('express');
const Page = require('../models/Page');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Default page data seeded when page doesn't exist yet
const PAGE_SEEDS = {
  about: {
    title: 'About Us',
    slug: 'about',
    status: 'published',
    sections: [
      {
        type: 'hero', order: 0, visible: true,
        data: {
          heading: 'Growing a Greener India, Together',
          subheading: 'Axiom Seeds was born from a simple belief — every farmer deserves access to the best seeds, tools, and knowledge without leaving their village.',
          badge: 'Est. 2020',
          image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&q=80',
        },
      },
      {
        type: 'stats', order: 1, visible: true,
        data: {
          items: [
            { value: '50,000+', label: 'Farmers Served' },
            { value: '2,000+',  label: 'Products Listed' },
            { value: '28',      label: 'States Covered' },
            { value: '4.9★',    label: 'Average Rating' },
          ],
        },
      },
      {
        type: 'values', order: 2, visible: true,
        data: {
          heading: 'What We Stand For',
          items: [
            { icon: '🌱', title: 'Certified Quality',   desc: 'Every product is tested and certified by government-approved agricultural boards before it reaches you.' },
            { icon: '🤝', title: 'Farmer First',        desc: 'We price fairly, advise honestly, and put farmer welfare above profit at every decision.' },
            { icon: '🌍', title: 'Sustainability',       desc: 'We actively promote organic farming and eco-friendly practices across our entire catalog.' },
            { icon: '📦', title: 'Reliable Delivery',   desc: 'Pan-India logistics network ensures your order reaches even the most remote farm within 72 hours.' },
          ],
        },
      },
      {
        type: 'team', order: 3, visible: true,
        data: {
          heading: 'Meet Our Team',
          members: [
            { name: 'Arjun Sharma',   role: 'Founder & CEO',        avatar: '', bio: 'Agronomist with 15 years in field crop research.' },
            { name: 'Priya Meena',    role: 'Head of Operations',   avatar: '', bio: 'Supply chain expert ensuring timely delivery across India.' },
            { name: 'Ravi Patel',     role: 'Chief Agri Advisor',   avatar: '', bio: 'Former ICAR scientist with expertise in soil health.' },
            { name: 'Sunita Verma',   role: 'Customer Success Lead', avatar: '', bio: 'Dedicated to ensuring every farmer gets the right solution.' },
          ],
        },
      },
      {
        type: 'cta', order: 4, visible: true,
        data: {
          heading: 'Ready to grow smarter?',
          subheading: 'Join 50,000+ farmers who trust Axiom Seeds for their every season.',
          btnText: 'Shop Now',
          btnLink: '/products',
          btn2Text: 'Contact Us',
          btn2Link: '/contact',
        },
      },
    ],
  },
  contact: {
    title: 'Contact Us',
    slug: 'contact',
    status: 'published',
    sections: [
      {
        type: 'hero', order: 0, visible: true,
        data: {
          heading: "We're Here to Help",
          subheading: 'Our agri experts are available 7 days a week. Reach out via phone, email, or visit our office.',
          badge: 'Support 7 days a week',
        },
      },
      {
        type: 'contact_info', order: 1, visible: true,
        data: {
          cards: [
            { icon: '📞', title: 'Call Us',       value: '+91 7340008599', note: 'Mon–Sun 8am–8pm' },
            { icon: '📧', title: 'Email Us',      value: 'axiomcropsciences@gmail.com', note: 'Reply within 24 hours' },
            { icon: '📍', title: 'Visit Us',      value: 'B-235 Sobo Centre Gym Khana Road Bhopal Ahmedabad (Gujrat)382210', note: 'Mon–Sat 9am–6pm' },
            { icon: '💬', title: 'WhatsApp',      value: '+91 7340008599', note: 'Quick queries & order tracking' },
          ],
        },
      },
      {
        type: 'faq', order: 2, visible: true,
        data: {
          heading: 'Frequently Asked Questions',
          items: [
            { q: 'How long does delivery take?',         a: 'We deliver across India in 24–72 hours depending on your pincode.' },
            { q: 'Do you offer bulk/B2B pricing?',       a: 'Yes! Switch to Wholesale mode or contact our B2B team for custom pricing.' },
            { q: 'Are your products certified organic?', a: 'All organic products carry certification from NPOP or relevant boards.' },
            { q: 'What is your return policy?',          a: '7-day hassle-free returns on all products. No questions asked.' },
          ],
        },
      },
    ],
  },
  categories: {
    title: 'Categories',
    slug: 'categories',
    status: 'published',
    sections: [
      {
        type: 'hero', order: 0, visible: true,
        data: {
          heading: 'Shop by Category',
          subheading: 'Everything your farm needs, delivered directly to your doorstep. Browse our certified range of seeds, fertilizers, pesticides, tools and more.',
          badge: 'Browse Catalogue',
        },
      },
      {
        type: 'cta', order: 1, visible: true,
        data: {
          heading: 'Looking for Bulk Orders?',
          subheading: 'Custom pricing, credit options, and dedicated support for cooperatives, distributors, and agri-businesses.',
          btnText: 'Request Quote',
          btnLink: '/contact?type=bulk',
          btn2Text: 'Browse All Products',
          btn2Link: '/products',
        },
      },
    ],
  },
};

// GET all pages
router.get('/', async (req, res) => {
  try { res.json(await Page.find().sort({ createdAt: -1 })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

// GET one page by slug — auto-seeds if not found
router.get('/:slug', async (req, res) => {
  try {
    let page = await Page.findOne({ slug: req.params.slug });
    if (!page && PAGE_SEEDS[req.params.slug]) {
      page = await Page.create(PAGE_SEEDS[req.params.slug]);
    }
    if (!page) return res.status(404).json({ message: 'Page not found' });
    res.json(page);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// CREATE page (admin)
router.post('/', protect, async (req, res) => {
  try { res.status(201).json(await Page.create(req.body)); }
  catch (err) { res.status(400).json({ message: err.message }); }
});

// UPDATE page (admin)
router.put('/:id', protect, async (req, res) => {
  try { res.json(await Page.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE page (admin)
router.delete('/:id', protect, async (req, res) => {
  try { await Page.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
