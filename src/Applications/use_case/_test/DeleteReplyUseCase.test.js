import { vi } from 'vitest';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import AuthorizationError from '../../../Commons/exceptions/AuthorizationError.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ReplyRepository from '../../../Domains/replies/ReplyRepository.js';
import DeleteReplyUseCase from '../DeleteReplyUseCase.js';

describe('DeleteReplyUseCase', () => {
  const useCasePayload = {
    threadId: 'thread-123',
    commentId: 'comment-123',
    replyId: 'reply-123',
    owner: 'user-123',
  };

  it('should orchestrating the delete reply action correctly', async () => {
    // Arrange
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.verifyThreadExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockReplyRepository.verifyReplyExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockReplyRepository.verifyReplyOwner = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockReplyRepository.deleteReplyById = vi.fn()
      .mockImplementation(() => Promise.resolve());

    const deleteReplyUseCase = new DeleteReplyUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action
    await deleteReplyUseCase.execute(useCasePayload);

    // Assert
    expect(mockThreadRepository.verifyThreadExists)
      .toHaveBeenCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.verifyCommentExists)
      .toHaveBeenCalledWith(useCasePayload.commentId, useCasePayload.threadId);
    expect(mockReplyRepository.verifyReplyExists)
      .toHaveBeenCalledWith(useCasePayload.replyId, useCasePayload.commentId);
    expect(mockReplyRepository.verifyReplyOwner)
      .toHaveBeenCalledWith(useCasePayload.replyId, useCasePayload.owner);
    expect(mockReplyRepository.deleteReplyById)
      .toHaveBeenCalledWith(useCasePayload.replyId);
  });

  it('should stop before the comment check when the thread is not found', async () => {
    // Arrange
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.verifyThreadExists = vi.fn()
      .mockImplementation(() => Promise.reject(new NotFoundError('thread tidak ditemukan')));
    mockCommentRepository.verifyCommentExists = vi.fn();
    mockReplyRepository.verifyReplyExists = vi.fn();
    mockReplyRepository.verifyReplyOwner = vi.fn();
    mockReplyRepository.deleteReplyById = vi.fn();

    const deleteReplyUseCase = new DeleteReplyUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action and Assert
    await expect(deleteReplyUseCase.execute(useCasePayload)).rejects.toThrowError(NotFoundError);
    expect(mockThreadRepository.verifyThreadExists)
      .toHaveBeenCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.verifyCommentExists).not.toHaveBeenCalled();
    expect(mockReplyRepository.verifyReplyExists).not.toHaveBeenCalled();
    expect(mockReplyRepository.verifyReplyOwner).not.toHaveBeenCalled();
    expect(mockReplyRepository.deleteReplyById).not.toHaveBeenCalled();
  });

  it('should stop before the reply check when the comment is not found', async () => {
    // Arrange
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.verifyThreadExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentExists = vi.fn()
      .mockImplementation(() => Promise.reject(new NotFoundError('komentar tidak ditemukan')));
    mockReplyRepository.verifyReplyExists = vi.fn();
    mockReplyRepository.verifyReplyOwner = vi.fn();
    mockReplyRepository.deleteReplyById = vi.fn();

    const deleteReplyUseCase = new DeleteReplyUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action and Assert
    await expect(deleteReplyUseCase.execute(useCasePayload)).rejects.toThrowError(NotFoundError);
    expect(mockThreadRepository.verifyThreadExists)
      .toHaveBeenCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.verifyCommentExists)
      .toHaveBeenCalledWith(useCasePayload.commentId, useCasePayload.threadId);
    expect(mockReplyRepository.verifyReplyExists).not.toHaveBeenCalled();
    expect(mockReplyRepository.verifyReplyOwner).not.toHaveBeenCalled();
    expect(mockReplyRepository.deleteReplyById).not.toHaveBeenCalled();
  });

  it('should stop before the owner check when the reply is not found', async () => {
    // Arrange
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.verifyThreadExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockReplyRepository.verifyReplyExists = vi.fn()
      .mockImplementation(() => Promise.reject(new NotFoundError('balasan tidak ditemukan')));
    mockReplyRepository.verifyReplyOwner = vi.fn();
    mockReplyRepository.deleteReplyById = vi.fn();

    const deleteReplyUseCase = new DeleteReplyUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action and Assert
    await expect(deleteReplyUseCase.execute(useCasePayload)).rejects.toThrowError(NotFoundError);
    expect(mockThreadRepository.verifyThreadExists)
      .toHaveBeenCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.verifyCommentExists)
      .toHaveBeenCalledWith(useCasePayload.commentId, useCasePayload.threadId);
    expect(mockReplyRepository.verifyReplyExists)
      .toHaveBeenCalledWith(useCasePayload.replyId, useCasePayload.commentId);
    expect(mockReplyRepository.verifyReplyOwner).not.toHaveBeenCalled();
    expect(mockReplyRepository.deleteReplyById).not.toHaveBeenCalled();
  });

  it('should not delete the reply when the user is not the owner', async () => {
    // Arrange
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.verifyThreadExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockReplyRepository.verifyReplyExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockReplyRepository.verifyReplyOwner = vi.fn()
      .mockImplementation(() => Promise.reject(new AuthorizationError('anda tidak berhak mengakses resource ini')));
    mockReplyRepository.deleteReplyById = vi.fn();

    const deleteReplyUseCase = new DeleteReplyUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action and Assert
    await expect(deleteReplyUseCase.execute(useCasePayload)).rejects.toThrowError(AuthorizationError);
    expect(mockThreadRepository.verifyThreadExists)
      .toHaveBeenCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.verifyCommentExists)
      .toHaveBeenCalledWith(useCasePayload.commentId, useCasePayload.threadId);
    expect(mockReplyRepository.verifyReplyExists)
      .toHaveBeenCalledWith(useCasePayload.replyId, useCasePayload.commentId);
    expect(mockReplyRepository.verifyReplyOwner)
      .toHaveBeenCalledWith(useCasePayload.replyId, useCasePayload.owner);
    expect(mockReplyRepository.deleteReplyById).not.toHaveBeenCalled();
  });
});
