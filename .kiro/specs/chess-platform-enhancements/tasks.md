# Implementation Plan: Chess Platform Enhancements

## Overview

This implementation plan covers eight enhancement features for the Django chess competition platform. The features add comprehensive participant and match management, Swiss-style pairing, audit logging, knockout bracket visualization, and full authentication. Implementation follows Django best practices and maintains compatibility with the existing codebase (Django 4.2.11, DRF 3.14.0, SQLite).

## Tasks

- [x] 1. Set up database models and migrations
  - [x] 1.1 Create AuditLog model with all required fields
    - Add model with admin_user, action_type, timestamp, match, participant, previous_values, new_values, ip_address, user_agent fields
    - Add Meta class with ordering and indexes
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.10_
  
  - [ ]* 1.2 Write property test for AuditLog model
    - **Property 17: Audit Log Creation for Admin Actions**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  
  - [x] 1.3 Create UserProfile model with user and linked_participants fields
    - Add OneToOneField to User model
    - Add ManyToManyField to ChessParticipant
    - Add get_all_matches() method
    - _Requirements: 8.9, 8.10_
  
  - [x] 1.4 Add tournament_type field to ChessCompetition model
    - Add CharField with choices: swiss, knockout, round_robin
    - Set default to 'swiss'
    - _Requirements: 4.1, 7.1_
  
  - [x] 1.5 Create and run database migrations
    - Generate migrations for new models and field additions
    - Add database indexes for performance (lichess_username, competition+created_at, player1+created_at, player2+created_at)
    - Run migrations to update database schema
    - _Requirements: All_

- [-] 2. Implement participant management features
  - [x] 2.1 Create participant_list view with filtering and annotations
    - Implement view with @login_required and @user_passes_test decorators
    - Add filtering by competition and username (icontains)
    - Annotate queryset with match_count using Count aggregation
    - Order by registered_at descending
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.7_
  
  - [ ]* 2.2 Write property tests for participant list
    - **Property 1: Participant List Filtering Correctness**
    - **Property 3: Participant List Ordering Invariant**
    - **Property 4: Participant List Count Accuracy**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.7**
  
  - [x] 2.3 Create participant_list.html template
    - Display table with lichess_username, competition name, join date, match count columns
    - Add filter form for competition and username
    - Display total count of participants
    - Add click handler to navigate to participant history
    - Apply dark theme with orange accent (#ff6b35)
    - _Requirements: 1.2, 1.6, 1.7_
  
  - [ ]* 2.4 Write unit tests for participant list view
    - Test admin access requirement
    - Test filtering by competition
    - Test filtering by username
    - Test empty participant list
  
  - [x] 2.5 Create participant_history view with statistics calculation
    - Implement view to fetch all matches for participant (Q objects for player1 OR player2)
    - Calculate wins, losses, draws, total matches, win percentage
    - Order matches by created_at descending
    - _Requirements: 2.1, 2.3, 2.5, 2.6, 2.7_
  
  - [ ]* 2.6 Write property tests for participant history
    - **Property 5: Match History Completeness**
    - **Property 6: Match History Statistics Accuracy**
    - **Property 7: Match History Ordering Invariant**
    - **Validates: Requirements 2.3, 2.5, 2.6, 2.7**
  
  - [x] 2.7 Create participant_history.html template
    - Display participant username and competition name
    - Display statistics panel with wins, losses, draws, total, win percentage
    - Display matches table with opponent, result, date, Lichess URL columns
    - Handle empty matches case with appropriate message
    - _Requirements: 2.2, 2.4, 2.8_

- [ ] 3. Implement My Matches public page
  - [ ] 3.1 Create my_matches view for public access
    - Implement view without authentication requirement
    - Accept lichess_username from GET parameter
    - Find all participants with matching username (case-insensitive)
    - Group matches by competition
    - Calculate overall statistics across all competitions
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.7_
  
  - [ ]* 3.2 Write property tests for my matches
    - **Property 8: My Matches Cross-Competition Completeness**
    - **Property 9: My Matches Grouping Correctness**
    - **Property 10: My Matches Within-Group Ordering**
    - **Validates: Requirements 3.3, 3.7, 3.8**
  
  - [ ] 3.3 Create my_matches.html template
    - Display username input form
    - Display overall statistics panel
    - Display matches grouped by competition
    - Show competition name, opponent, result, date, Lichess URL for each match
    - Handle participant not found case with appropriate message
    - Order matches by date descending within each competition
    - _Requirements: 3.2, 3.4, 3.6, 3.8_
  
  - [ ]* 3.4 Write unit tests for my matches view
    - Test with valid username
    - Test with non-existent username
    - Test with username in multiple competitions
    - Test statistics calculation

- [ ] 4. Implement Swiss-style pairing system
  - [ ] 4.1 Create calculate_participant_score utility function
    - Implement function to calculate Swiss score: wins * 1.0 + draws * 0.5
    - Filter matches by participant (player1 OR player2) and competition
    - Only count completed matches
    - _Requirements: 4.6_
  
  - [ ]* 4.2 Write property test for score calculation
    - **Property 11: Swiss Pairing Score Calculation**
    - **Validates: Requirements 4.6**
  
  - [ ] 4.3 Create generate_swiss_pairings utility function
    - Calculate scores for all participants
    - Sort participants by score descending
    - Get existing pairings to prevent rematches
    - Pair participants sequentially (1st with 2nd, 3rd with 4th, etc.)
    - Assign bye to lowest-ranked participant if odd number
    - Raise ValueError if no valid pairings exist or less than 2 participants
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.8, 4.9_
  
  - [ ]* 4.4 Write property tests for Swiss pairing
    - **Property 12: Swiss Pairing Ranking Order**
    - **Property 13: Swiss Pairing Sequential Pairing**
    - **Property 14: Swiss Pairing Bye Assignment**
    - **Property 15: Swiss Pairing Rematch Prevention**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.8**
  
  - [ ] 4.5 Create swiss_pairing view with transaction handling
    - Implement view with @login_required and @user_passes_test decorators
    - Call generate_swiss_pairings to preview pairings (GET request)
    - Create match records for all pairings (POST request)
    - Increment round_number based on max existing round
    - Create audit log entries for each pairing
    - Use @transaction.atomic for rollback on error
    - Display success/error messages
    - _Requirements: 4.1, 4.7, 4.10, 5.1_
  
  - [ ]* 4.6 Write property test for match creation
    - **Property 16: Swiss Pairing Match Creation**
    - **Validates: Requirements 4.7**
  
  - [ ] 4.7 Create swiss_pairing.html template
    - Display competition name and current round number
    - Display preview table of proposed pairings with player names and scores
    - Add confirmation button to create pairings
    - Display bye assignments clearly
    - _Requirements: 4.10_
  
  - [ ]* 4.8 Write unit tests for Swiss pairing
    - Test with even number of participants
    - Test with odd number of participants (bye assignment)
    - Test rematch prevention
    - Test error handling for insufficient participants
    - Test transaction rollback on error

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement audit logging system
  - [ ] 6.1 Create AuditLoggingMiddleware
    - Implement middleware to capture IP address and user agent
    - Store audit context in request.audit_context
    - _Requirements: 5.4_
  
  - [ ] 6.2 Create log_audit_action utility function
    - Implement function to create AuditLog entries
    - Accept request, action_type, match, participant, previous_values, new_values parameters
    - Extract IP address and user agent from request.audit_context
    - Only log for authenticated staff users
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 6.3 Write property test for audit log entry completeness
    - **Property 18: Audit Log Entry Completeness**
    - **Validates: Requirements 5.4**
  
  - [ ] 6.4 Create AuditedMatchForm with audit logging
    - Extend ModelForm for ChessMatch
    - Override save() method to track changes
    - Capture previous_values for updates
    - Capture new_values for creates and updates
    - Call log_audit_action after save
    - _Requirements: 5.1, 5.2_
  
  - [ ] 6.5 Create audit_log_list view with filtering
    - Implement view with @login_required and @user_passes_test decorators
    - Add filtering by admin username, action_type, date_from, date_to
    - Order by timestamp descending
    - _Requirements: 5.5, 5.6, 5.7, 5.8, 5.9_
  
  - [ ]* 6.6 Write property tests for audit log
    - **Property 19: Audit Log Filtering Correctness**
    - **Property 20: Audit Log Ordering Invariant**
    - **Property 21: Audit Log Immutability**
    - **Validates: Requirements 5.6, 5.7, 5.8, 5.9, 5.10**
  
  - [ ] 6.7 Create audit_log.html template
    - Display table with admin username, action type, timestamp, match/participant info, changes columns
    - Add filter form for admin, action type, date range
    - Display previous and new values in readable format
    - _Requirements: 5.5_
  
  - [ ]* 6.8 Write unit tests for audit logging
    - Test audit log creation on match create
    - Test audit log creation on match update
    - Test audit log creation on match delete
    - Test filtering by admin
    - Test filtering by action type
    - Test filtering by date range

- [ ] 7. Implement match list page
  - [ ] 7.1 Create match_list view with comprehensive filtering
    - Implement view with @login_required and @user_passes_test decorators
    - Add filtering by competition, participant (username icontains), result, date_from, date_to
    - Use Q objects for participant filter (player1 OR player2)
    - Order by created_at descending
    - _Requirements: 6.1, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [ ]* 7.2 Write property tests for match list
    - **Property 22: Match List Filtering Correctness**
    - **Property 24: Match List Ordering Invariant**
    - **Property 25: Match List Count Accuracy**
    - **Validates: Requirements 6.3, 6.4, 6.5, 6.6, 6.7, 6.8**
  
  - [ ] 7.3 Create match_list.html template
    - Display table with date, competition, white player, black player, result, Lichess URL columns
    - Add filter form for competition, participant, result, date range
    - Display total count of matches
    - Add click handler to display match details
    - _Requirements: 6.2, 6.8, 6.9_
  
  - [ ]* 7.4 Write unit tests for match list view
    - Test admin access requirement
    - Test filtering by competition
    - Test filtering by participant
    - Test filtering by result
    - Test filtering by date range
    - Test combined filters

- [ ] 8. Implement knockout bracket visualization
  - [ ] 8.1 Create build_bracket_structure utility function
    - Calculate bracket size as next power of 2 from participant count
    - Organize matches by round number
    - Calculate number of rounds: ceil(log2(bracket_size))
    - Generate round labels: Finals, Semifinals, Quarterfinals, Round N
    - Calculate bye count: next_power_of_2 - participant_count
    - _Requirements: 7.2, 7.5, 7.7, 7.8_
  
  - [ ]* 8.2 Write property tests for bracket structure
    - **Property 26: Knockout Bracket Tree Structure**
    - **Property 27: Knockout Bracket Round Labeling**
    - **Property 28: Knockout Bracket Bye Assignment**
    - **Validates: Requirements 7.2, 7.7, 7.8**
  
  - [ ] 8.3 Create knockout_bracket view
    - Implement view accessible to all users (no authentication required)
    - Check competition.tournament_type == 'knockout'
    - Call build_bracket_structure to get bracket data
    - Display warning and redirect if not knockout tournament
    - _Requirements: 7.1_
  
  - [ ] 8.4 Create knockout_bracket.html template with tree visualization
    - Display bracket as tree structure with rounds
    - Show participant names for completed and upcoming matches
    - Show match results for completed matches
    - Show empty slots for undetermined matches
    - Display round labels (Finals, Semifinals, etc.)
    - Highlight winner when competition is complete
    - Add click handler to display match details
    - Use CSS for bracket layout (flexbox or grid)
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.8, 7.9, 7.10_
  
  - [ ]* 8.5 Write unit tests for knockout bracket
    - Test bracket with 4 participants
    - Test bracket with 8 participants
    - Test bracket with non-power-of-2 participants (byes)
    - Test round labeling
    - Test winner highlighting

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement authentication system
  - [ ] 10.1 Create user registration view
    - Use Django's UserCreationForm
    - Create UserProfile automatically on registration
    - Log in user after successful registration
    - Display validation errors for duplicate email/username
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ]* 10.2 Write property tests for registration
    - **Property 29: User Registration Email Uniqueness**
    - **Property 30: User Registration Username Uniqueness**
    - **Property 31: Password Hashing**
    - **Validates: Requirements 8.2, 8.3, 8.4**
  
  - [ ] 10.3 Create register.html template
    - Display registration form with username, email, password, password confirmation fields
    - Display validation errors clearly
    - Add link to login page
    - _Requirements: 8.1_
  
  - [ ] 10.4 Create user_login view
    - Use Django's AuthenticationForm
    - Support login with username or email
    - Create authenticated session on success
    - Display error message on failure
    - Redirect to 'next' parameter or dashboard
    - _Requirements: 8.5, 8.6, 8.7_
  
  - [ ]* 10.5 Write property tests for authentication
    - **Property 32: Authentication Session Creation**
    - **Property 33: Authentication Failure Handling**
    - **Property 34: Logout Session Termination**
    - **Validates: Requirements 8.6, 8.7, 8.8**
  
  - [ ] 10.6 Create login.html template
    - Display login form with username/email and password fields
    - Display error messages
    - Add links to registration and password reset pages
    - _Requirements: 8.5_
  
  - [ ] 10.7 Create user_logout view
    - Call Django's logout() function
    - Display success message
    - Redirect to competition list
    - _Requirements: 8.8_
  
  - [ ] 10.8 Create link_participant view and form
    - Implement view with @login_required decorator
    - Accept lichess_username from POST request
    - Find all participants with matching username (case-insensitive)
    - Add participants to user's profile.linked_participants
    - Display success message with count or error if not found
    - _Requirements: 8.9_
  
  - [ ]* 10.9 Write property test for participant linking
    - **Property 35: Participant Linking**
    - **Validates: Requirements 8.9**
  
  - [ ] 10.10 Create link_participant.html template
    - Display form with lichess_username input field
    - Display list of currently linked participants
    - Add unlink button for each linked participant
    - _Requirements: 8.9_
  
  - [ ] 10.11 Create dashboard view for authenticated users
    - Implement view with @login_required decorator
    - Get user's linked participants
    - Get recent 20 matches for linked participants using profile.get_all_matches()
    - Get competitions containing linked participants
    - _Requirements: 8.10, 8.11_
  
  - [ ] 10.12 Create dashboard.html template
    - Display welcome message with username
    - Display linked participants section
    - Display recent matches table
    - Display competitions list
    - Add link to link participant page
    - _Requirements: 8.11, 8.15_
  
  - [ ]* 10.13 Write unit tests for authentication system
    - Test registration with duplicate email
    - Test registration with duplicate username
    - Test password hashing
    - Test login with valid credentials
    - Test login with invalid credentials
    - Test logout
    - Test participant linking
    - Test dashboard displays correct data

- [ ] 11. Implement authorization and security
  - [ ] 11.1 Add admin authorization checks to all admin views
    - Ensure all admin views have @login_required and @user_passes_test(lambda u: u.is_staff) decorators
    - Views: participant_list, participant_history, match_list, audit_log_list, swiss_pairing
    - _Requirements: 8.12_
  
  - [ ]* 11.2 Write property tests for authorization
    - **Property 36: Admin Page Authorization**
    - **Property 37: Protected Page Authentication**
    - **Validates: Requirements 8.12, 8.13**
  
  - [ ] 11.3 Create custom 403 error handler
    - Implement permission_denied_view function
    - Create 403.html template with user-friendly message
    - Register handler in urls.py
    - _Requirements: 8.12_
  
  - [ ] 11.4 Add authentication redirect for protected pages
    - Ensure @login_required decorator redirects to login page
    - Preserve 'next' parameter for post-login redirect
    - _Requirements: 8.13_
  
  - [ ] 11.5 Implement password reset functionality
    - Use Django's built-in password reset views
    - Configure email backend for password reset emails
    - Create password reset templates
    - _Requirements: 8.14_
  
  - [ ]* 11.6 Write unit tests for authorization
    - Test non-staff user cannot access admin pages
    - Test unauthenticated user redirected to login
    - Test authenticated user can access dashboard
    - Test password reset flow

- [ ] 12. Update URL configuration and navigation
  - [ ] 12.1 Add all new URL patterns to urls.py
    - Add participant management URLs
    - Add my matches URL
    - Add match list URL
    - Add Swiss pairing URL
    - Add audit log URL
    - Add knockout bracket URL
    - Add authentication URLs (register, login, logout, dashboard, link-participant, password-reset)
    - _Requirements: All_
  
  - [ ] 12.2 Update base template with navigation links
    - Add navigation menu with links to all new pages
    - Show admin-only links conditionally (if user.is_staff)
    - Show authenticated user links conditionally (if user.is_authenticated)
    - Display username in navigation bar when authenticated
    - Add logout link for authenticated users
    - _Requirements: 8.15_
  
  - [ ] 12.3 Add navigation breadcrumbs to all templates
    - Add breadcrumb navigation to help users understand page hierarchy
    - Include links back to parent pages
    - _Requirements: Non-functional usability requirement_

- [ ] 13. Apply styling and theme consistency
  - [ ] 13.1 Update CSS for all new templates
    - Apply dark theme with orange accent color (#ff6b35)
    - Ensure consistent styling across all pages
    - Style forms, tables, buttons, and navigation elements
    - Add responsive design for mobile devices
    - _Requirements: Non-functional usability requirement_
  
  - [ ] 13.2 Add loading indicators and user feedback
    - Add loading spinners for long operations (Swiss pairing)
    - Add success/error message styling
    - Add confirmation dialogs for destructive actions
    - _Requirements: Non-functional usability requirement_

- [ ] 14. Performance optimization
  - [ ] 14.1 Add database indexes via migration
    - Add index on ChessParticipant.lichess_username
    - Add composite index on ChessMatch (competition, created_at)
    - Add composite index on ChessMatch (player1, created_at)
    - Add composite index on ChessMatch (player2, created_at)
    - Verify AuditLog indexes are created
    - _Requirements: Non-functional performance requirements_
  
  - [ ] 14.2 Optimize queries with select_related and prefetch_related
    - Add select_related for foreign keys in all list views
    - Add prefetch_related for many-to-many relationships
    - Test query count with Django Debug Toolbar
    - _Requirements: Non-functional performance requirements_
  
  - [ ]* 14.3 Write performance tests
    - Test participant list loads within 2 seconds for 1000 participants
    - Test match list loads within 2 seconds for 5000 matches
    - Test Swiss pairing completes within 5 seconds for 100 participants

- [ ] 15. Error handling and validation
  - [ ] 15.1 Add comprehensive form validation
    - Validate players are different in match form
    - Validate players are from same competition
    - Validate winner is one of the players
    - Display user-friendly error messages
    - _Requirements: Non-functional usability requirement_
  
  - [ ] 15.2 Add error handling to Swiss pairing
    - Handle insufficient participants error
    - Handle no valid pairings error
    - Use transaction rollback on error
    - Display clear error messages to user
    - _Requirements: 4.9_
  
  - [ ] 15.3 Add error handling to all views
    - Catch and handle database errors gracefully
    - Catch and handle validation errors
    - Log unexpected errors for debugging
    - Display user-friendly error messages
    - _Requirements: Non-functional usability requirement_
  
  - [ ]* 15.4 Write unit tests for error handling
    - Test form validation errors
    - Test Swiss pairing errors
    - Test database integrity errors
    - Test permission denied errors

- [ ] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Integration and final wiring
  - [ ] 17.1 Update settings.py configuration
    - Add AuditLoggingMiddleware to MIDDLEWARE
    - Configure authentication backends
    - Configure email backend for password reset
    - Add new templates directory to TEMPLATES
    - _Requirements: All_
  
  - [ ] 17.2 Create initial data fixtures (optional)
    - Create fixture for sample competitions
    - Create fixture for sample participants
    - Create fixture for sample matches
    - Useful for development and testing
  
  - [ ] 17.3 Update admin.py for new models
    - Register AuditLog model with read-only admin
    - Register UserProfile model with inline participant linking
    - Add filters and search fields for better admin experience
    - _Requirements: 5.5_
  
  - [ ]* 17.4 Write integration tests
    - Test complete user registration and login flow
    - Test complete Swiss pairing workflow
    - Test complete participant linking workflow
    - Test navigation between all pages
  
  - [ ] 17.5 Manual testing and verification
    - Test all features in development environment
    - Verify all requirements are met
    - Test with different user roles (admin, authenticated, anonymous)
    - Test error cases and edge cases
    - Verify performance meets requirements

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at reasonable breaks
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples, edge cases, and error conditions
- All admin pages require authentication and staff privileges
- All public pages (my matches, knockout bracket) work without authentication
- The implementation maintains compatibility with existing models and Lichess integration
- Dark theme with orange accent (#ff6b35) is applied consistently across all new pages
