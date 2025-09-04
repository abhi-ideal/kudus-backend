
'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert demo help articles
    await queryInterface.bulkInsert('HelpArticles', [
      {
        id: uuidv4(),
        title: 'How to create an account',
        content: 'Creating an account is simple. Go to the signup page, enter your email and create a password. You will receive a verification email to complete the process.',
        category: 'account',
        tags: JSON.stringify(['signup', 'registration', 'account']),
        isPublished: true,
        isFAQ: true,
        order: 1,
        createdBy: 'admin@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'How to reset your password',
        content: 'If you forgot your password, click on "Forgot Password" on the login page. Enter your email address and we will send you instructions to reset your password.',
        category: 'account',
        tags: JSON.stringify(['password', 'reset', 'login']),
        isPublished: true,
        isFAQ: true,
        order: 2,
        createdBy: 'admin@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'Subscription plans and pricing',
        content: 'We offer multiple subscription plans: Basic ($9.99/month), Standard ($14.99/month), and Premium ($19.99/month). Each plan offers different features and streaming quality.',
        category: 'billing',
        tags: JSON.stringify(['pricing', 'subscription', 'plans']),
        isPublished: true,
        isFAQ: true,
        order: 1,
        createdBy: 'admin@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'Troubleshooting video playback issues',
        content: 'If you are experiencing video playback issues, try these steps: 1. Check your internet connection 2. Clear your browser cache 3. Try a different browser 4. Restart your device',
        category: 'streaming',
        tags: JSON.stringify(['troubleshooting', 'playback', 'video']),
        isPublished: true,
        isFAQ: false,
        order: 1,
        createdBy: 'admin@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'How to create and manage profiles',
        content: 'You can create up to 5 profiles per account. Go to Profile Settings and click "Add Profile". Each profile can have its own watchlist and viewing history.',
        category: 'features',
        tags: JSON.stringify(['profiles', 'settings', 'management']),
        isPublished: true,
        isFAQ: false,
        order: 1,
        createdBy: 'admin@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Insert demo contact us requests
    await queryInterface.bulkInsert('ContactUs', [
      {
        id: uuidv4(),
        email: 'user1@example.com',
        subject: 'Cannot access premium content',
        description: 'I have subscribed to the premium plan but I am unable to access premium content. Please help.',
        status: 'new',
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'user2@example.com',
        subject: 'Video quality issues',
        description: 'The video quality is poor even though I have a good internet connection. Can you please look into this?',
        status: 'in_progress',
        priority: 'high',
        adminResponse: 'We are investigating the video quality issues in your region.',
        respondedBy: 'admin@ottplatform.com',
        respondedAt: new Date(),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'user3@example.com',
        subject: 'Feature suggestion',
        description: 'It would be great to have a download feature for offline viewing. Is this planned?',
        status: 'resolved',
        priority: 'low',
        adminResponse: 'Thank you for your suggestion. Offline viewing is planned for our next major update.',
        respondedBy: 'admin@ottplatform.com',
        respondedAt: new Date(),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('HelpArticles', null, {});
    await queryInterface.bulkDelete('ContactUs', null, {});
  }
};
