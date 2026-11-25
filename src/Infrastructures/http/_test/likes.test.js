import request from 'supertest';
import pool from '../../database/postgres/pool.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import ServerTestHelper from '../../../../tests/ServerTestHelper.js';
import container from '../../container.js';
import createServer from '../createServer.js';

describe('/threads/{threadId}/comments/{commentId}/likes endpoint', () => {
  const addThreadAndComment = async () => {
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
    await CommentsTableTestHelper.addComment({
      id: 'comment-123',
      threadId: 'thread-123',
      owner: 'user-123',
    });
  };

  const getLikeCount = async (app, threadId, commentId) => {
    const response = await request(app).get(`/threads/${threadId}`);
    const comment = response.body.data.thread.comments.find((item) => item.id === commentId);
    return comment.likeCount;
  };

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
  });

  describe('when PUT /threads/{threadId}/comments/{commentId}/likes', () => {
    it('should response 200 and show likeCount 1 after the comment is liked', async () => {
      // Arrange
      const accessToken = await ServerTestHelper.getAccessToken();
      await addThreadAndComment();
      const app = await createServer(container);

      // Action
      const response = await request(app)
        .put('/threads/thread-123/comments/comment-123/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(await getLikeCount(app, 'thread-123', 'comment-123')).toEqual(1);
    });

    it('should response 200 and show likeCount 0 when the same user sends the request twice', async () => {
      // Arrange
      const accessToken = await ServerTestHelper.getAccessToken();
      await addThreadAndComment();
      const app = await createServer(container);
      await request(app)
        .put('/threads/thread-123/comments/comment-123/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      // Action
      const response = await request(app)
        .put('/threads/thread-123/comments/comment-123/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(await getLikeCount(app, 'thread-123', 'comment-123')).toEqual(0);
    });

    it('should show likeCount 2 when two users like the same comment', async () => {
      // Arrange
      const firstToken = await ServerTestHelper.getAccessToken();
      const secondToken = await ServerTestHelper.getAccessToken({ id: 'user-456', username: 'johndoe' });
      await addThreadAndComment();
      const app = await createServer(container);

      // Action
      const firstResponse = await request(app)
        .put('/threads/thread-123/comments/comment-123/likes')
        .set('Authorization', `Bearer ${firstToken}`);
      const secondResponse = await request(app)
        .put('/threads/thread-123/comments/comment-123/likes')
        .set('Authorization', `Bearer ${secondToken}`);

      // Assert
      expect(firstResponse.status).toEqual(200);
      expect(secondResponse.status).toEqual(200);
      expect(await getLikeCount(app, 'thread-123', 'comment-123')).toEqual(2);
    });

    it('should response 401 when request has no authentication', async () => {
      // Arrange
      const app = await createServer(container);

      // Action
      const response = await request(app).put('/threads/thread-123/comments/comment-123/likes');

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.message).toEqual('Missing authentication');
    });

    it('should response 404 when thread is not found', async () => {
      // Arrange
      const accessToken = await ServerTestHelper.getAccessToken();
      const app = await createServer(container);

      // Action
      const response = await request(app)
        .put('/threads/thread-xxx/comments/comment-123/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 404 when comment is not found', async () => {
      // Arrange
      const accessToken = await ServerTestHelper.getAccessToken();
      await addThreadAndComment();
      const app = await createServer(container);

      // Action
      const response = await request(app)
        .put('/threads/thread-123/comments/comment-xxx/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 404 when the comment belongs to another thread', async () => {
      // Arrange
      const accessToken = await ServerTestHelper.getAccessToken();
      await addThreadAndComment();
      await ThreadsTableTestHelper.addThread({ id: 'thread-456', owner: 'user-123' });
      const app = await createServer(container);

      // Action
      const response = await request(app)
        .put('/threads/thread-456/comments/comment-123/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
    });
  });
});
