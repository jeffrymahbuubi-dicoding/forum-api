import AuthenticationError from '../../../Commons/exceptions/AuthenticationError.js';
import AuthenticationTokenManager from '../../../Applications/security/AuthenticationTokenManager.js';

const authentication = (container) => async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new AuthenticationError('Missing authentication');
    }

    const authenticationTokenManager = container.getInstance(AuthenticationTokenManager.name);
    await authenticationTokenManager.verifyAccessToken(token);
    const { id, username } = await authenticationTokenManager.decodePayload(token);

    req.auth = { credentials: { id, username } };
    next();
  } catch (error) {
    next(error);
  }
};

export default authentication;
