import Post from '../models/Post.js';
import TeamRequest from '../models/TeamRequest.js';
import Notification from '../models/Notification.js';

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res, next) => {
  try {
    const {
      content,
      type,
      tags,
      image,
      projectLink,
      title,
      requiredRoles,
      requiredSkills,
      teamSize,
      currentMembers
    } = req.body;

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

    // Format roles if provided
    let formattedRoles = [];
    if (Array.isArray(requiredRoles)) {
      formattedRoles = requiredRoles
        .map(r => typeof r === 'string' ? r.trim() : '')
        .filter(Boolean);
    } else if (typeof requiredRoles === 'string' && requiredRoles.trim()) {
      formattedRoles = requiredRoles
        .split(',')
        .map(r => r.trim())
        .filter(Boolean);
    }

    // Format skills if provided
    let formattedSkills = [];
    if (Array.isArray(requiredSkills)) {
      formattedSkills = requiredSkills
        .map(s => typeof s === 'string' ? s.trim() : '')
        .filter(Boolean);
    } else if (typeof requiredSkills === 'string' && requiredSkills.trim()) {
      formattedSkills = requiredSkills
        .split(',')
        .map(s => s.trim())
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
      title: title ? title.trim() : '',
      requiredRoles: formattedRoles,
      requiredSkills: formattedSkills,
      teamSize: Number(teamSize) || 4,
      currentMembers: Number(currentMembers) || 1,
      members: [req.user._id],
      likes: [],
      commentsCount: 0
    });

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name email headline avatar college course year')
      .populate('members', 'name email headline avatar college course year');

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
      .populate('members', 'name email headline avatar college course year')
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
      .populate('author', 'name email headline avatar college course year')
      .populate('members', 'name email headline avatar college course year');

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

    const {
      content,
      type,
      tags,
      image,
      projectLink,
      title,
      requiredRoles,
      requiredSkills,
      teamSize,
      currentMembers
    } = req.body;

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

    if (requiredRoles !== undefined) {
      if (Array.isArray(requiredRoles)) {
        post.requiredRoles = requiredRoles.map(r => typeof r === 'string' ? r.trim() : '').filter(Boolean);
      } else if (typeof requiredRoles === 'string') {
        post.requiredRoles = requiredRoles.split(',').map(r => r.trim()).filter(Boolean);
      }
    }

    if (requiredSkills !== undefined) {
      if (Array.isArray(requiredSkills)) {
        post.requiredSkills = requiredSkills.map(s => typeof s === 'string' ? s.trim() : '').filter(Boolean);
      } else if (typeof requiredSkills === 'string') {
        post.requiredSkills = requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    if (teamSize !== undefined) post.teamSize = Number(teamSize) || post.teamSize;
    if (currentMembers !== undefined) post.currentMembers = Number(currentMembers) || post.currentMembers;
    if (title !== undefined) post.title = title.trim();
    if (image !== undefined) post.image = image;
    if (projectLink !== undefined) post.projectLink = projectLink.trim();

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name email headline avatar college course year')
      .populate('members', 'name email headline avatar college course year');

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

      // Create LIKE notification for post author if not liking own post
      if (post.author.toString() !== req.user._id.toString()) {
        try {
          await Notification.create({
            recipient: post.author,
            sender: req.user._id,
            type: 'LIKE',
            title: 'New Like',
            message: `${req.user.name} liked your post`,
            relatedPost: post._id
          });
        } catch (notifErr) {
          console.warn('Failed to create like notification:', notifErr.message);
        }
      }
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

// @desc    Request to join a team post (LOOKING_FOR_TEAMMATES)
// @route   POST /api/posts/:id/join
// @access  Private
export const joinTeamPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.type !== 'LOOKING_FOR_TEAMMATES') {
      return res.status(400).json({
        success: false,
        message: 'This post is not open for team join requests'
      });
    }

    // Cannot join own post
    if (post.author.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot request to join your own team post'
      });
    }

    // Check if team is full
    if (post.teamSize && post.currentMembers >= post.teamSize) {
      return res.status(400).json({
        success: false,
        message: 'Team is already full'
      });
    }

    // Check existing request
    const existing = await TeamRequest.findOne({
      post: postId,
      requester: req.user._id
    });

    if (existing) {
      if (existing.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'You have already sent a join request for this team'
        });
      }
      if (existing.status === 'accepted') {
        return res.status(400).json({
          success: false,
          message: 'You are already a member of this team'
        });
      }
    }

    const { message } = req.body;

    const teamRequest = await TeamRequest.create({
      post: postId,
      requester: req.user._id,
      postAuthor: post.author,
      message: message ? message.trim() : '',
      status: 'pending'
    });

    // Create TEAM_REQUEST notification for post author
    try {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'TEAM_REQUEST',
        title: 'Team Join Request',
        message: `${req.user.name} wants to join your team`,
        relatedPost: post._id,
        relatedTeamRequest: teamRequest._id
      });
    } catch (notifErr) {
      console.warn('Failed to create team request notification:', notifErr.message);
    }

    const populatedRequest = await TeamRequest.findById(teamRequest._id)
      .populate('requester', 'name email headline avatar college course year skills')
      .populate('post', 'content title type requiredRoles requiredSkills teamSize currentMembers');

    res.status(201).json({
      success: true,
      message: 'Join request sent successfully',
      data: populatedRequest
    });
  } catch (error) {
    next(error);
  }
};
