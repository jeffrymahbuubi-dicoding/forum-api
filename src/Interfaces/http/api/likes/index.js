import LikesHandler from './handler.js';
import createLikesRouter from './routes.js';
import authentication from '../../middlewares/authentication.js';

export default (container) => {
  const likesHandler = new LikesHandler(container);
  return createLikesRouter(likesHandler, authentication(container));
};
