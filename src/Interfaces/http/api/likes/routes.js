import express from 'express';

const createLikesRouter = (handler, authentication) => {
  const router = express.Router({ mergeParams: true });

  router.put('/', authentication, handler.putLikeHandler);

  return router;
};

export default createLikesRouter;
