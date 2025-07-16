# API Endpoints Documentation

This document provides comprehensive documentation for all available API endpoints in the Next.js chatbot application.

## Base URL

All API endpoints are prefixed with `/api/`

## Authentication

Most endpoints require authentication via NextAuth.js session tokens. Guest users are automatically created for unauthenticated requests through `/api/auth/guest`.

## Error Handling

All endpoints return standardized error responses with the following structure:

```json
{
  "code": "error_type:surface",
  "message": "Human-readable error message",
  "cause": "Optional additional details"
}
```

### Error Types

- `400` - Bad Request: Invalid input parameters
- `401` - Unauthorized: Authentication required
- `403` - Forbidden: Access denied
- `404` - Not Found: Resource not found
- `429` - Rate Limited: Too many requests
- `500` - Internal Server Error
- `503` - Service Unavailable: Offline/maintenance

---

## API Endpoints Overview

| Method                 | Endpoint                                  | Purpose                           | Auth Required | Rate Limited |
| ---------------------- | ----------------------------------------- | --------------------------------- | ------------- | ------------ |
| **Authentication**     |
| `GET`                  | `/api/auth/guest`                         | Create guest user session         | ❌            | ❌           |
| `GET`                  | `/api/auth/signin`                        | Show sign-in page                 | ❌            | ❌           |
| `POST`                 | `/api/auth/signin/{provider}`             | Sign in with auth method          | ❌            | ❌           |
| `GET/POST`             | `/api/auth/signout`                       | Sign out user                     | ❌            | ❌           |
| `GET`                  | `/api/auth/session`                       | Get current session               | ❌            | ❌           |
| `GET`                  | `/api/auth/csrf`                          | Get CSRF token                    | ❌            | ❌           |
| `GET`                  | `/api/auth/providers`                     | Get available auth methods        | ❌            | ❌           |
| **Chat Management**    |
| `POST`                 | `/api/chat`                               | Send message & stream AI response | ✅            | ✅           |
| `DELETE`               | `/api/chat?id={chatId}`                   | Delete chat and messages          | ✅            | ❌           |
| `GET`                  | `/api/chat/[id]/stream`                   | Resume interrupted chat stream    | ✅            | ❌           |
| **Document/Artifacts** |
| `GET`                  | `/api/document?id={docId}`                | Get document versions             | ✅            | ❌           |
| `POST`                 | `/api/document?id={docId}`                | Create/update document            | ✅            | ❌           |
| `DELETE`               | `/api/document?id={docId}&timestamp={ts}` | Delete document versions          | ✅            | ❌           |
| **File Management**    |
| `POST`                 | `/api/files/upload`                       | Upload images (5MB max)           | ✅            | ❌           |
| **Chat History**       |
| `GET`                  | `/api/history`                            | Get paginated chat history        | ✅            | ❌           |
| **Message Voting**     |
| `GET`                  | `/api/vote?chatId={chatId}`               | Get message votes                 | ✅            | ❌           |
| `PATCH`                | `/api/vote`                               | Vote on message (up/down)         | ✅            | ❌           |
| **AI Suggestions**     |
| `GET`                  | `/api/suggestions?documentId={docId}`     | Get document suggestions          | ✅            | ❌           |
| **Utility**            |
| `GET`                  | `/ping`                                   | Health check endpoint             | ❌            | ❌           |

### Key Features:

- **🔐 Authentication**: Session-based with guest user support
- **📱 Mobile-Ready**: JSON API with standard HTTP methods
- **🔄 Real-time**: Server-Sent Events (SSE) for streaming responses
- **📁 File Upload**: Image upload with validation (JPEG/PNG, 5MB max)
- **⚡ Rate Limiting**: Daily message limits per user type
- **🔄 Resumable Streams**: Handle network interruptions
- **📖 Pagination**: Chat history with cursor-based pagination

---

## Authentication Endpoints

### Guest Authentication

**GET** `/api/auth/guest`

Creates and signs in a guest user automatically.

**Query Parameters:**

- `redirectUrl` (optional): URL to redirect after authentication

**Response:**

- Redirects to the specified URL or home page
- Creates a guest user with email format: `guest-{timestamp}`

---

### NextAuth Endpoints

Standard NextAuth.js authentication endpoints for comprehensive auth management.

#### Sign In Page

**GET** `/api/auth/signin`

Displays the sign-in page with available authentication providers.

**Response:**

- **Success**: HTML sign-in page
- **Redirect**: May redirect if already authenticated

---

#### Sign In with Authentication Method

**POST** `/api/auth/signin/{provider}`

Authenticates user with specific authentication method.

**Path Parameters:**

- `provider`: Authentication method - either `credentials` (for email/password login) or `guest` (for anonymous access)

**Note**: "Provider" here refers to the authentication method, not external OAuth providers like Google/GitHub.

**Request Body (for credentials provider):**

```json
{
  "email": "user@example.com",
  "password": "userpassword",
  "csrfToken": "csrf-token-value"
}
```

**Response:**

- **Success**: Redirects to callback URL or home page
- **Error**: Returns to sign-in page with error

---

#### Sign Out

**GET/POST** `/api/auth/signout`

Signs out the current user and invalidates the session.

**Response:**

- **GET**: Shows sign-out confirmation page
- **POST**: Performs sign-out and redirects

---

#### Get Session

**GET** `/api/auth/session`

Retrieves the current user session information.

**Response:**

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "type": "regular|guest"
  },
  "expires": "2024-12-31T23:59:59.999Z"
}
```

**Response (not authenticated):**

```json
null
```

---

#### Get CSRF Token

**GET** `/api/auth/csrf`

Returns CSRF token for secure form submissions.

**Response:**

```json
{
  "csrfToken": "csrf-token-value"
}
```

---

#### Get Available Authentication Methods

**GET** `/api/auth/providers`

Returns list of configured authentication methods available in the application.

**Response:**

```json
{
  "credentials": {
    "id": "credentials",
    "name": "Credentials",
    "type": "credentials",
    "signinUrl": "/api/auth/signin/credentials",
    "callbackUrl": "/api/auth/callback/credentials"
  },
  "guest": {
    "id": "guest",
    "name": "Guest",
    "type": "credentials",
    "signinUrl": "/api/auth/signin/guest",
    "callbackUrl": "/api/auth/callback/guest"
  }
}
```

**Available Authentication Methods:**

- **`credentials`**: Email/password authentication for registered users
- **`guest`**: Anonymous authentication for temporary access (no registration required)

---

## Chat Endpoints

### Create Chat Message / Send Message

**POST** `/api/chat`

Sends a new message to a chat and streams the AI response.

**Request Body:**

```json
{
  "id": "uuid-string",
  "message": {
    "id": "uuid-string",
    "role": "user",
    "parts": [
      {
        "type": "text",
        "text": "Your message here (1-2000 chars)"
      },
      {
        "type": "file",
        "mediaType": "image/jpeg|image/png",
        "name": "filename (1-100 chars)",
        "url": "https://example.com/file.jpg"
      }
    ]
  },
  "selectedChatModel": "chat-model|chat-model-reasoning",
  "selectedVisibilityType": "public|private"
}
```

**Response:**

- **Success**: Server-Sent Events (SSE) stream of AI responses
- **Content-Type**: `text/event-stream`

**Rate Limits:**

- Regular users: Configurable messages per day
- Guest users: Limited messages per day

**Error Codes:**

- `bad_request:api` - Invalid request format
- `unauthorized:chat` - Not authenticated
- `forbidden:chat` - Access denied to chat
- `rate_limit:chat` - Exceeded daily message limit

---

### Delete Chat

**DELETE** `/api/chat?id={chatId}`

Deletes a chat and all its messages.

**Query Parameters:**

- `id` (required): Chat ID to delete

**Response:**

```json
{
  "id": "deleted-chat-id",
  "title": "chat-title",
  "userId": "user-id"
}
```

**Error Codes:**

- `bad_request:api` - Missing chat ID
- `unauthorized:chat` - Not authenticated
- `forbidden:chat` - Chat belongs to another user

---

### Resume Chat Stream

**GET** `/api/chat/[id]/stream`

Resumes an interrupted chat stream for the specified chat.

**Path Parameters:**

- `id` (required): Chat ID

**Response:**

- **Success**: Server-Sent Events (SSE) stream
- **No Content**: 204 if stream context unavailable

**Error Codes:**

- `bad_request:api` - Invalid chat ID
- `unauthorized:chat` - Not authenticated
- `forbidden:chat` - Private chat access denied
- `not_found:chat` - Chat not found
- `not_found:stream` - No stream available

---

## Document/Artifact Endpoints

### Get Document Versions

**GET** `/api/document?id={documentId}`

Retrieves all versions of a document/artifact.

**Query Parameters:**

- `id` (required): Document ID

**Response:**

```json
[
  {
    "id": "document-id",
    "title": "Document Title",
    "content": "Document content",
    "kind": "text|code|image|sheet",
    "userId": "user-id",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

**Error Codes:**

- `bad_request:api` - Missing document ID
- `unauthorized:document` - Not authenticated
- `forbidden:document` - Document belongs to another user
- `not_found:document` - Document not found

---

### Create/Update Document

**POST** `/api/document?id={documentId}`

Creates a new version of a document or creates a new document.

**Query Parameters:**

- `id` (required): Document ID

**Request Body:**

```json
{
  "content": "Document content",
  "title": "Document Title",
  "kind": "text|code|image|sheet"
}
```

**Response:**

```json
{
  "id": "document-id",
  "title": "Document Title",
  "content": "Document content",
  "kind": "text|code|image|sheet",
  "userId": "user-id",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Error Codes:**

- `bad_request:api` - Missing required parameters
- `unauthorized:document` - Not authenticated
- `forbidden:document` - Document belongs to another user

---

### Delete Document Versions

**DELETE** `/api/document?id={documentId}&timestamp={timestamp}`

Deletes document versions created after the specified timestamp.

**Query Parameters:**

- `id` (required): Document ID
- `timestamp` (required): ISO timestamp

**Response:**

```json
{
  "deletedCount": 5
}
```

**Error Codes:**

- `bad_request:api` - Missing required parameters
- `unauthorized:document` - Not authenticated
- `forbidden:document` - Document belongs to another user

---

## File Upload Endpoints

### Upload File

**POST** `/api/files/upload`

Uploads files (images) to blob storage.

**Request:**

- **Content-Type**: `multipart/form-data`
- **Form Field**: `file`

**File Requirements:**

- **Size**: Maximum 5MB
- **Types**: JPEG, PNG images only

**Response:**

```json
{
  "url": "https://blob-url.com/filename.jpg",
  "downloadUrl": "https://blob-url.com/filename.jpg",
  "pathname": "filename.jpg",
  "size": 1024
}
```

**Error Codes:**

- `401` - Not authenticated
- `400` - No file uploaded, file too large, or invalid file type
- `500` - Upload failed

---

## Chat History Endpoints

### Get Chat History

**GET** `/api/history`

Retrieves paginated chat history for the authenticated user.

**Query Parameters:**

- `limit` (optional): Number of chats to return (default: 10)
- `starting_after` (optional): Chat ID for pagination (exclusive)
- `ending_before` (optional): Chat ID for pagination (exclusive)

**Note**: Cannot use both `starting_after` and `ending_before` simultaneously.

**Response:**

```json
[
  {
    "id": "chat-id",
    "title": "Chat Title",
    "userId": "user-id",
    "visibility": "public|private",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

**Error Codes:**

- `bad_request:api` - Invalid pagination parameters
- `unauthorized:chat` - Not authenticated

---

## Voting Endpoints

### Get Chat Votes

**GET** `/api/vote?chatId={chatId}`

Retrieves all votes for messages in a chat.

**Query Parameters:**

- `chatId` (required): Chat ID

**Response:**

```json
[
  {
    "messageId": "message-id",
    "type": "up|down",
    "chatId": "chat-id"
  }
]
```

**Error Codes:**

- `bad_request:api` - Missing chat ID
- `unauthorized:vote` - Not authenticated
- `forbidden:vote` - Chat belongs to another user
- `not_found:chat` - Chat not found

---

### Vote on Message

**PATCH** `/api/vote`

Votes on a message (upvote or downvote).

**Request Body:**

```json
{
  "chatId": "chat-id",
  "messageId": "message-id",
  "type": "up|down"
}
```

**Response:**

- **Status**: 200
- **Body**: "Message voted"

**Error Codes:**

- `bad_request:api` - Missing required parameters
- `unauthorized:vote` - Not authenticated
- `forbidden:vote` - Chat belongs to another user
- `not_found:vote` - Chat not found

---

## Suggestions Endpoints

### Get Document Suggestions

**GET** `/api/suggestions?documentId={documentId}`

Retrieves AI-generated suggestions for a document.

**Query Parameters:**

- `documentId` (required): Document ID

**Response:**

```json
[
  {
    "id": "suggestion-id",
    "documentId": "document-id",
    "content": "Suggestion content",
    "userId": "user-id",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

**Error Codes:**

- `bad_request:api` - Missing document ID
- `unauthorized:suggestions` - Not authenticated
- `forbidden:api` - Document belongs to another user

---

## Additional Endpoints

### Health Check

**GET** `/ping`

Simple health check endpoint (used by tests).

**Response:**

- **Status**: 200
- **Body**: "pong"

---

## Rate Limiting

The application implements rate limiting on chat messages:

- **Regular Users**: Configurable daily message limit
- **Guest Users**: Limited daily message limit

Rate limits are enforced per user and reset every 24 hours.

## Authentication Flow

The application supports two authentication methods:

### 1. **Guest Authentication** (Anonymous Access)

1. **Unauthenticated Request**: Automatically redirected to `/api/auth/guest`
2. **Guest Creation**: System creates temporary guest user with email format `guest-{timestamp}`
3. **Session Management**: NextAuth.js manages authentication state
4. **Limitations**: Limited daily messages, temporary account

### 2. **Credentials Authentication** (Registered Users)

1. **Registration**: User creates account with email/password via `/register`
2. **Login**: User signs in with credentials via `/login` or `/api/auth/signin/credentials`
3. **Full Access**: Higher daily message limits, persistent account
4. **User Upgrade**: Guest users can register for permanent accounts

**Note**: Both authentication methods use NextAuth.js internally but are not external OAuth providers.

## Supported Chat Models

- `chat-model`: GPT-3.5-turbo (default)
- `chat-model-reasoning`: Advanced reasoning model (commented out in current config)

## AI Tools Integration

The chat endpoint integrates with several AI tools:

- **Weather**: Get weather information
- **Document Creation**: Create new documents/artifacts
- **Document Updates**: Modify existing documents
- **Suggestions**: Generate contextual suggestions

## Development Notes

- All endpoints use standard HTTP status codes
- Request/response bodies use JSON format except file uploads
- Authentication is handled via NextAuth.js sessions
- Guest users have email format: `guest-{timestamp}`
- The application supports both public and private chat visibility
- Resumable streams are supported with Redis (optional)
