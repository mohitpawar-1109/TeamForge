import Post from '../models/Post.js';
import TeamRequest from '../models/TeamRequest.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { calculatePostMatch } from '../services/match.service.js';
import { emitNotificationToUser } from '../socket/socket.js';
import { notifyPostLike } from '../services/notification.service.js';

import { uploadToImageKit, deleteFromImageKit } from '../config/imagekit.js';

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res, next) => {
  const uploadedFileIds = [];
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

    console.log('[POST /api/posts] content-type:', req.headers['content-type']);
    console.log('[POST /api/posts] body keys:', Object.keys(req.body || {}));
    console.log(
      '[POST /api/posts] files:',
      (Array.isArray(req.files) ? req.files : []).map(file => ({
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        hasBuffer: !!file.buffer
      }))
    );

    // Process uploaded files from Multer
    const mediaFiles = Array.isArray(req.files)
      ? req.files
      : (req.file ? [req.file] : (req.files && typeof req.files === 'object' ? Object.values(req.files).flat() : []));

    const hasText = content && typeof content === 'string' && content.trim().length > 0;
    const hasMedia = mediaFiles.length > 0 || (req.body.media && req.body.media.length > 0) || (image && typeof image === 'string' && image.trim().length > 0);

    if (!hasText && !hasMedia) {
      return res.status(400).json({
        success: false,
        message: 'Add some text or attach an image/video'
      });
    }

    // Check media type mixing rules: Cannot mix images and videos in the same post
    const imageFiles = mediaFiles.filter(f => f.mimetype.startsWith('image/'));
    const videoFiles = mediaFiles.filter(f => f.mimetype.startsWith('video/'));

    if (imageFiles.length > 0 && videoFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A post cannot contain both images and video. Please choose either multiple images or one video.'
      });
    }

    if (videoFiles.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'Only 1 video is allowed per post.'
      });
    }

    const uploadedMedia = [];

    // Process and upload each file to ImageKit
    for (const file of mediaFiles) {
      const isImage = file.mimetype.startsWith('image/');
      const isVideo = file.mimetype.startsWith('video/');

      if (isImage && file.size > 25 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: `Image "${file.originalname}" exceeds the 25MB size limit.`
        });
      }

      if (isVideo && file.size > 100 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: `Video "${file.originalname}" exceeds the 100MB size limit.`
        });
      }

      const uploaded = await uploadToImageKit(file.buffer, file.originalname, file.mimetype);
      uploadedMedia.push(uploaded);
      if (uploaded.fileId) {
        uploadedFileIds.push(uploaded.fileId);
      }
    }

    // Handle existing media array if passed in JSON body
    if (req.body.media) {
      try {
        const parsedMedia = typeof req.body.media === 'string' ? JSON.parse(req.body.media) : req.body.media;
        if (Array.isArray(parsedMedia)) {
          uploadedMedia.push(...parsedMedia.filter(m => m && m.url));
        } else if (parsedMedia && parsedMedia.url) {
          uploadedMedia.push(parsedMedia);
        }
      } catch {
        if (typeof req.body.media === 'string' && req.body.media.trim().startsWith('http')) {
          uploadedMedia.push({
            type: /\.(mp4|webm|mov|mkv)$/i.test(req.body.media) ? 'video' : 'image',
            url: req.body.media.trim(),
            name: 'Attachment'
          });
        }
      }
    }

    // Support legacy and alias fields: image, imageUrl, mediaUrl, attachments
    if (Array.isArray(req.body.attachments)) {
      uploadedMedia.push(...req.body.attachments.filter(a => a && a.url));
    }

    const otherUrls = [
      req.body.image,
      req.body.imageUrl,
      req.body.mediaUrl
    ].filter(url => typeof url === 'string' && url.trim().length > 0);

    for (const urlStr of otherUrls) {
      const cleanUrl = urlStr.trim();
      if (cleanUrl.startsWith('http') || cleanUrl.startsWith('data:')) {
        if (!uploadedMedia.some(m => m.url === cleanUrl)) {
          const isVid = /\.(mp4|webm|mov|mkv)$/i.test(cleanUrl);
          uploadedMedia.push({
            type: isVid ? 'video' : 'image',
            url: cleanUrl,
            name: 'Attachment'
          });
        }
      }
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
    const primaryImage = uploadedMedia.find(m => m.type === 'image')?.url || (image && typeof image === 'string' ? image.trim() : '');

    const post = await Post.create({
      author: req.user._id,
      content: (content || '').trim(),
      type: postType,
      tags: formattedTags,
      image: primaryImage,
      media: uploadedMedia,
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

    console.log('[POST CREATED]', {
      id: populatedPost._id,
      mediaCount: populatedPost.media?.length || 0,
      media: populatedPost.media?.map(m => ({
        type: m.type,
        url: m.url,
        fileId: m.fileId
      }))
    });

    res.status(201).json({
      success: true,
      message: 'Post published successfully',
      data: populatedPost,
      post: populatedPost
    });
  } catch (error) {
    console.error('[Create Post Error]:', error);
    // Cleanup uploaded ImageKit files if DB creation failed
    for (const fileId of uploadedFileIds) {
      deleteFromImageKit(fileId).catch(() => {});
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create post'
    });
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
          await notifyPostLike({
            recipientId: post.author,
            liker: req.user,
            post
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
    post.likes = post.likes.filter(id => (id?._id || id)?.toString() !== userIdStr);
    await post.save();

    res.json({
      success: true,
      liked: false,
      likeCount: post.likes.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request to join a team from a Team Post
// @route   POST /api/posts/:id/join
// @access  Private
export const requestJoinTeam = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.author.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot request to join your own team post'
      });
    }

    // Check if a request already exists
    const existingRequest = await TeamRequest.findOne({
      post: postId,
      requester: req.user._id
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You have already sent a request to join this team'
      });
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
      const notif = await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'TEAM_REQUEST',
        title: 'Team Join Request',
        message: `${req.user.name} wants to join your team`,
        relatedPost: post._id,
        relatedTeamRequest: teamRequest._id
      });
      emitNotificationToUser(post.author, notif);
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

// @desc    Get AI-assisted teammate matches for a LOOKING_FOR_TEAMMATES post
// @route   GET /api/posts/:id/matches
// @access  Private
export const getPostMatches = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Identify users to exclude (post author and existing members)
    const excludeIds = [
      post.author.toString(),
      ...(post.members || []).map(m => (m?._id || m).toString())
    ];

    // Fetch potential candidates
    const candidateUsers = await User.find({
      _id: { $nin: excludeIds }
    }).select('-password');

    // Calculate match for each candidate
    const matches = candidateUsers.map(candidate => {
      const matchDetails = calculatePostMatch(post, candidate);
      return {
        user: candidate,
        ...matchDetails
      };
    });

    // Sort descending by score
    matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    res.json({
      success: true,
      count: matches.length,
      post: {
        _id: post._id,
        title: post.title,
        type: post.type,
        requiredRoles: post.requiredRoles,
        requiredSkills: post.requiredSkills,
        teamSize: post.teamSize,
        currentMembers: post.currentMembers
      },
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

export const joinTeamPost = requestJoinTeam;

