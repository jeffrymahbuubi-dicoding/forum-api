import express from 'express';

const createCommentsRouter = (handler, authentication) => {
  const router = express.Router({ mergeParams: true });

  router.post('/', authentication, handler.postCommentHandler);
  router.delete('/:commentId', authentication, handler.deleteCommentHandler);

  return router;
};

export default createCommentsRouter;
