const router = require('express').Router();
const userCtrl = require('../controllers/userCtrl');
const auth = require('../middleware/auth');

const rateLimit = require('express-rate-limit');
const routesLimit = rateLimit({
	windowMs: 300000,
	max: 2000,
});

router.post('/login', routesLimit, userCtrl.login);
router.post('/refresh_token', routesLimit, userCtrl.getAccessToken);
router.get('/getrequests', routesLimit, auth, userCtrl.getRequestsData);
router.get(
	'/getyearlycustomers',
	routesLimit,
	auth,
	userCtrl.getYearlyCustomers
);
router.post('/updatepassword', routesLimit, auth, userCtrl.updatePassword);
router.post('/blacklist', routesLimit, auth, userCtrl.addBlacklistData);
router.post('/subuser', routesLimit, auth, userCtrl.addSubuserData);
router.post('/getClientNames', routesLimit, auth, userCtrl.getClientNames);
router.get('/subuserData', routesLimit, auth, userCtrl.getSubuserData);
router.get('/blacklistData', routesLimit, auth, userCtrl.getBlacklistData);
router.patch('/addLicenseData', routesLimit, auth, userCtrl.addLicenseData);
router.patch(
	'/deleteSubuserData',
	routesLimit,
	auth,
	userCtrl.deleteSubuserData
);
router.patch(
	'/deleteLicenseData',
	routesLimit,
	auth,
	userCtrl.deleteLicenseData
);
router.patch(
	'/deleteBlacklistData',
	routesLimit,
	auth,
	userCtrl.deleteBlacklistData
);
router.get('/licenseData', routesLimit, auth, userCtrl.getLicenseData);
router.get('/latestrequests', routesLimit, auth, userCtrl.getLatestRequests);
router.get('/infor', routesLimit, auth, userCtrl.getUserInfor);
router.get('/logout', routesLimit, userCtrl.logout);
router.patch('/update', routesLimit, auth, userCtrl.updateUser);
router.patch('/updateLicense', routesLimit, auth, userCtrl.updateLicenseData);
router.patch('/updateSubuser', routesLimit, auth, userCtrl.updateSubuser);

module.exports = router;
