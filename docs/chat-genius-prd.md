# First Response

### **User Stories for General Users**

1. As a General User, I need to send real-time messages in channels and DMs so that I can communicate with team members instantly.
2. As a General User, I need to participate in threaded conversations to keep discussions on specific topics organized.
3. As a General User, I need to search through messages and files so that I can quickly find relevant information.
4. As a General User, I need to share files in channels and DMs so that I can collaborate effectively.
5. As a General User, I need to react to messages with emojis so that I can quickly express my opinions or emotions.
6. As a General User, I need to see user presence and status indicators so that I know when teammates are available to communicate.
7. As a General User, I need to update my presence and status so that others can see my availability or current activity.
8. As a General User, I need to join channels to participate in discussions relevant to my team or project.
9. As a General User, I need to leave channels that are no longer relevant to me so that I can focus on important discussions.

### **User Stories for Admins**

1. As an Admin, I need to add new users to the system so that they can join team discussions and workflows.
2. As an Admin, I need to remove users from the system so that inactive or unauthorized users no longer have access.
3. As an Admin, I need to create new channels so that team members can have dedicated spaces for specific discussions.
4. As an Admin, I need to delete channels so that unused or outdated channels do not clutter the workspace.
5. As an Admin, I need to assign or revoke permissions for General Users so that access can be managed appropriately for security and workflow.
6. As an Admin, I need to manage a user’s presence or status in certain cases to reflect their activity or remove outdated information.
7. As an Admin, I need to monitor user participation and activity in channels so that I can ensure productive collaboration and engagement.
8. As an Admin, I need to set channel-specific permissions so that sensitive discussions are limited to authorized users.
9. As an Admin, I need to configure default workspace settings so that new users have a consistent and productive starting experience.

These user stories will guide the design of workflows and permissions for both roles.

### **Data Models with Fields and Relationships**

#### **1. User Model**

- **Fields**: `id` (UUID, primary key), `email` (string, unique), `name` (string), `bio` (string, nullable), `avatar_url` (string), `status` (enum: "online", "offline", "away", "dnd"), `status_message` (string, max 25 chars, nullable), `status_emoji` (string, nullable), `role` (enum: "admin", "user"), `created_at` (timestamp), `updated_at` (timestamp).
- **Relationships**: One-to-Many with Messages (a user can send many messages), Many-to-Many with Channels via `ChannelMembers`.

#### **2. Channel Model**

- **Fields**: `id` (UUID, primary key), `name` (string, unique), `description` (string), `is_private` (boolean), `created_by` (foreign key to `User.id`), `created_at` (timestamp), `updated_at` (timestamp).
- **Relationships**: Many-to-Many with Users via `ChannelMembers`, One-to-Many with Messages (a channel has many messages).

#### **3. ChannelMembers Model**

- **Fields**: `id` (UUID, primary key), `channel_id` (foreign key to `Channel.id`), `user_id` (foreign key to `User.id`), `role_in_channel` (enum: "member", "admin"), `joined_at` (timestamp).
- **Relationships**: Joins Users and Channels for Many-to-Many relationships.

#### **4. Message Model**

- **Fields**: `id` (UUID, primary key), `content` (text), `created_at` (timestamp), `updated_at` (timestamp), `channel_id` (foreign key to `Channel.id`), `user_id` (foreign key to `User.id`), `parent_id` (nullable foreign key to `Message.id` for threads).
- **Relationships**: Many-to-One with Channels, Many-to-One with Users, Self-referential relationship for threaded replies.

#### **5. File Model**

- **Fields**: `id` (UUID, primary key), `url` (string), `uploaded_by` (foreign key to `User.id`), `message_id` (foreign key to `Message.id`), `uploaded_at` (timestamp).
- **Relationships**: One-to-One with Messages, Many-to-One with Users.

---

### **Core Functionality Requirements**

#### **For General Users**

1. Users should send messages in channels or DMs, requiring real-time WebSocket connections to broadcast new messages linked to the `Message` and `Channel` models.
2. Users should search for messages or files using a search feature indexed on `Message.content` and `File.url`.
3. Users should join channels by being added to the `ChannelMembers` table with the `member` role.

#### **For Admins**

1. Admins should create or delete channels, which involves inserting or deleting rows in the `Channel` table.
2. Admins should add or remove users from channels, updating the `ChannelMembers` table accordingly.
3. Admins should assign or revoke permissions by updating the `role` in the `User` or `ChannelMembers` tables.

---

### **Authorization Requirements with Supabase Auth**

#### **For General Users**

1. Users must be authenticated via Supabase Auth before accessing any system functionality.
2. Users can only send messages in channels they belong to, verified via Row Level Security (RLS) policies.
3. Users can only view private channels they are members of, enforced by RLS policies on the channels table.

#### **For Admins**

1. Admins must have their `role` field in the `User` table set to `admin` to perform admin functions.
2. Admin actions such as creating channels or managing permissions should be verified through RLS policies.
3. Admins should manage channel-specific permissions by updating the `role_in_channel` field in the `ChannelMembers` table.

This design ensures clear data relationships, role-based access control, and efficient implementation with Next.js, Postgres, and Supabase.

### **1. API Routes with HTTP Methods and Auth Requirements**

#### **User Routes**

1. `GET /api/users/me`: Returns the authenticated user's data; requires Clerk authentication.
2. `GET /api/users/:id`: Fetches user details by ID; requires Clerk authentication.
3. `PUT /api/users/status`: Updates the user's status; requires Clerk authentication.

#### **Channel Routes**

4. `GET /api/channels`: Fetches all channels the authenticated user is a member of; requires Clerk authentication.
5. `POST /api/channels`: Creates a new channel; requires Clerk authentication and admin role.
6. `DELETE /api/channels/:id`: Deletes a channel by ID; requires Clerk authentication and admin role.
7. `POST /api/channels/:id/members`: Adds a user to a channel; requires Clerk authentication and admin role.
8. `DELETE /api/channels/:id/members/:userId`: Removes a user from a channel; requires Clerk authentication and admin role.

#### **Message Routes**

9. `GET /api/channels/:id/messages`: Fetches all messages in a channel; requires Clerk authentication and channel membership.
10. `POST /api/channels/:id/messages`: Sends a new message to a channel; requires Clerk authentication and channel membership.
11. `GET /api/messages/search`: Searches messages by content or file metadata; requires Clerk authentication.

#### **File Routes**

12. `POST /api/files/upload`: Uploads a file to the system; requires Clerk authentication and channel membership.
13. `GET /api/files/:id`: Retrieves file metadata and download URL; requires Clerk authentication and access validation.

---

### **2. Page Structure and Components Needed**

#### **Page Structure**

1. **Home Page (`/`)**: Displays the workspace and user’s available channels.
2. **Channel Page (`/channels/:id`)**: Displays messages, threads, and file uploads for a specific channel.
3. **DM Page (`/dm/:id`)**: Shows a private conversation between two users.
4. **Search Page (`/search`)**: Allows users to search across messages and files.
5. **Admin Dashboard (`/admin`)**: Provides channel and user management tools for admins.

#### **Component Hierarchy**

1. **Header**: Displays the app logo, user avatar, and status toggle.
2. **Sidebar**: Lists channels and DMs available to the user.
3. **ChannelView**: Displays messages, threads, and file upload components for a channel.
4. **MessageInput**: Allows users to send messages and attach files.
5. **ThreadView**: Displays threaded replies for a selected message.
6. **SearchResults**: Lists messages and files matching search queries.
7. **AdminTools**: Includes forms for adding/removing channels and managing user permissions.

---

### **3. Key Middleware Functions**

#### **Authentication Middleware**

1. `requireAuth`: Verifies the user is authenticated using Clerk before accessing any route.
2. `requireAdmin`: Ensures the user has an admin role before performing admin-level operations.

#### **Channel Membership Middleware**

3. `validateChannelMembership`: Checks that the user is a member of the channel for actions like sending messages or accessing files.

#### **Request Validation Middleware**

4. `validateRequest`: Ensures incoming API requests have all required fields and adhere to the expected schema.

#### **Error Handling Middleware**

5. `handleErrors`: Catches and formats errors consistently across all API endpoints.

This system architecture ensures secure, modular, and scalable implementation with clear separation of concerns between front-end pages, API endpoints, and middleware.

### **Project Overview**

Our Slack Clone is a real-time messaging platform for teams, supporting channels, direct messages (DMs), threaded conversations, file sharing, and user presence. The MVP focuses on core collaboration features for General Users and Admins with role-based permissions and intuitive workflows.

---

### **User Roles & Core Workflows**

#### **General User**

1. Users send and receive real-time messages in channels and DMs.
2. Users join channels and participate in threaded discussions.
3. Users share files and search for messages and files.

#### **Admin**

4. Admins create and delete channels to organize discussions.
5. Admins add and remove users from the workspace and channels.
6. Admins manage user permissions and roles within the system.

---

### **Technical Foundation**

#### **Data Models**

1. **User**: `id`, `email`, `name`, `avatar_url`, `status`, `role`, `created_at`, `updated_at`.
2. **Channel**: `id`, `name`, `description`, `is_private`, `created_by`, `created_at`, `updated_at`.
3. **ChannelMembers**: `id`, `channel_id`, `user_id`, `role_in_channel`, `joined_at`.
4. **Message**: `id`, `content`, `created_at`, `updated_at`, `channel_id`, `user_id`, `parent_id`.
5. **File**: `id`, `url`, `uploaded_by`, `message_id`, `uploaded_at`.

#### **File Storage with AWS S3**

1. **S3 Bucket Structure**:
   - `/uploads/[user_id]/[file_id]` - User-specific file uploads
   - `/avatars/[user_id]` - User avatar images
   - `/public/[file_id]` - Publicly accessible files

2. **File Management**:
   - Secure pre-signed URLs for file uploads
   - Automatic file type validation and virus scanning
   - Configurable file size limits and quotas per user
   - Automatic cleanup of orphaned files
   - Image optimization for previews and thumbnails

3. **Security**:
   - Private bucket with restricted access
   - Temporary pre-signed URLs for file access
   - Server-side encryption for stored files
   - CORS configuration for direct browser uploads

#### **API Endpoints**

1. `GET /api/users/me` - Fetch authenticated user data.
2. `GET /api/channels` - Retrieve channels the user belongs to.
3. `POST /api/channels` - Create a new channel (admin-only).
4. `POST /api/channels/:id/messages` - Send a message in a channel.
5. `GET /api/messages/search` - Search messages and files.

#### **Key Components**

1. **Header**: Displays user info and status toggle.
2. **Sidebar**: Lists channels and DMs.
3. **ChannelView**: Shows channel messages, threads, and files.
4. **MessageInput**: Handles message composition and file uploads.
5. **AdminTools**: Manages channels and user permissions.

---

### **Deployment Architecture**

#### **Amazon EC2 Infrastructure**

1. **Server Architecture**:
   - Application running on EC2 instances
   - Auto-scaling group for handling load
   - Load balancing across multiple availability zones
   - Health checks and automatic instance recovery

2. **Service Components**:
   - Web application server
   - WebSocket service for real-time communication
   - Background workers for file processing
   - Scheduled tasks for maintenance

3. **Networking**:
   - Application Load Balancer for HTTP/HTTPS traffic
   - VPC configuration with public and private subnets
   - Security groups for instance access control
   - CloudFront CDN for static assets and file delivery

4. **Monitoring and Logging**:
   - CloudWatch for instance logs and metrics
   - X-Ray for distributed tracing
   - EC2 instance monitoring
   - Automated alerts for service health

5. **CI/CD Pipeline**:
   - GitHub Actions for automated builds
   - ECR for container image storage
   - Blue/green deployments for zero downtime
   - Automated rollback capabilities

---

### **MVP Launch Requirements**

1. Real-time messaging in channels and DMs using WebSockets.
2. Role-based access control for Admin and General Users via Clerk.
3. Channel creation, deletion, and membership management for Admins.
4. File upload and retrieval with metadata linked to messages.
5. Search functionality for messages and files.
6. User presence and status indicators.
7. Responsive UI with clear navigation for core workflows.
8. Comprehensive API documentation and error handling.
