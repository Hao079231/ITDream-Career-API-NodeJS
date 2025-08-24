const jwt = require('jsonwebtoken');
const { verifyAccessToken } = require('./jwtAuth');
require('dotenv').config();

// ✅ authenticate: decode dữ liệu từ token
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Chỉ kiểm tra hợp lệ
  const valid = verifyAccessToken(token);
  if (!valid) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  // Giải mã payload và gắn vào req.user
  try {
    const decoded = jwt.decode(token); // Không verify nữa vì verify đã check ở trên
    req.user = decoded; // { id, username, kind, pCodes }
    next();
  } catch (err) {
    return res.status(400).json({ message: 'Failed to decode token' });
  }
}

// ✅ authorize theo pCode
// function authorizePCode(requiredPcode) {
//   return (req, res, next) => {
//     const perms = req.user?.pCodes || [];
//     if (perms.includes(requiredPcode)) {
//       return next();
//     }
//     return res.status(403).json({ message: `Permission ${requiredPcode} required` });
//   };
// }

module.exports = { authenticate };
