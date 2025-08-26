const Feedback = require('../models/Feedback');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const submitFeedback = async (req, res) => {
  try {
    const { subject, message, category, priority, userEmail, userName, userRole } = req.body;

    let userId = null;
    let finalUserEmail = userEmail;
    let finalUserName = userName;
    let finalUserRole = userRole;

    // If user is authenticated, use their details
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        userId = user._id;
        finalUserEmail = user.email;
        finalUserName = user.name; // Use 'name' field instead of firstName + lastName
        finalUserRole = user.role.toLowerCase(); // Convert to lowercase to match Feedback schema
      }
    }

    // Validate required fields for public submission
    if (!userId && (!finalUserEmail || !finalUserName)) {
      return res.status(400).json({
        message: 'Email and name are required for feedback submission'
      });
    }

    const feedback = new Feedback({
      userId,
      userEmail: finalUserEmail,
      userName: finalUserName,
      userRole: finalUserRole || 'guest',
      subject,
      message,
      category: category || 'general',
      priority: priority || 'medium'
    });

    await feedback.save();

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
};

const getUserFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    res.status(500).json({ message: 'Failed to fetch feedback' });
  }
};

const getAllFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, priority, search } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    
    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i'); // Case-insensitive search
      filter.$or = [
        { subject: searchRegex },
        { message: searchRegex },
        { userName: searchRegex },
        { userEmail: searchRegex }
      ];
    }

    const skip = (page - 1) * limit;
    
    const [feedback, total] = await Promise.all([
      Feedback.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Feedback.countDocuments(filter)
    ]);

    res.json({
      feedback,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    res.status(500).json({ message: 'Failed to fetch feedback' });
  }
};

const getFeedbackStats = async (req, res) => {
  try {
    const totalCount = await Feedback.countDocuments();

    const overall = {
      total: totalCount
    };

    res.json({ overall });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({ message: 'Failed to fetch feedback statistics' });
  }
};

const updateFeedback = async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const { feedbackId } = req.params;

    const updateData = {};
    if (status) updateData.status = status;
    if (adminResponse) {
      updateData.adminResponse = adminResponse;
      updateData.adminId = req.user._id;
      updateData.adminName = req.user.name; // Use 'name' field instead of firstName + lastName
    }

    // If status is being set to resolve, add resolvedAt timestamp
    if (status === 'resolve') {
      updateData.resolvedAt = new Date();
    }

    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      updateData,
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Send email notification to user if admin responded
    if (adminResponse && feedback.userEmail) {
      try {
        const emailSubject = `Response to your feedback: ${feedback.subject}`;
        const emailContent = `
          <h3>Hello ${feedback.userName},</h3>
          <p>An administrator has responded to your feedback:</p>
          <hr>
          <p><strong>Your Feedback:</strong></p>
          <p>${feedback.message}</p>
          <hr>
          <p><strong>Admin Response:</strong></p>
          <p>${adminResponse}</p>
          <hr>
          <p><strong>Feedback Status:</strong> ${status || feedback.status}</p>
          <p><strong>Response Date:</strong> ${new Date().toLocaleDateString()}</p>
          <br>
          <p>Thank you for your feedback!</p>
          <p>- ${req.user.name} (Administrator)</p>
        `;

        await sendEmail(
          feedback.userEmail,
          emailSubject,
          `Response to your feedback: ${feedback.subject}`,
          emailContent
        );

        console.log(`✅ Email notification sent to ${feedback.userEmail} for feedback response`);
      } catch (emailError) {
        console.error('❌ Error sending feedback response email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Send email notification for status changes
    if (status && status !== feedback.status && feedback.userEmail) {
      try {
        const emailSubject = `Feedback Status Update: ${feedback.subject}`;
        const emailContent = `
          <h3>Hello ${feedback.userName},</h3>
          <p>Your feedback status has been updated:</p>
          <hr>
          <p><strong>Your Feedback:</strong></p>
          <p>${feedback.message}</p>
          <hr>
          <p><strong>Status Changed From:</strong> ${feedback.status}</p>
          <p><strong>Status Changed To:</strong> ${status}</p>
          <p><strong>Update Date:</strong> ${new Date().toLocaleDateString()}</p>
          <br>
          <p>Thank you for your feedback!</p>
          <p>- ${req.user.name} (Administrator)</p>
        `;

        await sendEmail(
          feedback.userEmail,
          emailSubject,
          `Feedback Status Update: ${feedback.subject}`,
          emailContent
        );

        console.log(`✅ Email notification sent to ${feedback.userEmail} for status change`);
      } catch (emailError) {
        console.error('❌ Error sending status change email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({
      message: 'Feedback updated successfully',
      feedback
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ message: 'Failed to update feedback' });
  }
};

const deleteFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const feedback = await Feedback.findByIdAndDelete(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ message: 'Failed to delete feedback' });
  }
};

const getFeedbackById = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Check if user can access this feedback
    if (feedback.userId && feedback.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Failed to fetch feedback' });
  }
};

// Export all functions
module.exports = {
  submitFeedback,
  getUserFeedback,
  getAllFeedback,
  getFeedbackStats,
  updateFeedback,
  deleteFeedback,
  getFeedbackById
};
