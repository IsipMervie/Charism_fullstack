// Cold Start Detection and User Feedback Utility
// Handles Render.com free tier cold start delays gracefully

class ColdStartHandler {
  constructor() {
    this.coldStartThreshold = 5000; // 5 seconds
    this.isColdStart = false;
    this.showingNotification = false;
  }

  // Detect if we're experiencing a cold start
  detectColdStart(responseTime) {
    if (responseTime > this.coldStartThreshold && !this.isColdStart) {
      this.isColdStart = true;
      this.showColdStartNotification();
      return true;
    }
    return false;
  }

  // Show user-friendly cold start notification
  showColdStartNotification() {
    if (this.showingNotification) return;
    
    this.showingNotification = true;
    
    // Import SweetAlert2 dynamically to avoid loading issues
    import('sweetalert2').then((Swal) => {
      Swal.fire({
        title: '⏳ Server Starting Up',
        html: `
          <div style="text-align: center;">
            <p>Our server is starting up (this happens after 15 minutes of inactivity).</p>
            <p><strong>Please wait 15-30 seconds...</strong></p>
            <div style="margin: 20px 0;">
              <div class="spinner-border text-primary" role="status">
                <span class="sr-only">Loading...</span>
              </div>
            </div>
            <p style="font-size: 0.9em; color: #666;">
              This is normal for free hosting. After startup, everything will be fast!
            </p>
          </div>
        `,
        icon: 'info',
        showConfirmButton: false,
        allowOutsideClick: false,
        timer: 25000, // Auto-close after 25 seconds
        timerProgressBar: true,
        didOpen: () => {
          // Add custom styling
          const popup = document.querySelector('.swal2-popup');
          if (popup) {
            popup.style.borderRadius = '15px';
            popup.style.padding = '30px';
          }
        }
      }).then(() => {
        this.showingNotification = false;
        this.isColdStart = false;
      });
    }).catch(() => {
      // Fallback to console message if SweetAlert fails
      console.log('⏳ Server is starting up. Please wait 15-30 seconds...');
      this.showingNotification = false;
    });
  }

  // Hide cold start notification when server is ready
  hideColdStartNotification() {
    if (this.showingNotification) {
      import('sweetalert2').then((Swal) => {
        Swal.close();
        this.showingNotification = false;
        this.isColdStart = false;
      });
    }
  }

  // Get user-friendly error message for cold start
  getColdStartMessage() {
    return {
      title: 'Server Starting Up',
      message: 'Our server is waking up after inactivity. Please wait 15-30 seconds and try again.',
      type: 'info'
    };
  }
}

// Export singleton instance
export default new ColdStartHandler();
