import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';

// @desc    Get all comments for a specific post
// @route   GET /api/posts/:id/comments
// @access  Public / Private
export const getPostComments = async (req, res, next) => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comments = await Comment.find({ post: postId })
      .populate('author', 'name email headline avatar college course year')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comments
// @access  Private
export const createComment = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      content: content.trim()
    });

    // Increment post's commentsCount
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    // Create COMMENT notification if not commenting on own post
    if (post.author.toString() !== req.user._id.toString()) {
      try {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: 'COMMENT',
          title: 'New Comment',
          message: `${req.user.name} commented on your post`,
          relatedPost: post._id
        });
      } catch (notifErr) {
        console.warn('Failed to create comment notification:', notifErr.message);
      }
    }

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email headline avatar college course year');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: populatedComment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a comment (Author only)
// @route   PUT /api/comments/:id
// @access  Private
export const updateComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty'
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check ownership
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this comment'
      });
    }

    comment.content = content.trim();
    await comment.save();

    const populated = await Comment.findById(comment._id)
      .populate('author', 'name email headline avatar college course year');

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment (Author only)
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check ownership
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    const postId = comment.post;
    await Comment.findByIdAndDelete(commentId);

    // Decrement commentsCount on Post (prevent negative count)
    await Post.findByIdAndUpdate(postId, [
      {
        $set: {
          commentsCount: {
            $max: [0, { $subtract: ['$commentsCount', 1] }]
          }
        }
      }
    ]);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
