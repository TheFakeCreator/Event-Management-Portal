import { Router, type IRouter } from 'express';
import { getDevUserInfo } from '../middlewares/devBypass.js';
import { DEV_BYPASS_CONFIG } from '../configs/devBypass.js';

const router: IRouter = Router();

// Development bypass info endpoint
router.get('/bypass-info', getDevUserInfo);

// Development user test endpoint
router.get('/test-auth', (req, res) => {
  if (!DEV_BYPASS_CONFIG.enabled) {
    return res.status(404).json({
      success: false,
      message: 'Not found',
    });
  }

  res.json({
    success: true,
    message: 'Development authentication test',
    data: {
      isAuthenticated: req.isUserAuthenticated || false,
      user: req.userInfo
        ? {
            id: req.userInfo._id,
            name: req.userInfo.name,
            email: req.userInfo.email,
            role: req.userInfo.role,
          }
        : null,
      devBypass: req.devBypassInfo || null,
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
