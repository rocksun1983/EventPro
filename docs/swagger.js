/**
 * @openapi
 * openapi: 3.0.0
 * info:
 *   title: EventPro API
 *   version: 1.0.0
 *   description: API documentation for EventPro.
 * servers:
 *   - url: /api
 * tags:
 *   - name: Auth
 *   - name: Events
 *   - name: Attendees
 *   - name: Check-in
 *   - name: Vendors
 *   - name: Admin
 *   - name: Dashboard
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         error:
 *           type: string
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         total:
 *           type: integer
 *         pages:
 *           type: integer
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *           nullable: true
 *         smsEnabled:
 *           type: boolean
 *         role:
 *           type: string
 *           enum: [user, organizer, admin]
 *         isVerified:
 *           type: boolean
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *         message:
 *           type: string
 *     Event:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         date:
 *           type: string
 *           format: date-time
 *         location:
 *           type: string
 *         expectedAttendees:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [draft, published, cancelled, completed]
 *         organizer:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *     EventListResponse:
 *       type: object
 *       properties:
 *         events:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Event'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *     Vendor:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         serviceType:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         assignedEvent:
 *           type: string
 *     AttendeeImportProgress:
 *       type: object
 *       properties:
 *         totalRows:
 *           type: integer
 *         processedRows:
 *           type: integer
 *         percent:
 *           type: integer
 *     AttendeeImportSummary:
 *       type: object
 *       properties:
 *         totalRows:
 *           type: integer
 *         successful:
 *           type: integer
 *         failed:
 *           type: integer
 *         duplicates:
 *           type: integer
 *     AttendeeImportError:
 *       type: object
 *       properties:
 *         row:
 *           type: integer
 *         field:
 *           type: string
 *         message:
 *           type: string
 *     AttendeeImportDuplicate:
 *       type: object
 *       properties:
 *         row:
 *           type: integer
 *         name:
 *           type: string
 *         fields:
 *           type: array
 *           items:
 *             type: string
 *     AttendeeImportStatus:
 *       type: object
 *       properties:
 *         importId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [queued, processing, completed, failed]
 *         progress:
 *           $ref: '#/components/schemas/AttendeeImportProgress'
 *     AttendeeImportResult:
 *       type: object
 *       properties:
 *         importId:
 *           type: string
 *         status:
 *           type: string
 *         summary:
 *           $ref: '#/components/schemas/AttendeeImportSummary'
 *         duplicates:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AttendeeImportDuplicate'
 *         errors:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AttendeeImportError'
 *     CheckinTemplate:
 *       type: object
 *       properties:
 *         template:
 *           type: string
 *     CheckinPreviewRequest:
 *       type: object
 *       required: [attendeeId]
 *       properties:
 *         attendeeId:
 *           type: string
 *         template:
 *           type: string
 *         checkInNumber:
 *           type: string
 *     CheckinPreviewResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *     CheckinGenerateResponse:
 *       type: object
 *       properties:
 *         generated:
 *           type: integer
 *         skipped:
 *           type: integer
 *     CheckinSendRequest:
 *       type: object
 *       properties:
 *         template:
 *           type: string
 *         checkInNumber:
 *           type: string
 *     CheckinSendStatus:
 *       type: object
 *       properties:
 *         sendId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [queued, processing, completed, failed]
 *         progress:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             processed:
 *               type: integer
 *             percent:
 *               type: integer
 *     CheckinSendResult:
 *       type: object
 *       properties:
 *         sendId:
 *           type: string
 *         status:
 *           type: string
 *         summary:
 *           type: object
 *           properties:
 *             sent:
 *               type: integer
 *             failed:
 *               type: integer
 *         failed:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               error:
 *                 type: string
 *
 * /auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password]
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Resend verification email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification email sent (or queued)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /auth/reset-password/{token}:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password for authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     tags: [Auth]
 *     summary: Update current user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               smsEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *
 * /events:
 *   get:
 *     tags: [Events]
 *     summary: List events
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: organizer
 *         schema:
 *           type: string
 *       - in: query
 *         name: upcoming
 *         schema:
 *           type: string
 *           enum: [true, false]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventListResponse'
 *   post:
 *     tags: [Events]
 *     summary: Create event
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, date, location]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               expectedAttendees:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [draft, published, cancelled, completed]
 *     responses:
 *       201:
 *         description: Event created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *
 * /events/{id}:
 *   get:
 *     tags: [Events]
 *     summary: Get event by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     tags: [Events]
 *     summary: Update event
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               expectedAttendees:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [draft, published, cancelled, completed]
 *     responses:
 *       200:
 *         description: Event updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *   delete:
 *     tags: [Events]
 *     summary: Delete event
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *
 * /events/organizer/my-events:
 *   get:
 *     tags: [Events]
 *     summary: List events for current organizer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: upcoming
 *         schema:
 *           type: string
 *           enum: [true, false]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventListResponse'
 *
 * /events/{eventId}/attendees/imports:
 *   post:
 *     tags: [Attendees]
 *     summary: Upload attendees file for import
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       202:
 *         description: Import queued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 importId:
 *                   type: string
 *                 status:
 *                   type: string
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /events/{eventId}/attendees/imports/{importId}:
 *   get:
 *     tags: [Attendees]
 *     summary: Get attendee import status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: importId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Import status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AttendeeImportStatus'
 *
 * /events/{eventId}/attendees/imports/{importId}/result:
 *   get:
 *     tags: [Attendees]
 *     summary: Get attendee import result
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: importId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Import result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AttendeeImportResult'
 *
 * /events/{eventId}/attendees/imports/{importId}/duplicates.csv:
 *   get:
 *     tags: [Attendees]
 *     summary: Download duplicates CSV
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: importId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *
 * /events/{eventId}/attendees/imports/template:
 *   get:
 *     tags: [Attendees]
 *     summary: Download attendee import template
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, xlsx]
 *     responses:
 *       200:
 *         description: Template file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *
 * /events/{eventId}/checkin/template:
 *   get:
 *     tags: [Check-in]
 *     summary: Get default check-in message template
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckinTemplate'
 *
 * /events/{eventId}/checkin/preview:
 *   post:
 *     tags: [Check-in]
 *     summary: Preview check-in message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckinPreviewRequest'
 *     responses:
 *       200:
 *         description: Preview message
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckinPreviewResponse'
 *
 * /events/{eventId}/checkin/generate:
 *   post:
 *     tags: [Check-in]
 *     summary: Generate check-in codes for attendees
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Codes generated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckinGenerateResponse'
 *
 * /events/{eventId}/checkin/send:
 *   post:
 *     tags: [Check-in]
 *     summary: Send check-in instructions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckinSendRequest'
 *     responses:
 *       202:
 *         description: Send queued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sendId:
 *                   type: string
 *                 status:
 *                   type: string
 *
 * /events/{eventId}/checkin/send/{sendId}:
 *   get:
 *     tags: [Check-in]
 *     summary: Get check-in send status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sendId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Send status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckinSendStatus'
 *
 * /events/{eventId}/checkin/send/{sendId}/result:
 *   get:
 *     tags: [Check-in]
 *     summary: Get check-in send result
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sendId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Send result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckinSendResult'
 *
 * /vendors:
 *   get:
 *     tags: [Vendors]
 *     summary: List vendors
 *     responses:
 *       200:
 *         description: Vendor list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vendor'
 *   post:
 *     tags: [Vendors]
 *     summary: Create vendor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Vendor'
 *     responses:
 *       200:
 *         description: Vendor created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vendor'
 *
 * /admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Admin dashboard ping
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *
 * /admin/organizers:
 *   get:
 *     tags: [Admin]
 *     summary: List organizers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Organizer list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 organizers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalOrganizers:
 *                       type: integer
 *                     verifiedOrganizers:
 *                       type: integer
 *                     smsEnabledOrganizers:
 *                       type: integer
 *
 * /admin/organizers/{organizerId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get organizer details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Organizer details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 organizer:
 *                   $ref: '#/components/schemas/User'
 *                 recentEvents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *
 * /admin/organizers/{organizerId}/status:
 *   put:
 *     tags: [Admin]
 *     summary: Update organizer status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isVerified:
 *                 type: boolean
 *               smsEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 organizer:
 *                   $ref: '#/components/schemas/User'
 *
 * /admin/organizers/{organizerId}/reset-password:
 *   put:
 *     tags: [Admin]
 *     summary: Reset organizer password
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 organizer:
 *                   $ref: '#/components/schemas/User'
 *
 * /admin/sms/config:
 *   get:
 *     tags: [Admin]
 *     summary: Get SMS configuration
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SMS configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accountSid:
 *                   type: string
 *                 authToken:
 *                   type: string
 *                 phoneNumber:
 *                   type: string
 *                 isConfigured:
 *                   type: boolean
 *
 * /admin/sms/test:
 *   post:
 *     tags: [Admin]
 *     summary: Send SMS test
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber]
 *             properties:
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: SMS sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 sid:
 *                   type: string
 *
 * /admin/sms/user-settings:
 *   put:
 *     tags: [Admin]
 *     summary: Update user SMS settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *               phone:
 *                 type: string
 *               smsEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User SMS updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     smsEnabled:
 *                       type: boolean
 *
 * /admin/sms/users:
 *   get:
 *     tags: [Admin]
 *     summary: List users with SMS enabled
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *
 * /dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard stats
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                 totalEvents:
 *                   type: integer
 *                 totalVendors:
 *                   type: integer
 */
