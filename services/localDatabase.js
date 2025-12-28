import {
  ADMIN_METRICS,
  ADMIN_MOVIES,
  ADMIN_REQUESTS,
  ADMIN_USERS,
  MOVIES,
  SHAREABLE_LISTS,
  SOCIAL_FOLLOWING,
  SOCIAL_REVIEWS,
} from './seedData';

const STORAGE_KEY = 'movie-library-app-state';
const SESSION_KEY = 'movie-library-session';

const defaultUsers = [
  {
    id: 'local-admin',
    email: 'admin@movielibrary.app',
    password: 'Admin#2024',
    role: 'admin',
    user_metadata: {
      full_name: 'Library Admin',
      avatar_url: '',
      bio: 'Oversees catalog updates and member requests.',
    },
  },
];

const getDefaultState = () => ({
  movies: MOVIES,
  adminMetrics: ADMIN_METRICS,
  adminMovies: ADMIN_MOVIES,
  adminRequests: ADMIN_REQUESTS,
  adminUsers: [
    ...ADMIN_USERS,
    {
      id: defaultUsers[0].id,
      name: defaultUsers[0].user_metadata.full_name,
      email: defaultUsers[0].email,
      role: 'Admin',
      status: 'Active',
    },
  ],
  socialReviews: SOCIAL_REVIEWS,
  socialFollowing: SOCIAL_FOLLOWING,
  shareableLists: SHAREABLE_LISTS,
  users: defaultUsers,
});

const createId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`;

const refreshMetrics = (state) => {
  const totalMovies = state.movies?.length || 0;
  const requestCount = state.adminRequests?.length || 0;
  const activeMembers = state.users?.length || 0;
  const adminVisibleUsers = state.adminUsers?.length || 0;

  return {
    ...state,
    adminMetrics: [
      {
        label: 'Catalog titles',
        value: String(totalMovies),
        detail: `${state.adminMovies?.length || 0} managed entries`,
      },
      {
        label: 'Pending requests',
        value: String(requestCount),
        detail: `${Math.max(requestCount - 1, 0)} awaiting review`,
      },
      {
        label: 'Active members',
        value: String(activeMembers),
        detail: `${adminVisibleUsers} visible in admin`,
      },
    ],
  };
};

export const loadLocalState = () => {
  const baseState = getDefaultState();

  if (typeof window === 'undefined') {
    return baseState;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return baseState;
  }

  try {
    const parsed = JSON.parse(stored);
    return refreshMetrics({ ...baseState, ...parsed });
  } catch (_error) {
    return baseState;
  }
};

export const saveLocalState = (partialState) => {
  if (typeof window === 'undefined') {
    return;
  }

  const merged = refreshMetrics({ ...loadLocalState(), ...partialState });
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
};

export const getSessionUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedSession = window.localStorage.getItem(SESSION_KEY);
  if (!storedSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedSession);
    if (parsed?.user?.id) {
      return parsed.user;
    }

    const sessionId = parsed?.id || parsed;
    if (!sessionId) {
      return null;
    }

    const { users } = loadLocalState();
    return users.find((user) => user.id === sessionId) || null;
  } catch (_error) {
    const sessionId = storedSession;
    const { users } = loadLocalState();
    return users.find((user) => user.id === sessionId) || null;
  }
};

export const setSessionUser = (user) => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload =
    user && typeof user === 'object'
      ? { id: user.id, user }
      : user
      ? { id: user }
      : null;

  if (!payload?.id) {
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
};

export const persistSessionUser = setSessionUser;

export const clearSessionUser = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
};

export const registerLocalUser = ({ email, password, fullName, bio }) => {
  if (typeof window === 'undefined') {
    return null;
  }

  const normalizedEmail = email?.toLowerCase().trim();
  if (!normalizedEmail || !password || !fullName) {
    throw new Error('Name, email, and password are required.');
  }

  const state = loadLocalState();

  if (state.users.some((user) => user.email === normalizedEmail)) {
    throw new Error('An account with that email already exists.');
  }

  const newUser = {
    id: createId('local-user'),
    email: normalizedEmail,
    password,
    role: 'member',
    user_metadata: {
      full_name: fullName,
      avatar_url: '',
      bio: bio || 'Exploring the catalog.',
    },
  };

  const updatedState = {
    ...state,
    users: [...state.users, newUser],
    adminUsers: [
      ...state.adminUsers,
      {
        id: newUser.id,
        name: fullName,
        email: normalizedEmail,
        role: 'Member',
        status: 'Active',
      },
    ],
  };

  saveLocalState(updatedState);
  setSessionUser(newUser.id);

  return newUser;
};

export const authenticateLocalUser = ({ email, password }) => {
  const normalizedEmail = email?.toLowerCase().trim();
  if (!normalizedEmail || !password) {
    throw new Error('Email and password are required.');
  }

  const { users } = loadLocalState();
  const user = users.find((entry) => entry.email === normalizedEmail && entry.password === password);

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  setSessionUser(user.id);
  return user;
};

export const updateLocalProfile = (userId, updates) => {
  if (!userId) {
    return null;
  }

  const state = loadLocalState();
  const userIndex = state.users.findIndex((entry) => entry.id === userId);

  if (userIndex === -1) {
    return null;
  }

  const currentUser = state.users[userIndex];
  const updatedUser = {
    ...currentUser,
    email: updates.email || currentUser.email,
    user_metadata: {
      ...currentUser.user_metadata,
      ...updates,
      full_name: updates.full_name || updates.fullName || currentUser.user_metadata.full_name,
    },
  };

  const updatedAdminUsers = state.adminUsers.map((adminUser) =>
    adminUser.id === userId
      ? {
          ...adminUser,
          name: updatedUser.user_metadata.full_name,
          email: updatedUser.email,
        }
      : adminUser,
  );

  const updatedState = {
    ...state,
    users: state.users.map((entry, index) => (index === userIndex ? updatedUser : entry)),
    adminUsers: updatedAdminUsers,
  };

  saveLocalState(updatedState);
  setSessionUser(updatedUser.id);

  return updatedUser;
};

export const addLocalRequest = ({ movieId, title, type, requesterEmail, userId, message, deliveryMethod }) => {
  const state = loadLocalState();
  const entry = {
    id: createId('req'),
    title,
    requested_by: requesterEmail,
    timeframe: 'Just now',
    notes: message || 'Pending admin follow-up',
    status: 'Open',
    type,
    movie_id: movieId,
    user_id: userId,
    delivery_method: deliveryMethod,
  };

  const updatedState = {
    ...state,
    adminRequests: [entry, ...(state.adminRequests || [])],
  };

  saveLocalState(updatedState);

  return entry;
};

export const addLocalMovie = ({
  title,
  genre,
  type,
  year,
  runtime,
  rating,
  availability,
  description,
  poster,
  director,
  addedBy,
}) => {
  const state = loadLocalState();
  const movie = {
    id: createId('movie'),
    title,
    genre,
    genres: [genre],
    type,
    year: Number(year) || new Date().getFullYear(),
    runtime,
    rating,
    score: 7.5,
    popularity: 40,
    releaseDate: `${year || new Date().getFullYear()}-01-01`,
    availability,
    director: director || 'Unknown',
    cast: [],
    watchOptions: [],
    trailerId: '',
    gallery: [],
    poster:
      poster ||
      'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=500&q=80',
    description: description || 'Newly added title.',
  };

  const updatedState = {
    ...state,
    movies: [movie, ...(state.movies || [])],
    adminMovies: [
      {
        id: createId('am'),
        title: movie.title,
        status: 'New',
        updated: 'Just now',
        owner: addedBy || 'Local admin',
      },
      ...(state.adminMovies || []),
    ],
  };

  saveLocalState(updatedState);

  return movie;
};
