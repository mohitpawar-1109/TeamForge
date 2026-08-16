import TeamRequest from '../models/TeamRequest.js';
import Post from '../models/Post.js';

// @desc    Get team join requests (incoming & outgoing)
// @route   GET /api/team-requests
// @access  Private
export const getTeamRequests = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { type } = req.query; // 'incoming' | 'outgoing' | 'all'

    let filter = {
      $or: [
        { postAuthor: userId },
        { requester: userId }
      ]
    };

    if (type === 'incoming') {
      filter = { postAuthor: userId };
    } else if (type === 'outgoing') {
      filter = { requester: userId };
    }

    const requests = await TeamRequest.find(filter)
      .populate('requester', 'name email headline avatar college course year skills')
      .populate('postAuthor', 'name email headline avatar college course year')
      .populate('post', 'content title type requiredRoles requiredSkills teamSize currentMembers')
      .sort({ createdAt: -1 });

    const incoming = requests.filter(r => r.postAuthor?._id?.toString() === userId.toString());
    const outgoing = requests.filter(r => r.requester?._id?.toString() === userId.toString());

    res.json({
      success: true,
      count: requests.length,
      data: requests,
      incoming,
      outgoing
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept or reject a team join request
// @route   PATCH /api/team-requests/:id
// @access  Private (Post Author only)
export const updateTeamRequestStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const requestId = req.params.id;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "accepted" or "rejected"'
      });
    }

    const teamRequest = await TeamRequest.findById(requestId);
    if (!teamRequest) {
      return res.status(404).json({
        success: false,
        message: 'Team request not found'
      });
    }

    // Only postAuthor can accept/reject
    if (teamRequest.postAuthor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the post author can accept or reject this join request'
      });
    }

    // Handle acceptance logic
    if (status === 'accepted' && teamRequest.status !== 'accepted') {
      const post = await Post.findById(teamRequest.post);
      if (post) {
        // Increment currentMembers up to teamSize
        if (post.teamSize && post.currentMembers >= post.teamSize) {
          return res.status(400).json({
            success: false,
            message: 'Cannot accept request. Team is already full'
          });
        }

        post.currentMembers = (post.currentMembers || 1) + 1;
        if (!post.members) post.members = [];
        if (!post.members.includes(teamRequest.requester)) {
          post.members.push(teamRequest.requester);
        }
        await post.save();
      }
    }

    teamRequest.status = status;
    await teamRequest.save();

    const updated = await TeamRequest.findById(requestId)
      .populate('requester', 'name email headline avatar college course year skills')
      .populate('postAuthor', 'name email headline avatar college course year')
      .populate('post', 'content title type requiredRoles requiredSkills teamSize currentMembers');

    res.json({
      success: true,
      message: `Team request ${status} successfully`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
