/* istanbul ignore file */
import container from '../src/Infrastructures/container.js';
import AuthenticationTokenManager from '../src/Applications/security/AuthenticationTokenManager.js';
import UsersTableTestHelper from './UsersTableTestHelper.js';

const ServerTestHelper = {
  async getAccessToken({ id = 'user-123', username = 'dicoding' } = {}) {
    await UsersTableTestHelper.addUser({ id, username });

    const authenticationTokenManager = container.getInstance(AuthenticationTokenManager.name);
    return authenticationTokenManager.createAccessToken({ username, id });
  },
};

export default ServerTestHelper;
