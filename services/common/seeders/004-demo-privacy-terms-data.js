
'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert Privacy Policy
    await queryInterface.bulkInsert('PrivacyPolicy', [
      {
        id: uuidv4(),
        version: '1.0',
        title: 'Privacy Policy',
        content: `# Privacy Policy

**Effective Date:** January 1, 2024  
**Last Updated:** January 1, 2024

## 1. Introduction

Welcome to OTT Platform ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our streaming service, including our website, mobile applications, and related services (collectively, the "Service").

## 2. Information We Collect

### 2.1 Personal Information
- **Account Information:** Name, email address, password, phone number
- **Payment Information:** Credit card details, billing address (processed securely through third-party payment processors)
- **Profile Information:** Profile picture, viewing preferences, language settings

### 2.2 Viewing Data
- **Watch History:** Content viewed, viewing duration, timestamps
- **Preferences:** Liked/disliked content, ratings, watchlist items
- **Playback Information:** Video quality, device type, pause/resume data

### 2.3 Technical Information
- **Device Information:** Device type, operating system, browser type and version
- **Usage Data:** IP address, access times, pages viewed, referring URLs
- **Performance Data:** App crashes, response times, system performance

### 2.4 Communication Data
- **Support Interactions:** Messages, chat logs, support tickets
- **Marketing Communications:** Email preferences, subscription to newsletters

## 3. How We Use Your Information

### 3.1 Service Provision
- Provide and maintain our streaming service
- Process payments and manage subscriptions
- Authenticate users and secure accounts
- Deliver personalized content recommendations

### 3.2 Improvement and Analytics
- Analyze usage patterns to improve service quality
- Develop new features and functionality
- Monitor and analyze trends and usage
- Conduct research and analytics

### 3.3 Communication
- Send service-related notifications
- Respond to customer support inquiries
- Send marketing communications (with consent)
- Notify about policy changes or service updates

### 3.4 Legal and Security
- Comply with legal obligations
- Protect against fraud and abuse
- Enforce our terms of service
- Ensure platform security

## 4. Information Sharing and Disclosure

### 4.1 Third-Party Service Providers
We may share information with trusted third parties who assist us in:
- Payment processing
- Content delivery
- Analytics and metrics
- Customer support
- Marketing and advertising

### 4.2 Business Transfers
In the event of a merger, acquisition, or sale of assets, user information may be transferred to the new entity.

### 4.3 Legal Requirements
We may disclose information when required by law, court order, or government request, or to protect our rights and safety.

### 4.4 Consent
We may share information with your explicit consent for specific purposes not covered in this policy.

## 5. Data Security

### 5.1 Security Measures
- Encryption of data in transit and at rest
- Regular security assessments and audits
- Access controls and authentication
- Secure data centers and infrastructure

### 5.2 Data Retention
- Account data: Retained while account is active plus 3 years
- Viewing data: Retained for 2 years for analytics
- Payment data: As required by law and payment processors
- Support data: Retained for 5 years

## 6. Your Rights and Choices

### 6.1 Account Management
- Access and update your personal information
- Change privacy settings and preferences
- Download your data
- Delete your account

### 6.2 Communication Preferences
- Opt-out of marketing emails
- Manage notification settings
- Update contact preferences

### 6.3 Regional Rights
Depending on your location, you may have additional rights under local privacy laws such as GDPR, CCPA, or other applicable regulations.

## 7. Cookies and Tracking Technologies

### 7.1 Types of Cookies
- **Essential Cookies:** Required for basic service functionality
- **Analytics Cookies:** Help us understand how you use our service
- **Preference Cookies:** Remember your settings and preferences
- **Marketing Cookies:** Used for personalized advertising

### 7.2 Cookie Management
You can manage cookie preferences through your browser settings or our cookie preference center.

## 8. Children's Privacy

Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we learn we have collected such information, we will delete it promptly.

## 9. International Data Transfers

Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.

## 10. Third-Party Links

Our service may contain links to third-party websites or services. This privacy policy does not apply to those external sites.

## 11. Changes to This Privacy Policy

We may update this Privacy Policy periodically. We will notify you of significant changes via email or through our service.

## 12. Contact Us

If you have questions about this Privacy Policy, please contact us:
- Email: privacy@ottplatform.com
- Address: OTT Platform Privacy Team, 123 Streaming Ave, Media City, MC 12345
- Phone: 1-800-OTT-HELP

---

*This Privacy Policy is designed to be transparent about our data practices. We are committed to protecting your privacy and giving you control over your information.*`,
        effectiveDate: new Date('2024-01-01'),
        isActive: true,
        createdBy: 'legal@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Insert Terms and Conditions
    await queryInterface.bulkInsert('TermsConditions', [
      {
        id: uuidv4(),
        version: '1.0',
        title: 'Terms and Conditions',
        content: `# Terms and Conditions

**Effective Date:** January 1, 2024  
**Last Updated:** January 1, 2024

## 1. Acceptance of Terms

By accessing or using OTT Platform ("Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you disagree with any part of these terms, you may not access the Service.

## 2. Service Description

OTT Platform is a subscription-based streaming service that provides access to movies, TV shows, documentaries, and original content through internet-connected devices.

### 2.1 Service Features
- Unlimited streaming of content library
- Multiple user profiles per account
- Offline downloads (on supported plans)
- Multi-device access
- Personalized recommendations

### 2.2 Service Availability
- Service availability may vary by geographic location
- Content library varies by region due to licensing
- We reserve the right to modify or discontinue features

## 3. Subscription and Billing

### 3.1 Subscription Plans
- **Basic Plan:** $9.99/month - SD quality, 1 device
- **Standard Plan:** $14.99/month - HD quality, 2 devices, downloads
- **Premium Plan:** $19.99/month - 4K quality, 4 devices, enhanced features

### 3.2 Billing Terms
- Subscriptions are billed monthly or annually in advance
- Prices are subject to change with 30 days notice
- No refunds for partial months or unused time
- Auto-renewal unless cancelled

### 3.3 Free Trial
- New subscribers may be eligible for a free trial
- Trial converts to paid subscription unless cancelled
- One trial per customer

### 3.4 Payment
- Valid payment method required
- Billing occurs on subscription date each period
- Service may be suspended for failed payments
- You're responsible for all charges on your account

## 4. Account and Security

### 4.1 Account Creation
- You must be 18+ to create an account
- Provide accurate and complete information
- Maintain current account information
- One account per person

### 4.2 Account Security
- Keep login credentials confidential
- Notify us immediately of unauthorized access
- You're responsible for all account activity
- We may suspend accounts for security reasons

### 4.3 Profiles
- Create up to 5 profiles per account
- Set appropriate maturity levels for each profile
- Monitor content accessed by minors
- Each profile maintains separate viewing history

## 5. Acceptable Use

### 5.1 Permitted Use
- Personal, non-commercial streaming
- Create profiles for household members
- Download content for offline viewing (where available)
- Rate and review content

### 5.2 Prohibited Activities
- Share account credentials with non-household members
- Use automated systems to access the service
- Attempt to circumvent geographic restrictions
- Copy, distribute, or publicly display content
- Reverse engineer or modify our technology
- Use the service for illegal purposes

### 5.3 Content Guidelines
- Respect intellectual property rights
- No uploading of unauthorized content
- Report inappropriate content or behavior
- Follow community guidelines in reviews and comments

## 6. Content and Intellectual Property

### 6.1 Our Content Rights
- All content is owned by us or our licensors
- Content is protected by copyright and other laws
- We grant limited, non-exclusive viewing rights
- Rights are revocable and non-transferable

### 6.2 Content Availability
- Content library changes regularly
- Licensing determines regional availability
- We may remove content at any time
- No guarantee of perpetual availability

### 6.3 User-Generated Content
- You retain ownership of content you submit
- You grant us license to use submitted content
- Content must comply with our guidelines
- We may remove inappropriate content

## 7. Privacy and Data Protection

### 7.1 Data Collection
- We collect information as described in our Privacy Policy
- Viewing data helps improve recommendations
- Technical data ensures service quality
- Communication data supports customer service

### 7.2 Data Use
- Provide and improve the service
- Personalize user experience
- Analytics and business intelligence
- Legal compliance and security

## 8. Service Limitations

### 8.1 Technical Requirements
- Compatible internet-connected device required
- Sufficient bandwidth for streaming quality
- Updated browser or app version
- Geographic availability restrictions

### 8.2 Service Interruptions
- Occasional maintenance or updates
- Technical difficulties beyond our control
- Content licensing changes
- No guarantee of uninterrupted service

### 8.3 Device Limitations
- Simultaneous streaming limits per plan
- Download limits on supported devices
- Geographic restrictions while traveling
- DRM protection may limit device compatibility

## 9. Termination

### 9.1 Cancellation by You
- Cancel anytime through account settings
- Service continues until end of billing period
- No refund for remaining subscription time
- Account data retained per our Privacy Policy

### 9.2 Termination by Us
- We may terminate for violations of these Terms
- We may suspend service for non-payment
- We may discontinue the service with notice
- Immediate termination for serious violations

## 10. Disclaimers and Limitations

### 10.1 Service Disclaimer
- Service provided "as is" and "as available"
- No warranties of uninterrupted service
- Content accuracy not guaranteed
- Third-party content beyond our control

### 10.2 Limitation of Liability
- Our liability is limited to subscription fees paid
- No liability for indirect or consequential damages
- Limitation applies to maximum extent permitted by law
- Some jurisdictions may not allow these limitations

## 11. Dispute Resolution

### 11.1 Governing Law
These Terms are governed by the laws of [Jurisdiction], without regard to conflict of law principles.

### 11.2 Arbitration
- Disputes resolved through binding arbitration
- Individual claims only, no class actions
- Arbitration conducted under [Arbitration Rules]
- Exception for small claims court

### 11.3 Informal Resolution
Before formal proceedings, we encourage contacting our support team to resolve issues informally.

## 12. General Provisions

### 12.1 Changes to Terms
- We may modify these Terms with notice
- Continued use constitutes acceptance
- Material changes require 30 days notice
- Previous versions archived for reference

### 12.2 Severability
If any provision is found unenforceable, the remainder remains in effect.

### 12.3 Entire Agreement
These Terms, along with our Privacy Policy, constitute the entire agreement between us.

### 12.4 Assignment
We may assign these Terms in connection with a merger, acquisition, or sale of assets.

## 13. Contact Information

For questions about these Terms, contact us:
- Email: legal@ottplatform.com
- Support: support@ottplatform.com
- Address: OTT Platform Legal Team, 123 Streaming Ave, Media City, MC 12345
- Phone: 1-800-OTT-HELP

---

*By using OTT Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.*`,
        effectiveDate: new Date('2024-01-01'),
        isActive: true,
        createdBy: 'legal@ottplatform.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('PrivacyPolicy', null, {});
    await queryInterface.bulkDelete('TermsConditions', null, {});
  }
};
