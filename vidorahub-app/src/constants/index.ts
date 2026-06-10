export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER_NAME: 'user_name',
  USER_EMAIL: 'user_email',
  USER_SERIAL_NUMBER: 'user_serial_number',
  REDIRECT_AFTER_LOGIN: 'redirect_after_login',
  CURRENT_VIDEO_ID: 'current_video_id',
  VIDEO_SESSION_PREFIX: 'video_session_',
  VIBE_SESSION_PREFIX: 'vibe_session_',
  USER_ID: 'user_id',
  ACTIVITY_ID: 'activity_id',
  VISITED: 'vidorahub_visited',
} as const;

export const QUERY_KEYS = {
  VIDEOS: 'videos',
  VIBES: 'vibes',
  VIDEO: 'video',
  SEARCH: 'search',
  PROFILE: 'profile',
  CHANNEL: 'channel',
  PRODUCTS: 'products',
  EARNINGS: 'earnings',
  COMMENTS: 'comments',
  REACTIONS: 'reactions',
  FOLLOW: 'follow',
} as const;

export const AUTH_ROUTES = ['/login', '/signup'] as const;
