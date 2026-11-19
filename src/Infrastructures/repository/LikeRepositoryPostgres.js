import LikeRepository from '../../Domains/likes/LikeRepository.js';

class LikeRepositoryPostgres extends LikeRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async isCommentLiked(commentId, owner) {
    const query = {
      text: 'SELECT id FROM user_comment_likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, owner],
    };

    const result = await this._pool.query(query);

    return result.rowCount > 0;
  }

  async addLike(commentId, owner) {
    const id = `like-${this._idGenerator()}`;

    const query = {
      text: 'INSERT INTO user_comment_likes (id, comment_id, owner) VALUES($1, $2, $3)',
      values: [id, commentId, owner],
    };

    await this._pool.query(query);
  }

  async deleteLike(commentId, owner) {
    const query = {
      text: 'DELETE FROM user_comment_likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, owner],
    };

    await this._pool.query(query);
  }

  async getLikeCountsByThreadId(threadId) {
    const query = {
      text: `SELECT user_comment_likes.comment_id AS "commentId",
        COUNT(user_comment_likes.id)::int AS "likeCount"
        FROM user_comment_likes
        INNER JOIN comments ON comments.id = user_comment_likes.comment_id
        WHERE comments.thread_id = $1
        GROUP BY user_comment_likes.comment_id
        ORDER BY user_comment_likes.comment_id ASC`,
      values: [threadId],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }
}

export default LikeRepositoryPostgres;
