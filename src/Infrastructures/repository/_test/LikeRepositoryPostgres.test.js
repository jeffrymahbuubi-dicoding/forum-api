import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import CommentLikesTableTestHelper from '../../../../tests/CommentLikesTableTestHelper.js';
import pool from '../../database/postgres/pool.js';
import LikeRepositoryPostgres from '../LikeRepositoryPostgres.js';

describe('LikeRepositoryPostgres', () => {
  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe' });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
    await CommentsTableTestHelper.addComment({
      id: 'comment-123', threadId: 'thread-123', owner: 'user-123',
    });
  });

  afterEach(async () => {
    await CommentLikesTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('isCommentLiked function', () => {
    it('should return false when the user has not liked the comment', async () => {
      // Arrange
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      // Action
      const isLiked = await likeRepositoryPostgres.isCommentLiked('comment-123', 'user-123');

      // Assert
      expect(isLiked).toEqual(false);
    });

    it('should return true when the user has liked the comment', async () => {
      // Arrange
      await CommentLikesTableTestHelper.addLike({ commentId: 'comment-123', owner: 'user-123' });
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      // Action
      const isLiked = await likeRepositoryPostgres.isCommentLiked('comment-123', 'user-123');

      // Assert
      expect(isLiked).toEqual(true);
    });

    it('should return false when only another user has liked the comment', async () => {
      // Arrange
      await CommentLikesTableTestHelper.addLike({ commentId: 'comment-123', owner: 'user-456' });
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      // Action
      const isLiked = await likeRepositoryPostgres.isCommentLiked('comment-123', 'user-123');

      // Assert
      expect(isLiked).toEqual(false);
    });
  });

  describe('addLike function', () => {
    it('should persist one like with the generated id', async () => {
      // Arrange
      const fakeIdGenerator = () => '123'; // stub!
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await likeRepositoryPostgres.addLike('comment-123', 'user-456');

      // Assert
      const likes = await CommentLikesTableTestHelper.findLike('comment-123', 'user-456');
      expect(likes).toHaveLength(1);
      expect(likes[0].id).toEqual('like-123');
      expect(likes[0].comment_id).toEqual('comment-123');
      expect(likes[0].owner).toEqual('user-456');
    });
  });

  describe('deleteLike function', () => {
    it('should remove only the like of that user', async () => {
      // Arrange
      await CommentLikesTableTestHelper.addLike({
        id: 'like-1', commentId: 'comment-123', owner: 'user-123',
      });
      await CommentLikesTableTestHelper.addLike({
        id: 'like-2', commentId: 'comment-123', owner: 'user-456',
      });
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      // Action
      await likeRepositoryPostgres.deleteLike('comment-123', 'user-123');

      // Assert
      const removed = await CommentLikesTableTestHelper.findLike('comment-123', 'user-123');
      const kept = await CommentLikesTableTestHelper.findLike('comment-123', 'user-456');
      expect(removed).toHaveLength(0);
      expect(kept).toHaveLength(1);
      expect(kept[0].id).toEqual('like-2');
    });
  });

  describe('getLikeCountsByThreadId function', () => {
    it('should return an empty array when no comment of the thread has a like', async () => {
      // Arrange
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      // Action
      const counts = await likeRepositoryPostgres.getLikeCountsByThreadId('thread-123');

      // Assert
      expect(counts).toEqual([]);
    });

    it('should return the number of likes per liked comment of the thread only', async () => {
      // Arrange
      await CommentsTableTestHelper.addComment({
        id: 'comment-456', threadId: 'thread-123', owner: 'user-456',
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-789', threadId: 'thread-123', owner: 'user-456',
      });
      await ThreadsTableTestHelper.addThread({ id: 'thread-456', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-other', threadId: 'thread-456', owner: 'user-123',
      });
      await CommentLikesTableTestHelper.addLike({
        id: 'like-1', commentId: 'comment-123', owner: 'user-123',
      });
      await CommentLikesTableTestHelper.addLike({
        id: 'like-2', commentId: 'comment-123', owner: 'user-456',
      });
      await CommentLikesTableTestHelper.addLike({
        id: 'like-3', commentId: 'comment-456', owner: 'user-123',
      });
      await CommentLikesTableTestHelper.addLike({
        id: 'like-4', commentId: 'comment-other', owner: 'user-123',
      });
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      // Action
      const counts = await likeRepositoryPostgres.getLikeCountsByThreadId('thread-123');

      // Assert
      expect(counts).toStrictEqual([
        { commentId: 'comment-123', likeCount: 2 },
        { commentId: 'comment-456', likeCount: 1 },
      ]);
      expect(typeof counts[0].likeCount).toEqual('number');
    });
  });
});
