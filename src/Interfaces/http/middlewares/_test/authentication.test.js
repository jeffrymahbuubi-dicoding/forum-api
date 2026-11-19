import express from 'express';
import request from 'supertest';
import AuthenticationError from '../../../../Commons/exceptions/AuthenticationError.js';
import AuthenticationTokenManager from '../../../../Applications/security/AuthenticationTokenManager.js';
import ClientError from '../../../../Commons/exceptions/ClientError.js';
import authentication from '../authentication.js';

const createTestApp = (container) => {
  const app = express();

  app.get('/protected', authentication(container), (req, res) => {
    res.status(200).json({ status: 'success', credentials: req.auth.credentials });
  });

  app.use((error, req, res, next) => {
    if (error instanceof ClientError) {
      return res.status(error.statusCode).json({ status: 'fail', message: error.message });
    }
    return res.status(500).json({ status: 'error', message: 'terjadi kegagalan pada server kami' });
  });

  return app;
};

describe('authentication middleware', () => {
  const createMocks = () => {
    const mockTokenManager = new AuthenticationTokenManager();
    mockTokenManager.verifyAccessToken = vi.fn().mockImplementation(() => Promise.resolve());
    mockTokenManager.decodePayload = vi.fn()
      .mockImplementation(() => Promise.resolve({ id: 'user-123', username: 'dicoding' }));

    const mockContainer = {
      getInstance: vi.fn().mockImplementation(() => mockTokenManager),
    };

    return { mockTokenManager, mockContainer };
  };

  it('should respond 401 when authorization header is missing', async () => {
    // Arrange
    const { mockTokenManager, mockContainer } = createMocks();
    const app = createTestApp(mockContainer);

    // Action
    const response = await request(app).get('/protected');

    // Assert
    expect(response.status).toEqual(401);
    expect(response.body.status).toEqual('fail');
    expect(response.body.message).toEqual('Missing authentication');
    expect(mockContainer.getInstance).not.toBeCalled();
    expect(mockTokenManager.verifyAccessToken).not.toBeCalled();
    expect(mockTokenManager.decodePayload).not.toBeCalled();
  });

  it('should respond 401 when authorization scheme is not Bearer', async () => {
    // Arrange
    const { mockTokenManager, mockContainer } = createMocks();
    const app = createTestApp(mockContainer);

    // Action
    const response = await request(app).get('/protected').set('Authorization', 'Basic abc');

    // Assert
    expect(response.status).toEqual(401);
    expect(response.body.message).toEqual('Missing authentication');
    expect(mockContainer.getInstance).not.toBeCalled();
    expect(mockTokenManager.verifyAccessToken).not.toBeCalled();
    expect(mockTokenManager.decodePayload).not.toBeCalled();
  });

  it('should respond 401 when Bearer scheme has no token', async () => {
    // Arrange
    const { mockTokenManager, mockContainer } = createMocks();
    const app = createTestApp(mockContainer);

    // Action
    const response = await request(app).get('/protected').set('Authorization', 'Bearer');

    // Assert
    expect(response.status).toEqual(401);
    expect(response.body.message).toEqual('Missing authentication');
    expect(mockContainer.getInstance).not.toBeCalled();
    expect(mockTokenManager.verifyAccessToken).not.toBeCalled();
    expect(mockTokenManager.decodePayload).not.toBeCalled();
  });

  it('should respond 401 when the token is invalid', async () => {
    // Arrange
    const { mockTokenManager, mockContainer } = createMocks();
    mockTokenManager.verifyAccessToken = vi.fn()
      .mockImplementation(() => Promise.reject(new AuthenticationError('access token tidak valid')));
    const app = createTestApp(mockContainer);

    // Action
    const response = await request(app).get('/protected').set('Authorization', 'Bearer salah');

    // Assert
    expect(response.status).toEqual(401);
    expect(response.body.message).toEqual('access token tidak valid');
    expect(mockContainer.getInstance).toBeCalledWith(AuthenticationTokenManager.name);
    expect(mockTokenManager.verifyAccessToken).toBeCalledWith('salah');
    expect(mockTokenManager.decodePayload).not.toBeCalled();
  });

  it('should set req.auth.credentials and continue when the token is valid', async () => {
    // Arrange
    const { mockTokenManager, mockContainer } = createMocks();
    const app = createTestApp(mockContainer);

    // Action
    const response = await request(app).get('/protected').set('Authorization', 'Bearer benar');

    // Assert
    expect(response.status).toEqual(200);
    expect(response.body.credentials).toEqual({ id: 'user-123', username: 'dicoding' });
    expect(mockContainer.getInstance).toBeCalledWith(AuthenticationTokenManager.name);
    expect(mockTokenManager.verifyAccessToken).toBeCalledWith('benar');
    expect(mockTokenManager.decodePayload).toBeCalledWith('benar');
  });
});
