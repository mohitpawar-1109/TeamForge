import Post from '../models/Post.js';

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res, next) => {
  try {
    const { content, type, tags, image, projectLink } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Post content cannot be empty'
      });
    }

    // Format tags if array or comma-separated string
    let formattedTags = [];
    if (Array.isArray(tags)) {
      formattedTags = tags
        .map(t => typeof t === 'string' ? t.trim().replace(/^#/, '') : '')
        .filter(Boolean);
    } else if (typeof tags === 'string' && tags.trim()) {
      formattedTags = tags
        .split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(Boolean);
    }

    const validTypes = ['TEXT', 'PROJECT', 'HACKATHON', 'QUESTION', 'ACHIEVEMENT', 'LOOKING_FOR_TEAMMATES'];
    const postType = validTypes.includes(type) ? type : 'TEXT';

    const post = await Post.create({
      author: req.user._id,
      content: content.trim(),
      type: postType,
      tags: formattedTags,
      image: image || '',
      projectLink: projectLink ? projectLink.trim() : '',
      likes: [],
      commentsCount: 0
    });

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name email headline avatar college course year');

    res.status(201).json({
      success: true,
      message: 'Post published successfully',
      data: populatedPost
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all posts (with filtering and pagination)
// @route   GET /api/posts
// @access  Public / Private
export const getPosts = async (req, res, next) => {
  try {
    const { type, tag, author, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (type && type !== 'ALL') {
      query.type = type;
    }

    if (tag) {
      query.tags = { $in: [new RegExp(tag.trim(), 'i')] };
    }

    if (author) {
      query.author = author;
    }

    if (search && search.trim()) {
      query.$or = [
        { content: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const total = await Post.countDocuments(query);

    const posts = await Post.find(query)
      .populate('author', 'name email headline avatar college course year')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: posts.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: posts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public / Private
export const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email headline avatar college course year');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a post (Only author)
// @route   PUT /api/posts/:id
// @access  Private
export const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Authorization check
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this post'
      });
    }

    const { content, type, tags, image, projectLink } = req.body;

    if (content !== undefined) {
      if (!content.trim()) {
        return res.status(400).json({ success: false, message: 'Content cannot be empty' });
      }
      post.content = content.trim();
    }

    if (type !== undefined) {
      const validTypes = ['TEXT', 'PROJECT', 'HACKATHON', 'QUESTION', 'ACHIEVEMENT', 'LOOKING_FOR_TEAMMATES'];
      if (validTypes.includes(type)) {
        post.type = type;
      }
    }

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        post.tags = tags.map(t => typeof t === 'string' ? t.trim().replace(/^#/, '') : '').filter(Boolean);
      } else if (typeof tags === 'string') {
        post.tags = tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
      }
    }

    if (image !== undefined) post.image = image;
    if (projectLink !== undefined) post.projectLink = projectLink.trim();

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name email headline avatar college course year');

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: updatedPost
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post (Only author)
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Authorization check
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like a post
// @route   POST /api/posts/:id/like
// @access  Private
export const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const userIdStr = req.user._id.toString();
    const alreadyLiked = post.likes.some(id => (id?._id || id)?.toString() === userIdStr);

    if (!alreadyLiked) {
      post.likes.push(req.user._id);
      await post.save();
    }

    res.json({
      success: true,
      liked: true,
      likeCount: post.likes.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unlike a post
// @route   DELETE /api/posts/:id/like
// @access  Private
export const unlikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const userIdStr = req.user._id.toString();
    const initialCount = post.likes.length;
    post.likes = post.likes.filter(id => (id?._id || id)?.toString() !== userIdStr);

    if (post.likes.length !== initialCount) {
      await post.save();
    }

    res.json({
      success: true,
      liked: false,
      likeCount: post.likes.length
    });
  } catch (error) {
    next(error);
  }
};
