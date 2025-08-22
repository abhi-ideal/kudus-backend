
const request = require('supertest');
const app = require('../index');
const Support = require('../models/Support');
const PrivacyPolicy = require('../models/PrivacyPolicy');
const TermsConditions = require('../models/TermsConditions');
const sequelize = require('../config/database');

// Mock Firebase token verification
jest.mock('../middleware/auth', () => ({
  verifyFirebaseToken: (req, res, next) => {
    req.user = { email: 'admin@test.com', uid: 'test-uid' };
    next();
  }
}));

describe('Common Service - Support & Legal APIs', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Support.destroy({ where: {} });
    await PrivacyPolicy.destroy({ where: {} });
    await TermsConditions.destroy({ where: {} });
  });

  describe('Support/Contact Form APIs', () => {
    describe('POST /api/common/support', () => {
      it('should create a support ticket successfully', async () => {
        const ticketData = {
          name: 'John Doe',
          email: 'john.doe@example.com',
          subject: 'Test Support Request',
          message: 'This is a test support message with enough characters to pass validation.',
          category: 'technical'
        };

        const response = await request(app)
          .post('/api/common/support')
          .send(ticketData)
          .expect(201);

        expect(response.body.message).toBe('Support ticket created successfully');
        expect(response.body.ticket).toMatchObject({
          name: ticketData.name,
          email: ticketData.email,
          subject: ticketData.subject,
          category: ticketData.category,
          status: 'open'
        });

        // Verify in database
        const ticket = await Support.findByPk(response.body.ticket.id);
        expect(ticket).toBeTruthy();
        expect(ticket.message).toBe(ticketData.message);
      });

      it('should reject support ticket with missing required fields', async () => {
        const response = await request(app)
          .post('/api/common/support')
          .send({
            name: 'John Doe',
            email: 'john.doe@example.com'
            // missing subject and message
          })
          .expect(400);

        expect(response.body.error).toBe('Validation failed');
      });

      it('should reject support ticket with invalid email', async () => {
        const response = await request(app)
          .post('/api/common/support')
          .send({
            name: 'John Doe',
            email: 'invalid-email',
            subject: 'Test Subject',
            message: 'This is a test message with enough characters.'
          })
          .expect(400);

        expect(response.body.error).toBe('Validation failed');
      });
    });

    describe('GET /api/common/support', () => {
      beforeEach(async () => {
        await Support.bulkCreate([
          {
            name: 'User 1',
            email: 'user1@test.com',
            subject: 'Issue 1',
            message: 'Test message 1',
            category: 'technical',
            status: 'open'
          },
          {
            name: 'User 2',
            email: 'user2@test.com',
            subject: 'Issue 2',
            message: 'Test message 2',
            category: 'billing',
            status: 'resolved'
          }
        ]);
      });

      it('should get all support tickets', async () => {
        const response = await request(app)
          .get('/api/common/support')
          .expect(200);

        expect(response.body.tickets).toHaveLength(2);
        expect(response.body.total).toBe(2);
        expect(response.body.tickets[0]).not.toHaveProperty('adminResponse');
      });

      it('should filter support tickets by status', async () => {
        const response = await request(app)
          .get('/api/common/support?status=open')
          .expect(200);

        expect(response.body.tickets).toHaveLength(1);
        expect(response.body.tickets[0].status).toBe('open');
      });

      it('should filter support tickets by category', async () => {
        const response = await request(app)
          .get('/api/common/support?category=billing')
          .expect(200);

        expect(response.body.tickets).toHaveLength(1);
        expect(response.body.tickets[0].category).toBe('billing');
      });
    });

    describe('PUT /api/common/support/:id', () => {
      let ticketId;

      beforeEach(async () => {
        const ticket = await Support.create({
          name: 'Test User',
          email: 'test@example.com',
          subject: 'Test Subject',
          message: 'Test message',
          status: 'open'
        });
        ticketId = ticket.id;
      });

      it('should update support ticket status and add admin response', async () => {
        const updateData = {
          status: 'in_progress',
          priority: 'high',
          adminResponse: 'We are working on your issue.'
        };

        const response = await request(app)
          .put(`/api/common/support/${ticketId}`)
          .send(updateData)
          .expect(200);

        expect(response.body.message).toBe('Support ticket updated successfully');
        expect(response.body.ticket.status).toBe('in_progress');
        expect(response.body.ticket.adminResponse).toBe(updateData.adminResponse);
      });

      it('should set resolvedAt when status is resolved', async () => {
        const response = await request(app)
          .put(`/api/common/support/${ticketId}`)
          .send({ status: 'resolved' })
          .expect(200);

        expect(response.body.ticket.resolvedAt).toBeTruthy();
      });

      it('should return 404 for non-existent ticket', async () => {
        const response = await request(app)
          .put('/api/common/support/non-existent-id')
          .send({ status: 'resolved' })
          .expect(404);

        expect(response.body.error).toBe('Support ticket not found');
      });
    });
  });

  describe('Privacy Policy APIs', () => {
    describe('POST /api/common/privacy-policies', () => {
      it('should create privacy policy successfully', async () => {
        const policyData = {
          title: 'Test Privacy Policy',
          content: 'This is a test privacy policy content with sufficient length.',
          version: '1.0',
          effectiveDate: '2024-01-01',
          isActive: true
        };

        const response = await request(app)
          .post('/api/common/privacy-policies')
          .send(policyData)
          .expect(201);

        expect(response.body.message).toBe('Privacy policy created successfully');
        expect(response.body.privacyPolicy.title).toBe(policyData.title);
        expect(response.body.privacyPolicy.isActive).toBe(true);
      });

      it('should reject privacy policy with missing required fields', async () => {
        const response = await request(app)
          .post('/api/common/privacy-policies')
          .send({
            title: 'Test Policy'
            // missing content, version, effectiveDate
          })
          .expect(400);

        expect(response.body.error).toBe('Validation failed');
      });
    });

    describe('GET /api/common/privacy-policy', () => {
      it('should get active privacy policy', async () => {
        await PrivacyPolicy.create({
          title: 'Active Privacy Policy',
          content: 'This is the active privacy policy content.',
          version: '1.0',
          effectiveDate: new Date('2024-01-01'),
          isActive: true,
          createdBy: 'admin@test.com'
        });

        const response = await request(app)
          .get('/api/common/privacy-policy')
          .expect(200);

        expect(response.body.policy.title).toBe('Active Privacy Policy');
        expect(response.body.policy.isActive).toBe(true);
      });

      it('should return 404 when no active privacy policy exists', async () => {
        const response = await request(app)
          .get('/api/common/privacy-policy')
          .expect(404);

        expect(response.body.error).toBe('Privacy policy not found');
      });
    });

    describe('GET /api/common/privacy-policies', () => {
      beforeEach(async () => {
        await PrivacyPolicy.bulkCreate([
          {
            title: 'Policy 1',
            content: 'Content 1',
            version: '1.0',
            effectiveDate: new Date('2024-01-01'),
            isActive: true,
            createdBy: 'admin@test.com'
          },
          {
            title: 'Policy 2',
            content: 'Content 2',
            version: '1.1',
            effectiveDate: new Date('2024-02-01'),
            isActive: false,
            createdBy: 'admin@test.com'
          }
        ]);
      });

      it('should get all privacy policies', async () => {
        const response = await request(app)
          .get('/api/common/privacy-policies')
          .expect(200);

        expect(response.body.policies).toHaveLength(2);
        expect(response.body.total).toBe(2);
      });

      it('should filter privacy policies by active status', async () => {
        const response = await request(app)
          .get('/api/common/privacy-policies?active=true')
          .expect(200);

        expect(response.body.policies).toHaveLength(1);
        expect(response.body.policies[0].isActive).toBe(true);
      });
    });
  });

  describe('Terms and Conditions APIs', () => {
    describe('POST /api/common/terms-conditions', () => {
      it('should create terms and conditions successfully', async () => {
        const termsData = {
          title: 'Test Terms and Conditions',
          content: 'This is a test terms and conditions content with sufficient length.',
          version: '1.0',
          effectiveDate: '2024-01-01',
          isActive: true
        };

        const response = await request(app)
          .post('/api/common/terms-conditions')
          .send(termsData)
          .expect(201);

        expect(response.body.message).toBe('Terms and conditions created successfully');
        expect(response.body.termsConditions.title).toBe(termsData.title);
        expect(response.body.termsConditions.isActive).toBe(true);
      });
    });

    describe('GET /api/common/terms-conditions', () => {
      it('should get active terms and conditions', async () => {
        await TermsConditions.create({
          title: 'Active Terms and Conditions',
          content: 'This is the active terms and conditions content.',
          version: '1.0',
          effectiveDate: new Date('2024-01-01'),
          isActive: true,
          createdBy: 'admin@test.com'
        });

        const response = await request(app)
          .get('/api/common/terms-conditions')
          .expect(200);

        expect(response.body.terms.title).toBe('Active Terms and Conditions');
        expect(response.body.terms.isActive).toBe(true);
      });

      it('should return 404 when no active terms and conditions exist', async () => {
        const response = await request(app)
          .get('/api/common/terms-conditions')
          .expect(404);

        expect(response.body.error).toBe('Terms and conditions not found');
      });
    });
  });

  describe('Model Hooks', () => {
    it('should deactivate other privacy policies when creating a new active one', async () => {
      // Create first active policy
      await PrivacyPolicy.create({
        title: 'Policy 1',
        content: 'Content 1',
        version: '1.0',
        effectiveDate: new Date('2024-01-01'),
        isActive: true,
        createdBy: 'admin@test.com'
      });

      // Create second active policy
      await PrivacyPolicy.create({
        title: 'Policy 2',
        content: 'Content 2',
        version: '2.0',
        effectiveDate: new Date('2024-02-01'),
        isActive: true,
        createdBy: 'admin@test.com'
      });

      // Check that only the second policy is active
      const activePolicies = await PrivacyPolicy.findAll({ where: { isActive: true } });
      expect(activePolicies).toHaveLength(1);
      expect(activePolicies[0].title).toBe('Policy 2');
    });

    it('should deactivate other terms when creating a new active one', async () => {
      // Create first active terms
      await TermsConditions.create({
        title: 'Terms 1',
        content: 'Content 1',
        version: '1.0',
        effectiveDate: new Date('2024-01-01'),
        isActive: true,
        createdBy: 'admin@test.com'
      });

      // Create second active terms
      await TermsConditions.create({
        title: 'Terms 2',
        content: 'Content 2',
        version: '2.0',
        effectiveDate: new Date('2024-02-01'),
        isActive: true,
        createdBy: 'admin@test.com'
      });

      // Check that only the second terms is active
      const activeTerms = await TermsConditions.findAll({ where: { isActive: true } });
      expect(activeTerms).toHaveLength(1);
      expect(activeTerms[0].title).toBe('Terms 2');
    });
  });
});
