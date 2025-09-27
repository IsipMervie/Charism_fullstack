const Feedback = require('../models/Feedback');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { getFeedbackResponseTemplate, getFeedbackStatusUpdateTemplate, getFeedbackSubmissionTemplate } = require('../utils/emailTemplates');

const submitFeedback = async (req, res) => {
  try {
    // CORS handled by main middleware - no conflicting headers
    
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

    // Send confirmation email to user
    if (finalUserEmail) {
      try {
        const emailSubject = `Feedback Received: ${subject}`;
        const emailContent = getFeedbackSubmissionTemplate(
          finalUserName,
          subject,
          message,
          category || 'general',
          priority || 'medium',
          feedback._id
        );

        await sendEmail(
          finalUserEmail,
          emailSubject,
          `Feedback Received: ${subject}`,
          emailContent
        );

        console.log(`✅ Confirmation email sent to ${finalUserEmail} for feedback submission`);
      } catch (emailError) {
        console.error('❌ Error sending feedback confirmation email:', emailError);
        // Don't fail the request if email fails
      }
    }

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

// Get feedback statistics for admin dashboard
const getFeedbackStats = async (req, res) => {
  try {
    // Check if database is connected using lazy connection
    const { getLazyConnection } = require('../config/db');
    const isConnected = await getLazyConnection();
    
    if (!isConnected) {
      console.log('Database not connected, returning empty stats');
      return res.json({
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0
      });
    }

    const [total, pending, inProgress, resolved] = await Promise.all([
      Feedback.countDocuments(),
      Feedback.countDocuments({ status: 'pending' }),
      Feedback.countDocuments({ status: 'working-on-it' }),
      Feedback.countDocuments({ status: 'resolve' })
    ]);

    res.json({
      total,
      pending,
      inProgress,
      resolved
    });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({ message: 'Failed to fetch feedback stats' });
  }
};

// Get all feedback for admin (with pagination and search)
const getAllFeedback = async (req, res) => {
  try {
    // Check if database is connected using lazy connection
    const { getLazyConnection } = require('../config/db');
    const isConnected = await getLazyConnection();
    
    if (!isConnected) {
      console.log('Database not connected, returning empty feedback list');
      return res.json({
        feedback: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    }

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

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      feedback,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    res.status(500).json({ message: 'Failed to fetch feedback' });
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
        const emailContent = getFeedbackResponseTemplate(
          feedback.userName,
          feedback.subject,
          adminResponse,
          req.user.name
        );

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
        const emailContent = getFeedbackStatusUpdateTemplate(
          feedback.userName,
          feedback.subject,
          feedback.status,
          status,
          req.user.name
        );

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
