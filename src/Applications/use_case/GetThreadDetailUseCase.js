import ThreadDetail from '../../Domains/threads/entities/ThreadDetail.js';
import CommentDetail from '../../Domains/comments/entities/CommentDetail.js';
import ReplyDetail from '../../Domains/replies/entities/ReplyDetail.js';

class GetThreadDetailUseCase {
  constructor({
    threadRepository, commentRepository, replyRepository, likeRepository,
  }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
    this._likeRepository = likeRepository;
  }

  async execute({ threadId }) {
    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);
    const replies = await this._replyRepository.getRepliesByThreadId(threadId);
    const likeCounts = await this._likeRepository.getLikeCountsByThreadId(threadId);
    const likeCountByComment = new Map(likeCounts.map(({ commentId, likeCount }) => [commentId, likeCount]));

    const commentDetails = comments.map((comment) => new CommentDetail({
      ...comment,
      likeCount: likeCountByComment.get(comment.id) ?? 0,
      replies: replies
        .filter((reply) => reply.commentId === comment.id)
        .map((reply) => new ReplyDetail(reply)),
    }));

    return new ThreadDetail({ ...thread, comments: commentDetails });
  }
}

export default GetThreadDetailUseCase;
