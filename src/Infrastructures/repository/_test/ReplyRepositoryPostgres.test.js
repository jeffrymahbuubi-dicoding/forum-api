import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import RepliesTableTestHelper from '../../../../tests/RepliesTableTestHelper.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import AuthorizationError from '../../../Commons/exceptions/AuthorizationError.js';
import NewReply from '../../../Domains/replies/entities/NewReply.js';
import AddedReply from '../../../Domains/replies/entities/AddedReply.js';
import pool from '../../database/postgres/pool.js';
import ReplyRepositoryPostgres from '../ReplyRepositoryPostgres.js';

describe('ReplyRepositoryPostgres', () => {
  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe' });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
    await CommentsTableTestHelper.addComment({
      id: 'comment-123', threadId: 'thread-123', owner: 'user-123',
    });
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addReply function', () => {
    it('should persist new reply with owner, ISO date and is_delete false', async () => {
      // Arrange
      const newReply = new NewReply({
        content: 'sebuah balasan',
        commentId: 'comment-123',
        owner: 'user-456',
      });
      const fakeIdGenerator = () => '123'; // stub!
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await replyRepositoryPostgres.addReply(newReply);

      // Assert
      const replies = await RepliesTableTestHelper.findRepliesById('reply-123');
      expect(replies).toHaveLength(1);
      expect(replies[0].comment_id).toEqual('comment-123');
      expect(replies[0].owner).toEqual('user-456');
      expect(replies[0].content).toEqual('sebuah balasan');
      expect(replies[0].is_delete).toEqual(false);
      expect(new Date(replies[0].date).toISOString()).toEqual(replies[0].date);
    });

    it('should return added reply correctly', async () => {
      // Arrange
      const newReply = new NewReply({
        content: 'sebuah balasan',
        commentId: 'comment-123',
        owner: 'user-456',
      });
      const fakeIdGenerator = () => '123'; // stub!
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedReply = await replyRepositoryPostgres.addReply(newReply);

      // Assert
      expect(addedReply).toStrictEqual(new AddedReply({
        id: 'reply-123',
        content: 'sebuah balasan',
        owner: 'user-456',
      }));
    });
  });

  describe('verifyReplyExists function', () => {
    it('should throw NotFoundError when the reply is not found', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyExists('reply-123', 'comment-123'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should throw NotFoundError when the reply belongs to another comment', async () => {
      // Arrange
      await CommentsTableTestHelper.addComment({
        id: 'comment-456', threadId: 'thread-123', owner: 'user-123',
      });
      await RepliesTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-456' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyExists('reply-123', 'comment-123'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should not throw when the reply exists for the comment', async () => {
      // Arrange
      await RepliesTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyExists('reply-123', 'comment-123'))
        .resolves
        .not.toThrowError();
    });
  });

  describe('verifyReplyOwner function', () => {
    it('should throw AuthorizationError when the user is not the owner', async () => {
      // Arrange
      await RepliesTableTestHelper.addReply({ id: 'reply-123', owner: 'user-456' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', 'user-123'))
        .rejects
        .toThrowError(AuthorizationError);
    });

    it('should not throw when the user is the owner', async () => {
      // Arrange
      await RepliesTableTestHelper.addReply({ id: 'reply-123', owner: 'user-456' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', 'user-456'))
        .resolves
        .not.toThrowError();
    });
  });

  describe('deleteReplyById function', () => {
    it('should keep the row and set is_delete to true', async () => {
      // Arrange
      await RepliesTableTestHelper.addReply({ id: 'reply-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action
      await replyRepositoryPostgres.deleteReplyById('reply-123');

      // Assert
      const replies = await RepliesTableTestHelper.findRepliesById('reply-123');
      expect(replies).toHaveLength(1);
      expect(replies[0].is_delete).toEqual(true);
    });
  });

  describe('getRepliesByThreadId function', () => {
    it('should return an empty array when the thread has no replies', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByThreadId('thread-123');

      // Assert
      expect(replies).toEqual([]);
    });

    it('should return the replies of all comments of the thread in ascending date order', async () => {
      // Arrange
      await CommentsTableTestHelper.addComment({
        id: 'comment-456', threadId: 'thread-123', owner: 'user-456',
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-3',
        commentId: 'comment-456',
        owner: 'user-123',
        content: 'balasan ketiga',
        date: '2021-08-08T09:00:00.000Z',
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-1',
        commentId: 'comment-123',
        owner: 'user-456',
        content: 'balasan pertama',
        date: '2021-08-08T07:00:00.000Z',
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-2',
        commentId: 'comment-123',
        owner: 'user-123',
        content: 'balasan kedua',
        date: '2021-08-08T08:00:00.000Z',
        isDelete: true,
      });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByThreadId('thread-123');

      // Assert
      expect(replies).toStrictEqual([
        {
          id: 'reply-1',
          commentId: 'comment-123',
          username: 'johndoe',
          date: '2021-08-08T07:00:00.000Z',
          content: 'balasan pertama',
          isDelete: false,
        },
        {
          id: 'reply-2',
          commentId: 'comment-123',
          username: 'dicoding',
          date: '2021-08-08T08:00:00.000Z',
          content: 'balasan kedua',
          isDelete: true,
        },
        {
          id: 'reply-3',
          commentId: 'comment-456',
          username: 'dicoding',
          date: '2021-08-08T09:00:00.000Z',
          content: 'balasan ketiga',
          isDelete: false,
        },
      ]);
    });

    it('should not return replies of another thread', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-456', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-456', threadId: 'thread-456', owner: 'user-123',
      });
      await RepliesTableTestHelper.addReply({ id: 'reply-1', commentId: 'comment-123' });
      await RepliesTableTestHelper.addReply({ id: 'reply-2', commentId: 'comment-456' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByThreadId('thread-123');

      // Assert
      expect(replies).toHaveLength(1);
      expect(replies[0].id).toEqual('reply-1');
    });
  });
});
