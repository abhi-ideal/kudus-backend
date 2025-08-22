
'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert demo support tickets
    await queryInterface.bulkInsert('Support', [
      {
        id: uuidv4(),
        name: 'John Doe',
        email: 'john.doe@example.com',
        subject: 'Unable to play video',
        message: 'I am having trouble playing videos on the platform. The video keeps buffering and stops after a few seconds.',
        category: 'technical',
        status: 'open',
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        subject: 'Billing inquiry',
        message: 'I was charged twice for my monthly subscription. Can you please help me resolve this issue?',
        category: 'billing',
        status: 'in_progress',
        priority: 'high',
        adminResponse: 'We are investigating your billing issue and will resolve it within 24 hours.',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        subject: 'Feature request',
        message: 'It would be great to have offline download functionality for mobile apps.',
        category: 'general',
        status: 'resolved',
        priority: 'low',
        adminResponse: 'Thank you for your feedback. This feature is planned for our next major release.',
        resolvedAt: new Date(),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date()
      }
    ]);

    // Insert demo privacy policy
    await queryInterface.bulkInsert('PrivacyPolicy', [
      {
        id: uuidv4(),
        title: 'Privacy Policy',
        content: `# Privacy Policy

## Information We Collect

We collect information you provide directly to us, such as when you create an account, subscribe to our service, or contact us for support.

## How We Use Your Information

We use the information we collect to:
- Provide, maintain, and improve our services
- Process transactions and send related information
- Send technical notices and support messages
- Communicate with you about our services

## Information Sharing

We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.

## Data Security

We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

## Contact Us

If you have any questions about this Privacy Policy, please contact us at privacy@ottplatform.com.`,
        version: '1.0',
        effectiveDate: new Date('2024-01-01'),
        isActive: true,
        createdBy: 'admin@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Insert demo terms and conditions
    await queryInterface.bulkInsert('TermsConditions', [
      {
        id: uuidv4(),
        title: 'Terms and Conditions',
        content: `# Terms and Conditions

## Acceptance of Terms

By accessing and using our streaming service, you accept and agree to be bound by the terms and provision of this agreement.

## Use License

Permission is granted to temporarily download one copy of the materials on our streaming service for personal, non-commercial transitory viewing only.

## Account Registration

You must register an account to access our premium content. You are responsible for maintaining the confidentiality of your account information.

## Subscription and Payment

Our service is provided on a subscription basis. Payments are processed monthly or annually based on your chosen plan.

## Content Usage

You may stream and view content through our platform for personal entertainment purposes only. Distribution or sharing of content is prohibited.

## User Conduct

You agree not to use the service to:
- Upload or distribute illegal content
- Interfere with other users' enjoyment of the service
- Attempt to gain unauthorized access to our systems

## Termination

We may terminate your account at our discretion if you violate these terms.

## Contact Information

For questions about these terms, contact us at legal@ottplatform.com.`,
        version: '1.0',
        effectiveDate: new Date('2024-01-01'),
        isActive: true,
        createdBy: 'admin@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Support', null, {});
    await queryInterface.bulkDelete('PrivacyPolicy', null, {});
    await queryInterface.bulkDelete('TermsConditions', null, {});
  }
};
