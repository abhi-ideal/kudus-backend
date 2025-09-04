
'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert comprehensive help articles and FAQ
    await queryInterface.bulkInsert('HelpArticles', [
      // Account Management FAQ
      {
        id: uuidv4(),
        title: 'How to create an account',
        content: 'Creating an account is simple and free. Follow these steps:\n\n1. Visit our signup page\n2. Enter your email address\n3. Create a strong password (minimum 8 characters)\n4. Verify your email address through the confirmation link\n5. Complete your profile setup\n\nOnce verified, you can start exploring our content library and choose a subscription plan that suits your needs.',
        category: 'account',
        tags: JSON.stringify(['signup', 'registration', 'account', 'new user']),
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
        content: 'If you forgot your password, follow these steps:\n\n1. Go to the login page\n2. Click "Forgot Password" link\n3. Enter your registered email address\n4. Check your email for reset instructions\n5. Click the reset link in the email\n6. Create a new password\n7. Confirm your new password\n\nIf you don\'t receive the email within 10 minutes, check your spam folder or contact our support team.',
        category: 'account',
        tags: JSON.stringify(['password', 'reset', 'login', 'security']),
        isPublished: true,
        isFAQ: true,
        order: 2,
        createdBy: 'admin@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'How to update your profile information',
        content: 'To update your profile:\n\n1. Log into your account\n2. Go to Profile Settings\n3. Edit your personal information\n4. Update your preferences\n5. Save changes\n\nYou can update your name, email, profile picture, language preferences, and viewing preferences at any time.',
        category: 'account',
        tags: JSON.stringify(['profile', 'settings', 'update', 'personal info']),
        isPublished: true,
        isFAQ: true,
        order: 3,
        createdBy: 'admin@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Billing FAQ
      {
        id: uuidv4(),
        title: 'Subscription plans and pricing',
        content: 'We offer flexible subscription plans to meet your entertainment needs:\n\n**Basic Plan - $9.99/month**\n- Standard Definition (SD) streaming\n- Watch on 1 device at a time\n- Access to full content library\n\n**Standard Plan - $14.99/month**\n- High Definition (HD) streaming\n- Watch on 2 devices simultaneously\n- Download content for offline viewing\n\n**Premium Plan - $19.99/month**\n- Ultra High Definition (4K) streaming\n- Watch on 4 devices simultaneously\n- Download on multiple devices\n- Premium exclusive content\n\nAll plans include a 7-day free trial for new subscribers.',
        category: 'billing',
        tags: JSON.stringify(['pricing', 'subscription', 'plans', 'free trial']),
        isPublished: true,
        isFAQ: true,
        order: 1,
        createdBy: 'admin@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'How to cancel your subscription',
        content: 'You can cancel your subscription at any time:\n\n1. Log into your account\n2. Go to Billing & Subscription\n3. Click "Cancel Subscription"\n4. Follow the confirmation steps\n5. Your subscription will remain active until the end of your current billing period\n\nAfter cancellation, you can still access content until your subscription expires. You can reactivate anytime without losing your viewing history.',
        category: 'billing',
        tags: JSON.stringify(['cancel', 'subscription', 'billing', 'refund']),
        isPublished: true,
        isFAQ: true,
        order: 2,
        createdBy: 'admin@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'Payment methods and billing',
        content: 'We accept the following payment methods:\n\n- Credit Cards (Visa, MasterCard, American Express)\n- Debit Cards\n- PayPal\n- Apple Pay\n- Google Pay\n\nBilling occurs monthly on the date you subscribed. You can view and update your payment methods in the Billing section of your account settings.',
        category: 'billing',
        tags: JSON.stringify(['payment', 'billing', 'credit card', 'paypal']),
        isPublished: true,
        isFAQ: true,
        order: 3,
        createdBy: 'admin@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Streaming FAQ
      {
        id: uuidv4(),
        title: 'Troubleshooting video playback issues',
        content: 'If you are experiencing video playback issues, try these troubleshooting steps:\n\n**Basic Steps:**\n1. Check your internet connection (minimum 5 Mbps for HD)\n2. Refresh the page or restart the app\n3. Clear your browser cache and cookies\n4. Try a different browser or device\n\n**Advanced Steps:**\n1. Disable browser extensions\n2. Update your browser to the latest version\n3. Check for device software updates\n4. Restart your router/modem\n5. Contact your internet service provider\n\nIf issues persist, contact our technical support team with details about your device and browser.',
        category: 'streaming',
        tags: JSON.stringify(['troubleshooting', 'playback', 'video', 'buffering']),
        isPublished: true,
        isFAQ: true,
        order: 1,
        createdBy: 'admin@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'Supported devices and browsers',
        content: 'Our platform works on a wide range of devices:\n\n**Web Browsers:**\n- Chrome 80+\n- Firefox 75+\n- Safari 13+\n- Microsoft Edge 80+\n\n**Mobile Devices:**\n- iOS 12+ (iPhone, iPad)\n- Android 5.0+ (phones and tablets)\n\n**Smart TVs:**\n- Samsung Smart TV (2017+)\n- LG Smart TV (webOS 3.0+)\n- Android TV\n- Apple TV 4th generation+\n\n**Streaming Devices:**\n- Roku\n- Amazon Fire TV\n- Chromecast\n- Xbox One/Series X|S\n- PlayStation 4/5',
        category: 'streaming',
        tags: JSON.stringify(['devices', 'compatibility', 'browsers', 'smart tv']),
        isPublished: true,
        isFAQ: true,
        order: 2,
        createdBy: 'admin@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'Video quality and data usage',
        content: 'Our streaming adapts to your internet speed for the best viewing experience:\n\n**Quality Levels:**\n- Auto: Automatically adjusts based on connection\n- Low (SD): ~0.5 GB per hour\n- Medium (HD): ~1.5 GB per hour\n- High (4K): ~3-7 GB per hour\n\n**To change video quality:**\n1. Start playing a video\n2. Click the settings icon\n3. Select your preferred quality\n4. Changes apply immediately\n\nWe recommend a stable internet connection of at least 25 Mbps for 4K streaming.',
        category: 'streaming',
        tags: JSON.stringify(['quality', 'data usage', '4k', 'hd', 'bandwidth']),
        isPublished: true,
        isFAQ: true,
        order: 3,
        createdBy: 'admin@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Features FAQ
      {
        id: uuidv4(),
        title: 'How to create and manage profiles',
        content: 'You can create up to 5 profiles per account for personalized viewing:\n\n**Creating a Profile:**\n1. Go to Profile Settings\n2. Click "Add Profile"\n3. Enter a name and select an avatar\n4. Choose if it\'s a kids profile\n5. Save the profile\n\n**Managing Profiles:**\n- Each profile has its own watchlist\n- Separate viewing history and recommendations\n- Parental controls for kids profiles\n- Language and subtitle preferences\n\n**Switching Profiles:**\nClick on the profile icon and select the desired profile from the dropdown menu.',
        category: 'features',
        tags: JSON.stringify(['profiles', 'settings', 'management', 'kids']),
        isPublished: true,
        isFAQ: true,
        order: 1,
        createdBy: 'admin@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'Using the watchlist feature',
        content: 'Keep track of content you want to watch:\n\n**Adding to Watchlist:**\n1. Browse or search for content\n2. Hover over the title\n3. Click the "+" or bookmark icon\n4. Item is added to your profile\'s watchlist\n\n**Managing Your Watchlist:**\n- Access from the main menu\n- Remove items by clicking the "-" icon\n- Items are automatically removed after watching\n- Each profile has its own separate watchlist\n\n**Watchlist Features:**\n- Sync across all your devices\n- Get notifications for new episodes\n- Priority recommendations based on your list',
        category: 'features',
        tags: JSON.stringify(['watchlist', 'bookmark', 'save', 'watch later']),
        isPublished: true,
        isFAQ: true,
        order: 2,
        createdBy: 'admin@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'Downloading content for offline viewing',
        content: 'Download your favorite content to watch without an internet connection:\n\n**Requirements:**\n- Standard or Premium subscription plan\n- Mobile app (iOS/Android)\n- Sufficient device storage\n\n**How to Download:**\n1. Open the mobile app\n2. Find the content you want to download\n3. Tap the download icon\n4. Choose video quality (higher quality = larger file)\n5. Wait for download to complete\n\n**Download Limits:**\n- Standard Plan: 10 downloads\n- Premium Plan: 30 downloads\n- Downloads expire after 30 days\n- Some content may not be available for download due to licensing',
        category: 'features',
        tags: JSON.stringify(['download', 'offline', 'mobile', 'storage']),
        isPublished: true,
        isFAQ: false,
        order: 3,
        createdBy: 'admin@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Content FAQ
      {
        id: uuidv4(),
        title: 'Content availability and regions',
        content: 'Content availability varies by region due to licensing agreements:\n\n**Global Content:**\n- Our original productions are available worldwide\n- Most popular movies and series\n- Documentary collections\n\n**Regional Variations:**\n- Some content may be restricted in certain countries\n- New releases may have different launch dates\n- Licensing expires differently by region\n\n**Finding Available Content:**\n- Browse by category in your region\n- Use the search function\n- Check "New Releases" section\n- Content availability is clearly marked',
        category: 'content',
        tags: JSON.stringify(['availability', 'regions', 'licensing', 'geo-restriction']),
        isPublished: true,
        isFAQ: true,
        order: 1,
        createdBy: 'admin@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'Parental controls and kids content',
        content: 'Keep your family\'s viewing experience safe and appropriate:\n\n**Setting Up Parental Controls:**\n1. Go to Account Settings\n2. Select Parental Controls\n3. Create a 4-digit PIN\n4. Set maturity ratings for each profile\n\n**Kids Profiles:**\n- Automatically filter age-appropriate content\n- Colorful, easy-to-navigate interface\n- Educational and entertaining content\n- No access to mature content\n\n**Maturity Ratings:**\n- Little Kids: Ages 2-7\n- Older Kids: Ages 8-12\n- Teens: Ages 13-17\n- Adults: 18+ (unrestricted)\n\nYou can modify these settings anytime using your PIN.',
        category: 'content',
        tags: JSON.stringify(['parental controls', 'kids', 'family', 'ratings']),
        isPublished: true,
        isFAQ: true,
        order: 2,
        createdBy: 'admin@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // General FAQ
      {
        id: uuidv4(),
        title: 'Getting started guide',
        content: 'Welcome to our streaming platform! Here\'s how to get started:\n\n**Step 1: Sign Up**\n- Create your account with email verification\n- Choose your subscription plan\n- Set up your payment method\n\n**Step 2: Set Up Your Profile**\n- Add a profile picture\n- Set your viewing preferences\n- Create additional profiles for family members\n\n**Step 3: Explore Content**\n- Browse categories and genres\n- Add titles to your watchlist\n- Start watching immediately\n\n**Step 4: Customize Your Experience**\n- Rate content you\'ve watched\n- Adjust video quality settings\n- Set up parental controls if needed\n\nNeed help? Our support team is available 24/7 through live chat.',
        category: 'general',
        tags: JSON.stringify(['getting started', 'guide', 'setup', 'new user']),
        isPublished: true,
        isFAQ: false,
        order: 1,
        createdBy: 'admin@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Insert comprehensive contact us requests (demo data)
    await queryInterface.bulkInsert('ContactUs', [
      {
        id: uuidv4(),
        email: 'user1@example.com',
        subject: 'Cannot access premium content after subscription',
        description: 'I subscribed to the premium plan yesterday but I am still unable to access 4K content and premium exclusive shows. My payment went through successfully. Please help resolve this issue as soon as possible.',
        status: 'new',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'parent.user@example.com',
        subject: 'Parental control settings not working',
        description: 'I set up parental controls for my child\'s profile but they can still access mature content. The PIN protection doesn\'t seem to be working properly. This is concerning for child safety.',
        status: 'in_progress',
        priority: 'urgent',
        adminResponse: 'Thank you for reporting this issue. Our technical team is investigating the parental control functionality. We will have this resolved within 24 hours and will notify you once the fix is deployed.',
        respondedBy: 'admin@ottplatform.com',
        respondedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'tech.user@example.com',
        subject: 'Video buffering issues on multiple devices',
        description: 'I am experiencing constant buffering on all my devices (smart TV, laptop, phone) even though I have a 100 Mbps internet connection. The issue started 3 days ago and affects all video quality settings.',
        status: 'in_progress',
        priority: 'medium',
        adminResponse: 'We are investigating reports of buffering issues in your region. Our CDN team is working on optimizing content delivery. We expect improvements within the next 48 hours.',
        respondedBy: 'support@ottplatform.com',
        respondedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'feature.lover@example.com',
        subject: 'Feature request: Download limit increase',
        description: 'I travel frequently for work and would love to have more download slots. Currently, the 10 downloads on Standard plan is not enough for long trips. Would you consider increasing this or offering a travel-friendly plan?',
        status: 'resolved',
        priority: 'low',
        adminResponse: 'Thank you for your feedback! We\'re excited to announce that we\'ve increased download limits: Standard plan now allows 15 downloads, and Premium plan allows 50 downloads. The changes are effective immediately in your account.',
        respondedBy: 'product@ottplatform.com',
        respondedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'billing.question@example.com',
        subject: 'Question about annual subscription discount',
        description: 'I saw an advertisement about annual subscription discounts but I can\'t find this option in my billing settings. Do you offer yearly plans with discounts? What would be the pricing for Premium annual subscription?',
        status: 'resolved',
        priority: 'medium',
        adminResponse: 'Yes, we offer annual subscriptions with significant savings! Premium annual is $199 (save $40), Standard annual is $149 (save $30), and Basic annual is $99 (save $20). You can switch to annual billing in your account settings under "Subscription Options".',
        respondedBy: 'billing@ottplatform.com',
        respondedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'app.user@example.com',
        subject: 'Mobile app login issues',
        description: 'The mobile app keeps signing me out every few hours. I have to re-enter my credentials constantly which is very frustrating. This only happens on the mobile app, web version works fine.',
        status: 'new',
        priority: 'medium',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      },
      {
        id: uuidv4(),
        email: 'international.user@example.com',
        subject: 'Content not available in my region',
        description: 'I am traveling to Europe and many shows that were available in the US are now blocked. Is there a way to access my home region content while traveling? I maintain an active subscription.',
        status: 'closed',
        priority: 'low',
        adminResponse: 'Due to licensing agreements, content availability varies by region. While traveling, you\'ll see the content library available in your current location. We\'re working on expanding global licensing. You can use our "Available in Your Region" filter to see what\'s currently accessible.',
        respondedBy: 'support@ottplatform.com',
        respondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('HelpArticles', null, {});
    await queryInterface.bulkDelete('ContactUs', null, {});
  }
};
