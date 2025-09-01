// Simple test function for Vercel
module.exports = (req, res) => {
  try {
    console.log('🧪 Test function called');
    
    res.status(200).json({
      status: 'OK',
      message: 'Test function working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      nodeVersion: process.version
    });
  } catch (error) {
    console.error('❌ Test function error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Test function failed',
      error: error.message
    });
  }
};
