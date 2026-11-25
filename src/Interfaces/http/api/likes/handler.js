import ToggleCommentLikeUseCase from '../../../../Applications/use_case/ToggleCommentLikeUseCase.js';

class LikesHandler {
  constructor(container) {
    this._container = container;

    this.putLikeHandler = this.putLikeHandler.bind(this);
  }

  async putLikeHandler(req, res, next) {
    try {
      const toggleCommentLikeUseCase = this._container.getInstance(ToggleCommentLikeUseCase.name);
      await toggleCommentLikeUseCase.execute({
        threadId: req.params.threadId,
        commentId: req.params.commentId,
        owner: req.auth.credentials.id,
      });

      res.status(200).json({
        status: 'success',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default LikesHandler;
