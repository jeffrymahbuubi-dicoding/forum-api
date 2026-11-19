import { vi } from 'vitest';
import NewThread from '../../../Domains/threads/entities/NewThread.js';
import AddedThread from '../../../Domains/threads/entities/AddedThread.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import AddThreadUseCase from '../AddThreadUseCase.js';

describe('AddThreadUseCase', () => {
  it('should orchestrating the add thread action correctly', async () => {
    // Arrange
    const useCasePayload = {
      title: 'sebuah thread',
      body: 'sebuah body thread',
      owner: 'user-123',
    };

    const mockThreadRepository = new ThreadRepository();
    mockThreadRepository.addThread = vi.fn()
      .mockImplementation(() => Promise.resolve(new AddedThread({
        id: 'thread-456',
        title: 'judul dari repository',
        owner: 'user-456',
      })));

    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const addedThread = await addThreadUseCase.execute(useCasePayload);

    // Assert
    expect(addedThread).toStrictEqual(new AddedThread({
      id: 'thread-456',
      title: 'judul dari repository',
      owner: 'user-456',
    }));
    expect(mockThreadRepository.addThread).toBeCalledTimes(1);
    expect(mockThreadRepository.addThread).toBeCalledWith(new NewThread({
      title: useCasePayload.title,
      body: useCasePayload.body,
      owner: useCasePayload.owner,
    }));
  });

  it('should not call the repository when payload is invalid', async () => {
    // Arrange
    const mockThreadRepository = new ThreadRepository();
    mockThreadRepository.addThread = vi.fn();
    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action and Assert
    await expect(addThreadUseCase.execute({ title: 'sebuah thread', owner: 'user-123' }))
      .rejects.toThrowError('NEW_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
    expect(mockThreadRepository.addThread).not.toBeCalled();
  });
});
