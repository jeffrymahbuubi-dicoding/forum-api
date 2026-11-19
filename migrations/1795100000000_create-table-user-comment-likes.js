export const up = (pgm) => {
  pgm.createTable('user_comment_likes', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    'comment_id': {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'comments',
      onDelete: 'CASCADE',
    },
    owner: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
  });

  pgm.addConstraint('user_comment_likes', 'unique_comment_id_and_owner', {
    unique: ['comment_id', 'owner'],
  });
};

export const down = (pgm) => {
  pgm.dropTable('user_comment_likes');
};
