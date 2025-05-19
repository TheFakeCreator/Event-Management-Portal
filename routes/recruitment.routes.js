import express from 'express';
import { isAuthenticatedLineant } from '../middlewares/authMiddleware.js';
const router = express.Router();


// GET /recruitments - List all recruitments
router.get('/',isAuthenticatedLineant, (req, res) => {
    const user = req.user;
    console.log(user);
  // TODO: Render recruitments page or return recruitments data
  res.render('recruitment',{

        title: "recruitment",
        user,
        isAuthenticated: req.isAuthenticated,
      });
});

// GET /recruitment/new - Show form to create a new recruitment
router.get('/new', isAuthenticatedLineant, (req, res) => {
  const user = req.user;
  const clubId = req.query.club;
  res.render('createRecruitment', {
    title: 'Create Recruitment',
    user,
    isAuthenticated: req.isAuthenticated,
    clubId
  });
});

// POST /recruitment/new - Handle form submission to create a new recruitment
router.post('/new', isAuthenticatedLineant, async (req, res) => {
  const user = req.user;
  const { title, description, deadline, clubId } = req.body;
  try {
    // Import Recruitment model here to avoid circular dependencies
    const Recruitment = (await import('../models/recruitment.model.js')).default;
    await Recruitment.create({
      title,
      description,
      deadline,
      club: clubId,
      isActive: true
    });
    res.redirect(`/club/${clubId}`);
  } catch (err) {
    console.error(err);
    res.status(500).render('createRecruitment', {
      title: 'Create Recruitment',
      user,
      isAuthenticated: req.isAuthenticated,
      clubId,
      error: 'Failed to create recruitment. Please try again.'
    });
  }
});

// Add more recruitment routes here as needed

export default router;
