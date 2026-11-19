import NewComment from '../../../Domains/comments/entities/NewComment.js';
import AddedComment from '../../../Domains/comments/entities/AddedComment.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import AddCommentUseCase from '../AddCommentUseCase.js';

describe('AddCommentUseCase', () => {
  const useCasePayload = {
    content: 'sebuah comment',
    threadId: 'thread-123',
    owner: 'user-123',
  };

  it('should orchestrate the add comment action correctly', async () => {
    // Arrange
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    mockThreadRepository.verifyThreadExists = vi.fn().mockResolvedValue();
    mockCommentRepository.addComment = vi.fn().mockResolvedValue(new AddedComment({
      id: 'comment-abc',
      content: 'isi lain',
      owner: 'user-xyz',
    }));

    const addCommentUseCase = new AddCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action
    const addedComment = await addCommentUseCase.execute(useCasePayload);

    // Assert
    expect(addedComment).toStrictEqual(new AddedComment({
      id: 'comment-abc',
      content: 'isi lain',
      owner: 'user-xyz',
    }));
    expect(mockThreadRepository.verifyThreadExists).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.verifyThreadExists).toHaveBeenCalledWith('thread-123');
    expect(mockCommentRepository.addComment).toHaveBeenCalledTimes(1);
    expect(mockCommentRepository.addComment).toHaveBeenCalledWith(new NewComment(useCasePayload));
  });

  it('should not add the comment when the thread does not exist', async () => {
    // Arrange
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    mockThreadRepository.verifyThreadExists = vi.fn().mockRejectedValue(new NotFoundError('thread tidak ditemukan'));
    mockCommentRepository.addComment = vi.fn();

    const addCommentUseCase = new AddCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action and Assert
    await expect(addCommentUseCase.execute(useCasePayload)).rejects.toThrowError(NotFoundError);
    expect(mockThreadRepository.verifyThreadExists).toHaveBeenCalledWith('thread-123');
    expect(mockCommentRepository.addComment).not.toHaveBeenCalled();
  });

  it('should throw error and call no repository when the payload is invalid', async () => {
    // Arrange
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    mockThreadRepository.verifyThreadExists = vi.fn();
    mockCommentRepository.addComment = vi.fn();

    const addCommentUseCase = new AddCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action and Assert
    await expect(addCommentUseCase.execute({ threadId: 'thread-123', owner: 'user-123' }))
      .rejects.toThrowError('NEW_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
    expect(mockThreadRepository.verifyThreadExists).not.toHaveBeenCalled();
    expect(mockCommentRepository.addComment).not.toHaveBeenCalled();
  });
});
