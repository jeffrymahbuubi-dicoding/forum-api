import { vi } from 'vitest';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ReplyRepository from '../../../Domains/replies/ReplyRepository.js';
import LikeRepository from '../../../Domains/likes/LikeRepository.js';
import GetThreadDetailUseCase from '../GetThreadDetailUseCase.js';

describe('GetThreadDetailUseCase', () => {
  it('should orchestrating the get thread detail action correctly', async () => {
    // Arrange
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();
    const mockLikeRepository = new LikeRepository();

    mockThreadRepository.getThreadById = vi.fn()
      .mockImplementation(() => Promise.resolve({
        id: 'thread-123',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
      }));
    mockCommentRepository.getCommentsByThreadId = vi.fn()
      .mockImplementation(() => Promise.resolve([
        {
          id: 'comment-111',
          username: 'johndoe',
          date: '2021-08-08T07:22:33.555Z',
          content: 'sebuah comment',
          isDelete: false,
        },
        {
          id: 'comment-222',
          username: 'dicoding',
          date: '2021-08-08T07:26:21.338Z',
          content: 'komentar yang dihapus',
          isDelete: true,
        },
      ]));
    mockReplyRepository.getRepliesByThreadId = vi.fn()
      .mockImplementation(() => Promise.resolve([
        {
          id: 'reply-111',
          commentId: 'comment-111',
          username: 'johndoe',
          date: '2021-08-08T07:59:48.766Z',
          content: 'balasan yang dihapus',
          isDelete: true,
        },
        {
          id: 'reply-222',
          commentId: 'comment-111',
          username: 'dicoding',
          date: '2021-08-08T08:07:01.522Z',
          content: 'sebuah balasan',
          isDelete: false,
        },
      ]));
    mockLikeRepository.getLikeCountsByThreadId = vi.fn()
      .mockImplementation(() => Promise.resolve([
        { commentId: 'comment-111', likeCount: 2 },
      ]));

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
      likeRepository: mockLikeRepository,
    });

    // Action
    const threadDetail = await getThreadDetailUseCase.execute({ threadId: 'thread-123' });

    // Assert
    expect(threadDetail).toEqual({
      id: 'thread-123',
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      comments: [
        {
          id: 'comment-111',
          username: 'johndoe',
          date: '2021-08-08T07:22:33.555Z',
          replies: [
            {
              id: 'reply-111',
              content: '**balasan telah dihapus**',
              date: '2021-08-08T07:59:48.766Z',
              username: 'johndoe',
            },
            {
              id: 'reply-222',
              content: 'sebuah balasan',
              date: '2021-08-08T08:07:01.522Z',
              username: 'dicoding',
            },
          ],
          content: 'sebuah comment',
          likeCount: 2,
        },
        {
          id: 'comment-222',
          username: 'dicoding',
          date: '2021-08-08T07:26:21.338Z',
          replies: [],
          content: '**komentar telah dihapus**',
          likeCount: 0,
        },
      ],
    });
    expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith('thread-123');
    expect(mockCommentRepository.getCommentsByThreadId).toHaveBeenCalledWith('thread-123');
    expect(mockReplyRepository.getRepliesByThreadId).toHaveBeenCalledWith('thread-123');
    expect(mockLikeRepository.getLikeCountsByThreadId).toHaveBeenCalledWith('thread-123');
  });
});
