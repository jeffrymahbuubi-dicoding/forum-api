import { vi } from 'vitest';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import LikeRepository from '../../../Domains/likes/LikeRepository.js';
import ToggleCommentLikeUseCase from '../ToggleCommentLikeUseCase.js';

describe('ToggleCommentLikeUseCase', () => {
  const useCasePayload = {
    threadId: 'thread-123',
    commentId: 'comment-123',
    owner: 'user-123',
  };

  it('should add a like when the comment is not liked yet', async () => {
    // Arrange
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockLikeRepository = new LikeRepository();

    mockThreadRepository.verifyThreadExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockLikeRepository.isCommentLiked = vi.fn()
      .mockImplementation(() => Promise.resolve(false));
    mockLikeRepository.addLike = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockLikeRepository.deleteLike = vi.fn()
      .mockImplementation(() => Promise.resolve());

    const toggleCommentLikeUseCase = new ToggleCommentLikeUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      likeRepository: mockLikeRepository,
    });

    // Action
    await toggleCommentLikeUseCase.execute(useCasePayload);

    // Assert
    expect(mockThreadRepository.verifyThreadExists)
      .toBeCalledWith('thread-123');
    expect(mockCommentRepository.verifyCommentExists)
      .toBeCalledWith('comment-123', 'thread-123');
    expect(mockLikeRepository.isCommentLiked)
      .toBeCalledWith('comment-123', 'user-123');
    expect(mockLikeRepository.addLike)
      .toBeCalledWith('comment-123', 'user-123');
    expect(mockLikeRepository.deleteLike).not.toBeCalled();
  });

  it('should delete the like when the comment is already liked', async () => {
    // Arrange
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockLikeRepository = new LikeRepository();

    mockThreadRepository.verifyThreadExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockLikeRepository.isCommentLiked = vi.fn()
      .mockImplementation(() => Promise.resolve(true));
    mockLikeRepository.addLike = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockLikeRepository.deleteLike = vi.fn()
      .mockImplementation(() => Promise.resolve());

    const toggleCommentLikeUseCase = new ToggleCommentLikeUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      likeRepository: mockLikeRepository,
    });

    // Action
    await toggleCommentLikeUseCase.execute(useCasePayload);

    // Assert
    expect(mockThreadRepository.verifyThreadExists)
      .toBeCalledWith('thread-123');
    expect(mockCommentRepository.verifyCommentExists)
      .toBeCalledWith('comment-123', 'thread-123');
    expect(mockLikeRepository.isCommentLiked)
      .toBeCalledWith('comment-123', 'user-123');
    expect(mockLikeRepository.addLike).not.toBeCalled();
    expect(mockLikeRepository.deleteLike)
      .toBeCalledWith('comment-123', 'user-123');
  });

  it('should stop before the comment check when the thread is not found', async () => {
    // Arrange
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockLikeRepository = new LikeRepository();

    mockThreadRepository.verifyThreadExists = vi.fn()
      .mockImplementation(() => Promise.reject(new NotFoundError('thread tidak ditemukan')));
    mockCommentRepository.verifyCommentExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockLikeRepository.isCommentLiked = vi.fn()
      .mockImplementation(() => Promise.resolve(false));
    mockLikeRepository.addLike = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockLikeRepository.deleteLike = vi.fn()
      .mockImplementation(() => Promise.resolve());

    const toggleCommentLikeUseCase = new ToggleCommentLikeUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      likeRepository: mockLikeRepository,
    });

    // Action
    await expect(toggleCommentLikeUseCase.execute(useCasePayload)).rejects.toThrowError(NotFoundError);

    // Assert
    expect(mockThreadRepository.verifyThreadExists)
      .toBeCalledWith('thread-123');
    expect(mockCommentRepository.verifyCommentExists).not.toBeCalled();
    expect(mockLikeRepository.isCommentLiked).not.toBeCalled();
    expect(mockLikeRepository.addLike).not.toBeCalled();
    expect(mockLikeRepository.deleteLike).not.toBeCalled();
  });

  it('should stop before the like check when the comment is not found', async () => {
    // Arrange
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockLikeRepository = new LikeRepository();

    mockThreadRepository.verifyThreadExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentExists = vi.fn()
      .mockImplementation(() => Promise.reject(new NotFoundError('komentar tidak ditemukan')));
    mockLikeRepository.isCommentLiked = vi.fn()
      .mockImplementation(() => Promise.resolve(false));
    mockLikeRepository.addLike = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockLikeRepository.deleteLike = vi.fn()
      .mockImplementation(() => Promise.resolve());

    const toggleCommentLikeUseCase = new ToggleCommentLikeUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      likeRepository: mockLikeRepository,
    });

    // Action
    await expect(toggleCommentLikeUseCase.execute(useCasePayload)).rejects.toThrowError(NotFoundError);

    // Assert
    expect(mockThreadRepository.verifyThreadExists)
      .toBeCalledWith('thread-123');
    expect(mockCommentRepository.verifyCommentExists)
      .toBeCalledWith('comment-123', 'thread-123');
    expect(mockLikeRepository.isCommentLiked).not.toBeCalled();
    expect(mockLikeRepository.addLike).not.toBeCalled();
    expect(mockLikeRepository.deleteLike).not.toBeCalled();
  });
});
