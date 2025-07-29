/**
 * Plaid Debug Routes - Helper endpoints for troubleshooting Plaid integration
 */
import { Router } from 'express';

const router = Router();

router.get('/debug/credentials', (req, res) => {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  
  res.json({
    hasClientId: !!clientId,
    hasSecret: !!secret,
    clientIdLength: clientId?.length || 0,
    secretLength: secret?.length || 0,
    clientIdPrefix: clientId?.substring(0, 8) + '...',
    environment: clientId?.startsWith('5') || clientId?.startsWith('6') ? 'sandbox' : 'unknown',
    timestamp: new Date().toISOString()
  });
});

export default router;