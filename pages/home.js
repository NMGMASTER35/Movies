import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase, isAdminUser } from '../services/supabaseClient';

const MOVIES = [
  {
    id: 'm1',
    title: 'Skyline Drift',
    genre: 'Action',
    genres: ['Action', 'Thriller'],
    type: 'Movie',
    year: 2023,
    runtime: '2h 7m',
    rating: 'PG-13',
    score: 8.6,
    popularity: 92,
    releaseDate: '2023-08-18',
    availability: 'Streaming',
    director: 'Cameron Reyes',
    cast: ['Lana Cho', 'Miles Carter', 'Rina Patel'],
    watchOptions: [
      { platform: 'Cinemax Stream', detail: '4K UHD · Included' },
      { platform: 'Prime Pass', detail: 'Rent from $3.99' },
      { platform: 'USB Vault', detail: 'Shipped in 48 hours' },
    ],
    trailerId: 'v5j3K75d0L0',
    gallery: [
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=500&q=80',
    ],
    poster:
      'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=500&q=80',
    description: 'An elite driver fights to clear his name in a high-stakes city race.',
    featured: true,
  },
  {
    id: 'm2',
    title: 'The Silent Reef',
    genre: 'Thriller',
    genres: ['Thriller', 'Mystery'],
    type: 'Movie',
    year: 2022,
    runtime: '1h 54m',
    rating: 'R',
    score: 7.8,
    popularity: 81,
    releaseDate: '2022-04-02',
    availability: 'Request',
    director: 'Noah Grant',
    cast: ['Avery Brooks', 'Selene Ward', 'Jonah Kim'],
    watchOptions: [
      { platform: 'Request Library', detail: 'Admin approval required' },
      { platform: 'USB Vault', detail: 'Delivered in 3-5 days' },
      { platform: 'Private Link', detail: 'Encrypted stream' },
    ],
    trailerId: 'u1o5y4cVb2w',
    gallery: [
      'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=500&q=80',
    ],
    poster:
      'https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=500&q=80',
    description: 'A marine biologist uncovers a hidden conspiracy beneath the waves.',
  },
  {
    id: 'm3',
    title: 'Glass Frontier',
    genre: 'Drama',
    genres: ['Drama', 'Business'],
    type: 'Series',
    year: 2021,
    runtime: '10 episodes',
    rating: 'TV-MA',
    score: 8.2,
    popularity: 77,
    releaseDate: '2021-11-10',
    availability: 'Streaming',
    director: 'Naomi Rivers',
    cast: ['Elena Voss', 'Andre Mills', 'Kai Nakamura'],
    watchOptions: [
      { platform: 'Streamline', detail: 'Season 1-2 · Included' },
      { platform: 'Download Hub', detail: 'Offline access' },
      { platform: 'USB Vault', detail: 'Collector bundle' },
    ],
    trailerId: 'Xb8VZ2Q9LxA',
    gallery: [
      'https://images.unsplash.com/photo-1497032205916-ac775f0649ae?auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80',
    ],
    poster:
      'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=500&q=80',
    description: 'A family-run empire struggles to survive a ruthless tech takeover.',
  },
  {
    id: 'm4',
    title: 'Orbit City',
    genre: 'Sci-Fi',
    genres: ['Sci-Fi', 'Adventure'],
    type: 'Series',
    year: 2024,
    runtime: '8 episodes',
    rating: 'TV-14',
    score: 9.1,
    popularity: 95,
    releaseDate: '2024-02-16',
    availability: 'Request',
    director: 'Inez Calderon',
    cast: ['Mira Sol', 'Leo Hart', 'Aisha Coleman'],
    watchOptions: [
      { platform: 'Request Library', detail: 'Admin approval required' },
      { platform: 'Starlight Stream', detail: 'HDR access' },
      { platform: 'USB Vault', detail: 'Priority shipping' },
    ],
    trailerId: 'lZQ5lq8uRIE',
    gallery: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=500&q=80',
    ],
    poster:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=500&q=80',
    description: 'Citizens in a floating metropolis uncover secrets in the lower decks.',
  },
  {
    id: 'm5',
    title: 'Café Sonata',
    genre: 'Romance',
    genres: ['Romance', 'Drama'],
    type: 'Movie',
    year: 2020,
    runtime: '1h 42m',
    rating: 'PG',
    score: 7.4,
    popularity: 68,
    releaseDate: '2020-05-12',
    availability: 'Streaming',
    director: 'Lucia Moreau',
    cast: ['Isabelle Laurent', 'Theo Grant', 'Mina Park'],
    watchOptions: [
      { platform: 'Café Stream', detail: 'Included with subscription' },
      { platform: 'Prime Pass', detail: 'Rent from $2.99' },
      { platform: 'USB Vault', detail: 'Special edition' },
    ],
    trailerId: 'aA6C8nJ0qL4',
    gallery: [
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=500&q=80',
    ],
    poster:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80',
    description: 'Two strangers bond over music, pastries, and a Parisian café.',
  },
  {
    id: 'm6',
    title: 'Hidden Atlas',
    genre: 'Adventure',
    genres: ['Adventure', 'Action'],
    type: 'Movie',
    year: 2019,
    runtime: '2h 12m',
    rating: 'PG-13',
    score: 7.9,
    popularity: 73,
    releaseDate: '2019-09-04',
    availability: 'Request',
    director: 'Rafael Stone',
    cast: ['Tessa Monroe', 'Harper Quinn', 'Omar Reyes'],
    watchOptions: [
      { platform: 'Request Library', detail: 'Approval in 24 hours' },
      { platform: 'Explorer Stream', detail: 'HD access' },
      { platform: 'USB Vault', detail: 'Adventure pack' },
    ],
    trailerId: 'o0Z2re7muX0',
    gallery: [
      'https://images.unsplash.com/photo-1497032205916-ac775f0649ae?auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=500&q=80',
    ],
    poster:
      'https://images.unsplash.com/photo-1497032205916-ac775f0649ae?auto=format&fit=crop&w=500&q=80',
    description: 'A cartographer and her crew hunt for a legendary island map.',
  },
];

const ADMIN_METRICS = [
  {
    label: 'Catalog titles',
    value: '148',
    detail: '12 new additions this month',
  },
  {
    label: 'Pending requests',
    value: '7',
    detail: '3 high priority reviews',
  },
  {
    label: 'Active members',
    value: '2,431',
    detail: '58 accounts flagged for review',
  },
];

const ADMIN_MOVIES = [
  {
    id: 'am1',
    title: 'Skyline Drift',
    status: 'Live',
    updated: 'Today',
    owner: 'Cameron Reyes',
  },
  {
    id: 'am2',
    title: 'Orbit City',
    status: 'Queued',
    updated: 'Yesterday',
    owner: 'Inez Calderon',
  },
  {
    id: 'am3',
    title: 'Hidden Atlas',
    status: 'Needs QA',
    updated: '2 days ago',
    owner: 'Rafael Stone',
  },
];

const ADMIN_REQUESTS = [
  {
    id: 'ar1',
    title: 'The Midnight Signal',
    requestedBy: 'Jordan Lee',
    timeframe: '2 hours ago',
    notes: 'Looking for 4K transfer',
  },
  {
    id: 'ar2',
    title: 'Cobalt Harbor',
    requestedBy: 'Samira Chen',
    timeframe: 'Yesterday',
    notes: 'Festival screening request',
  },
  {
    id: 'ar3',
    title: 'Parallel Bloom',
    requestedBy: 'Diego Martín',
    timeframe: '3 days ago',
    notes: 'Subtitle availability needed',
  },
];

const ADMIN_USERS = [
  {
    id: 'au1',
    name: 'Aria Nguyen',
    email: 'aria.nguyen@cinema.com',
    role: 'Member',
    status: 'Active',
  },
  {
    id: 'au2',
    name: 'Quinn Patel',
    email: 'quinn.patel@cinema.com',
    role: 'Reviewer',
    status: 'Needs reset',
  },
  {
    id: 'au3',
    name: 'Miles Carter',
    email: 'miles.carter@cinema.com',
    role: 'Admin',
    status: 'Verified',
  },
];

const SOCIAL_REVIEWS = [
  {
    id: 'sr1',
    movieId: 'm1',
    reviewer: 'Aria Nguyen',
    rating: 5,
    time: '2 hours ago',
    comment: 'A pulse-pounding ride with gorgeous visuals and a killer soundtrack.',
  },
  {
    id: 'sr2',
    movieId: 'm4',
    reviewer: 'Jordan Lee',
    rating: 4,
    time: 'Yesterday',
    comment: 'The world-building is incredible. Each episode ends on a perfect cliffhanger.',
  },
  {
    id: 'sr3',
    movieId: 'm5',
    reviewer: 'Samira Chen',
    rating: 5,
    time: '2 days ago',
    comment: 'Cozy, heartwarming, and beautifully shot. Perfect weekend watch.',
  },
];

const SOCIAL_FOLLOWING = [
  {
    id: 'sf1',
    name: 'Diego Martín',
    handle: '@diegomartin',
    focus: 'Indie & drama',
    followers: '1.4k',
    status: 'Following',
  },
  {
    id: 'sf2',
    name: 'Mina Park',
    handle: '@minapicks',
    focus: 'Rom-coms & feel-good',
    followers: '980',
    status: 'Follow',
  },
  {
    id: 'sf3',
    name: 'Noah Grant',
    handle: '@noahgrant',
    focus: 'Thrillers & mystery',
    followers: '2.1k',
    status: 'Following',
  },
];

const SHAREABLE_LISTS = [
  {
    id: 'sl1',
    title: 'Top 10 Action Rush',
    curator: 'Cameron Reyes',
    followers: '3.2k',
    movies: ['m1', 'm6'],
  },
  {
    id: 'sl2',
    title: 'Best New Sci-Fi',
    curator: 'Inez Calderon',
    followers: '1.8k',
    movies: ['m4', 'm3'],
  },
  {
    id: 'sl3',
    title: 'Cozy Romance Nights',
    curator: 'Lucia Moreau',
    followers: '1.1k',
    movies: ['m5', 'm2'],
  },
];

const GENRES = ['All', 'Action', 'Thriller', 'Drama', 'Sci-Fi', 'Romance', 'Adventure', 'Mystery', 'Business'];
const TYPES = ['All', 'Movie', 'Series'];
const RATING_FILTERS = [
  { label: 'All ratings', value: 'All' },
  { label: '9+ score', value: '9' },
  { label: '8+ score', value: '8' },
  { label: '7+ score', value: '7' },
  { label: '6+ score', value: '6' },
];
const SORT_OPTIONS = [
  { label: 'Sort by popularity', value: 'popularity' },
  { label: 'Newest releases', value: 'newest' },
  { label: 'Oldest releases', value: 'oldest' },
  { label: 'Highest rated', value: 'rating' },
];

export default function Home() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedScore, setSelectedScore] = useState('All');
  const [sortBy, setSortBy] = useState('popularity');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [requestEmail, setRequestEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('USB');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestStatus, setRequestStatus] = useState('');
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState('');
  const [watchlist, setWatchlist] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [history, setHistory] = useState([]);
  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileStatus, setProfileStatus] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const isAdmin = useMemo(() => isAdminUser(user), [user]);
  const isAdminPreview = useMemo(() => router.query.admin === 'preview', [router.query.admin]);
  const canViewAdmin = isAdmin || isAdminPreview;
  const navTabs = useMemo(
    () => ['browse', 'watchlist', 'requests', 'profile', ...(canViewAdmin ? ['admin'] : [])],
    [canViewAdmin],
  );
  const storageKey = useMemo(() => {
    if (!user?.id && !user?.email) {
      return null;
    }

    return `movie-profile-${user?.id || user?.email}`;
  }, [user]);
  const movieMap = useMemo(() => new Map(MOVIES.map((movie) => [movie.id, movie])), []);

  useEffect(() => {
    if (!supabase) {
      setAuthStatus('Missing Supabase configuration. Please check your environment settings.');
      return;
    }

    let isMounted = true;

    const hydrateSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (error) {
        setAuthStatus(error.message);
        return;
      }

      const activeUser = data?.session?.user ?? null;
      setUser(activeUser);

      if (!activeUser && !isAdminPreview) {
        router.push('/');
      }
    };

    hydrateSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);

      if (!activeUser && !isAdminPreview) {
        router.push('/');
      }
    });

    return () => {
      isMounted = false;
      data?.subscription?.unsubscribe();
    };
  }, [isAdminPreview, router]);

  useEffect(() => {
    if (user?.email) {
      setRequestEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      setProfileName(user?.user_metadata?.full_name || '');
      setProfileAvatar(user?.user_metadata?.avatar_url || '');
      setProfileBio(user?.user_metadata?.bio || '');
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setWatchlist(parsed.watchlist || []);
      setRatings(parsed.ratings || []);
      setHistory(parsed.history || []);
      setProfileName(parsed.profileName || user?.user_metadata?.full_name || '');
      setProfileAvatar(parsed.profileAvatar || user?.user_metadata?.avatar_url || '');
      setProfileBio(parsed.profileBio || user?.user_metadata?.bio || '');
    } catch (error) {
      setProfileName(user?.user_metadata?.full_name || '');
      setProfileAvatar(user?.user_metadata?.avatar_url || '');
      setProfileBio(user?.user_metadata?.bio || '');
    }
  }, [storageKey, user]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!supabase || !user?.id) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, bio')
          .eq('id', user.id)
          .single();

        if (error) {
          return;
        }

        if (data?.full_name) {
          setProfileName(data.full_name);
        }
        if (data?.avatar_url) {
          setProfileAvatar(data.avatar_url);
        }
        if (data?.bio) {
          setProfileBio(data.bio);
        }
      } catch (error) {
        // Ignore profile fetch failures; local defaults will remain.
      }
    };

    loadProfile();
  }, [user]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    const payload = {
      watchlist,
      ratings,
      history,
      profileName,
      profileAvatar,
      profileBio,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [storageKey, watchlist, ratings, history, profileName, profileAvatar, profileBio]);

  const featured = MOVIES.find((movie) => movie.featured) || MOVIES[0];
  const availableYears = useMemo(() => {
    const years = [...new Set(MOVIES.map((movie) => movie.year))];
    return ['All', ...years.sort((a, b) => b - a)];
  }, []);
  const favoriteGenres = useMemo(() => {
    const genreCounts = {};

    const addGenres = (movieId, weight) => {
      const movie = movieMap.get(movieId);
      if (!movie) {
        return;
      }

      movie.genres.forEach((genre) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + weight;
      });
    };

    ratings.forEach((entry) => {
      if (Number(entry.rating) >= 4) {
        addGenres(entry.movieId, 2);
      }
    });

    history.forEach((entry) => addGenres(entry.movieId, 1));
    watchlist.forEach((entry) => addGenres(entry.movieId, 0.5));

    return Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([genre]) => genre);
  }, [history, movieMap, ratings, watchlist]);
  const recommendedMovies = useMemo(() => {
    const seenIds = new Set(history.map((entry) => entry.movieId));
    const boostedGenres = new Set(favoriteGenres);

    return MOVIES.filter((movie) => !seenIds.has(movie.id))
      .map((movie) => {
        let score = movie.score * 10 + movie.popularity;
        if (boostedGenres.size && movie.genres.some((genre) => boostedGenres.has(genre))) {
          score += 25;
        }
        if (watchlist.some((entry) => entry.movieId === movie.id)) {
          score += 5;
        }
        return { movie, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((entry) => entry.movie);
  }, [favoriteGenres, history, watchlist]);
  const trendingMovies = useMemo(
    () => [...MOVIES].sort((a, b) => b.popularity - a.popularity).slice(0, 3),
    [],
  );
  const recommendationsSummary = favoriteGenres.length
    ? `Tailored from your love of ${favoriteGenres.join(' & ')} stories.`
    : 'Personalized using your ratings, watchlist, and recent plays.';

  const filteredMovies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const minScore = selectedScore === 'All' ? null : Number(selectedScore);

    const filtered = MOVIES.filter((movie) => {
      const searchable = [
        movie.title,
        movie.genre,
        ...(movie.genres || []),
        ...(movie.cast || []),
        movie.director,
        movie.type,
        String(movie.year),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
      const matchesGenre =
        selectedGenre === 'All' || movie.genre === selectedGenre || movie.genres?.includes(selectedGenre);
      const matchesType = selectedType === 'All' || movie.type === selectedType;
      const matchesYear = selectedYear === 'All' || movie.year === Number(selectedYear);
      const matchesScore = minScore === null || movie.score >= minScore;

      return matchesSearch && matchesGenre && matchesType && matchesYear && matchesScore;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.year - a.year;
        case 'oldest':
          return a.year - b.year;
        case 'rating':
          return b.score - a.score;
        case 'popularity':
        default:
          return b.popularity - a.popularity;
      }
    });
  }, [searchTerm, selectedGenre, selectedType, selectedYear, selectedScore, sortBy]);

  const handleAddToWatchlist = (movie) => {
    setWatchlist((prev) => {
      if (prev.some((item) => item.movieId === movie.id)) {
        return prev;
      }
      return [...prev, { movieId: movie.id, addedAt: new Date().toISOString() }];
    });
  };

  const handleRemoveFromWatchlist = (movieId) => {
    setWatchlist((prev) => prev.filter((item) => item.movieId !== movieId));
  };

  const handleRatingChange = (movieId, rating) => {
    setRatings((prev) => {
      const existing = prev.find((entry) => entry.movieId === movieId);
      if (existing) {
        return prev.map((entry) =>
          entry.movieId === movieId ? { ...entry, rating, updatedAt: new Date().toISOString() } : entry
        );
      }
      return [...prev, { movieId, rating, updatedAt: new Date().toISOString() }];
    });
  };

  const handleHistoryMark = (movieId) => {
    setHistory((prev) => {
      const existing = prev.find((entry) => entry.movieId === movieId);
      if (existing) {
        return prev.map((entry) =>
          entry.movieId === movieId
            ? { ...entry, watchedAt: new Date().toISOString() }
            : entry
        );
      }
      return [...prev, { movieId, watchedAt: new Date().toISOString() }];
    });
  };

  const handleHistoryRemove = (movieId) => {
    setHistory((prev) => prev.filter((entry) => entry.movieId !== movieId));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setProfileStatus('');

    if (!profileName) {
      setProfileStatus('Please provide a name for your profile.');
      return;
    }

    if (!supabase) {
      setProfileStatus('Missing Supabase configuration. Please check your environment settings.');
      return;
    }

    if (!user?.id) {
      setProfileStatus('Unable to load your account. Please log in again.');
      return;
    }

    try {
      const [{ error: authError }, { error: profileError }] = await Promise.all([
        supabase.auth.updateUser({
          data: {
            full_name: profileName,
            avatar_url: profileAvatar,
            bio: profileBio,
          },
        }),
        supabase.from('profiles').upsert(
          {
            id: user.id,
            full_name: profileName,
            avatar_url: profileAvatar,
            bio: profileBio,
            email: user.email,
          },
          { onConflict: 'id' }
        ),
      ]);

      if (authError || profileError) {
        const message =
          authError?.message || profileError?.message || 'Unable to update your profile right now.';
        setProfileStatus(message);
        return;
      }

      setProfileStatus('Profile updated successfully.');
    } catch (error) {
      setProfileStatus(error.message || 'Unable to update your profile right now.');
    }
  };

  const renderMovieTitle = (movieId) => MOVIES.find((movie) => movie.id === movieId)?.title || 'Unknown';

  const renderMovieMeta = (movieId) => {
    const movie = MOVIES.find((item) => item.id === movieId);
    if (!movie) {
      return '';
    }
    return `${movie.genre} • ${movie.type}`;
  };

  const renderRecommendationReason = (movie) => {
    const matchingGenre = favoriteGenres.find((genre) => movie.genres.includes(genre));
    if (matchingGenre) {
      return `Because you enjoy ${matchingGenre} titles.`;
    }
    if (ratings.length || history.length) {
      return 'Inspired by your recent activity.';
    }
    return 'A rising favorite in your library.';
  };

  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    setRequestStatus('');

    const requesterEmail = user?.email || requestEmail;

    if (!requesterEmail || !selectedMovie) {
      setRequestStatus('Please enter your email to submit a request.');
      return;
    }

    if (!supabase) {
      setRequestStatus('Missing Supabase configuration. Please check your environment settings.');
      return;
    }

    try {
      const { error } = await supabase.from('requests').insert([
        {
          movie_id: selectedMovie.id,
          user_id: user?.id || requesterEmail,
          requester_email: requesterEmail,
          type: selectedMovie.type,
          status: 'OPEN',
          message: requestMessage,
          delivery_method: deliveryMethod,
        },
      ]);

      if (error) {
        setRequestStatus(error.message || 'Unable to submit request right now.');
        return;
      }

      setRequestStatus('Request sent! We will follow up with updates soon.');
      setRequestMessage('');
    } catch (submitError) {
      setRequestStatus(submitError.message || 'Unable to submit request right now.');
    }
  };

  const handleSignOut = async () => {
    if (!supabase) {
      setAuthStatus('Missing Supabase configuration. Please check your environment settings.');
      return;
    }

    setAuthStatus('');

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setAuthStatus(error.message || 'Unable to sign out right now.');
        return;
      }

      setIsUserMenuOpen(false);
      router.push('/');
    } catch (signOutError) {
      setAuthStatus(signOutError.message || 'Unable to sign out right now.');
    }
  };

  return (
    <div className="home-page">
      <nav className="top-nav">
        <div className="logo">Movie Library</div>
        <div className="nav-links">
          {navTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? 'active' : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        {user && (
          <div className="user-menu">
            <button
              type="button"
              className="user-chip user-trigger"
              onClick={() => setIsUserMenuOpen((open) => !open)}
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
            >
              <span>{profileName || user.email}</span>
              {isAdmin && <span className="admin-badge">Admin</span>}
              <span className="chevron">▾</span>
            </button>
            {isUserMenuOpen && (
              <div className="user-dropdown">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('profile');
                    setIsUserMenuOpen(false);
                  }}
                >
                  Edit profile
                </button>
                <button type="button" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
      <nav className="mobile-nav" aria-label="Primary">
        {navTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            <span className="mobile-nav-label">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
          </button>
        ))}
      </nav>

      {authStatus && <p className="status">{authStatus}</p>}

      {activeTab === 'browse' && (
        <>
          <section className="hero">
            <div className="hero-content">
              <p className="eyebrow">Featured</p>
              <h1>{featured.title}</h1>
              <p>{featured.description}</p>
              <div className="hero-meta">
                <span>{featured.genre}</span>
                <span>{featured.year}</span>
                <span>{featured.rating}</span>
              </div>
              <button className="primary">Watch Trailer</button>
            </div>
            <div className="hero-poster">
              <img src={featured.poster} alt={featured.title} />
            </div>
          </section>

          <section className="controls">
            <div className="search">
              <input
                type="text"
                placeholder="Search by title or genre"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="filters">
              <select value={selectedGenre} onChange={(event) => setSelectedGenre(event.target.value)}>
                {GENRES.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
              <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year === 'All' ? 'All years' : year}
                  </option>
                ))}
              </select>
              <select value={selectedScore} onChange={(event) => setSelectedScore(event.target.value)}>
                {RATING_FILTERS.map((rating) => (
                  <option key={rating.value} value={rating.value}>
                    {rating.label}
                  </option>
                ))}
              </select>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="recommendations">
            <header className="section-header">
              <p className="eyebrow">Recommendations</p>
              <h2>Personalized suggestions</h2>
              <p className="subtext">{recommendationsSummary}</p>
            </header>
            <div className="recommendations-grid">
              <div className="recommendation-card">
                <div className="recommendation-header">
                  <div>
                    <h3>Movie picks for you</h3>
                    <p>Based on your ratings, watch history, and saved titles.</p>
                  </div>
                  <span className="badge">Updated just now</span>
                </div>
                <div className="recommendation-list">
                  {recommendedMovies.map((movie) => (
                    <article key={movie.id} className="recommendation-item">
                      <img src={movie.poster} alt={movie.title} loading="lazy" />
                      <div className="recommendation-body">
                        <div>
                          <strong>{movie.title}</strong>
                          <span>
                            {movie.genre} • {movie.type} • {movie.year}
                          </span>
                        </div>
                        <p className="recommendation-reason">{renderRecommendationReason(movie)}</p>
                      </div>
                      <div className="recommendation-actions">
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => setSelectedMovie(movie)}
                        >
                          View details
                        </button>
                        <button type="button" onClick={() => handleAddToWatchlist(movie)}>
                          Save
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="recommendation-card">
                <div className="recommendation-header">
                  <div>
                    <h3>Trending now</h3>
                    <p>What the community is streaming this week.</p>
                  </div>
                </div>
                <div className="trend-grid">
                  {trendingMovies.map((movie) => (
                    <article key={movie.id} className="trend-card">
                      <div>
                        <p className="eyebrow">Trending</p>
                        <h4>{movie.title}</h4>
                        <span>
                          {movie.genre} • {movie.runtime}
                        </span>
                      </div>
                      <div className="trend-meta">
                        <span>★ {movie.score.toFixed(1)}</span>
                        <span>{movie.popularity}% buzz</span>
                      </div>
                      <button type="button" className="secondary" onClick={() => setSelectedMovie(movie)}>
                        Open
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="social-section">
            <header className="section-header">
              <p className="eyebrow">Social</p>
              <h2>Follow friends and share lists</h2>
              <p className="subtext">
                See what other members are watching, reviewing, and recommending right now.
              </p>
            </header>
            <div className="social-grid">
              <div className="social-card">
                <div className="social-header">
                  <h3>User reviews</h3>
                  <span className="badge">Live updates</span>
                </div>
                <ul className="social-list">
                  {SOCIAL_REVIEWS.map((review) => (
                    <li key={review.id}>
                      <div>
                        <strong>{review.reviewer}</strong>
                        <span>{renderMovieTitle(review.movieId)}</span>
                        <p>{review.comment}</p>
                      </div>
                      <div className="social-meta">
                        <span className="rating-chip">{'★'.repeat(review.rating)}</span>
                        <span className="social-time">{review.time}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="social-card">
                <div className="social-header">
                  <h3>People to follow</h3>
                  <span className="badge muted">Suggested</span>
                </div>
                <ul className="social-list">
                  {SOCIAL_FOLLOWING.map((member) => (
                    <li key={member.id}>
                      <div>
                        <strong>{member.name}</strong>
                        <span>{member.handle}</span>
                        <p>{member.focus}</p>
                      </div>
                      <div className="social-meta">
                        <span className="social-time">{member.followers} followers</span>
                        <button
                          type="button"
                          className={member.status === 'Following' ? 'secondary' : ''}
                        >
                          {member.status}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="social-card">
                <div className="social-header">
                  <h3>Shareable lists</h3>
                  <span className="badge">Community</span>
                </div>
                <div className="shareable-list">
                  {SHAREABLE_LISTS.map((list) => (
                    <article key={list.id} className="shareable-item">
                      <div>
                        <strong>{list.title}</strong>
                        <span>
                          Curated by {list.curator} · {list.followers} followers
                        </span>
                        <p>{list.movies.map((movieId) => renderMovieTitle(movieId)).join(' · ')}</p>
                      </div>
                      <button type="button" className="secondary">
                        Share list
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="catalog">
            <h2>Browse the catalog</h2>
            <div className="movie-grid">
              {filteredMovies.map((movie) => {
                const isSelected = selectedMovie?.id === movie.id;
                const selectedRating = ratings.find((entry) => entry.movieId === movie.id)?.rating || '';

                return (
                  <div key={movie.id} className="movie-grid-item">
                    <button
                      type="button"
                      className={`movie-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedMovie((prev) => (prev?.id === movie.id ? null : movie))}
                      aria-expanded={isSelected}
                    >
                      <img src={movie.poster} alt={movie.title} loading="lazy" />
                      <div className="movie-info">
                        <h3>{movie.title}</h3>
                        <p>
                          {movie.genre} • {movie.type}
                        </p>
                        <div className="movie-tags">
                          <span className="movie-score">★ {movie.score.toFixed(1)}</span>
                          <span className={`badge ${movie.availability === 'Request' ? 'warning' : ''}`}>
                            {movie.availability}
                          </span>
                        </div>
                      </div>
                      <span className="movie-card-chevron" aria-hidden="true">
                        {isSelected ? '▴' : '▾'}
                      </span>
                    </button>
                    {isSelected && (
                      <div className="movie-detail-dropdown">
                        <section className="detail-panel">
                          <div className="detail-content">
                            <div>
                              <p className="eyebrow">Selected title</p>
                              <h2>{movie.title}</h2>
                              <p>{movie.description}</p>
                              <div className="detail-meta">
                                <span>{movie.genre}</span>
                                <span>{movie.type}</span>
                                <span>{movie.year}</span>
                                <span>{movie.rating}</span>
                              </div>
                            </div>
                            <img src={movie.poster} alt={movie.title} />
                          </div>

                          <div className="detail-sections">
                            <div className="detail-card">
                              <h3>Movie details</h3>
                              <ul>
                                <li>
                                  <span>Director</span>
                                  <strong>{movie.director}</strong>
                                </li>
                                <li>
                                  <span>Runtime</span>
                                  <strong>{movie.runtime}</strong>
                                </li>
                                <li>
                                  <span>Release date</span>
                                  <strong>{movie.releaseDate}</strong>
                                </li>
                                <li>
                                  <span>Genres</span>
                                  <strong>{movie.genres.join(', ')}</strong>
                                </li>
                              </ul>
                            </div>
                            <div className="detail-card">
                              <h3>Cast & crew</h3>
                              <p>{movie.cast.join(' · ')}</p>
                            </div>
                            <div className="detail-card">
                              <h3>Ratings</h3>
                              <div className="rating-row">
                                <span>Audience score</span>
                                <strong>★ {movie.score.toFixed(1)} / 10</strong>
                              </div>
                              <div className="rating-row">
                                <span>Content rating</span>
                                <strong>{movie.rating}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="detail-actions">
                            <div>
                              <h3>Personalize</h3>
                              <p>Keep your watchlist, ratings, and history up to date.</p>
                            </div>
                            <div className="detail-action-grid">
                              <button
                                type="button"
                                className="secondary"
                                onClick={() => handleAddToWatchlist(movie)}
                              >
                                Add to watchlist
                              </button>
                              <button
                                type="button"
                                className="secondary"
                                onClick={() => handleHistoryMark(movie.id)}
                              >
                                Mark as watched
                              </button>
                              <label>
                                Rating
                                <select
                                  value={selectedRating}
                                  onChange={(event) => handleRatingChange(movie.id, event.target.value)}
                                >
                                  <option value="">Choose</option>
                                  <option value="5">★★★★★</option>
                                  <option value="4">★★★★</option>
                                  <option value="3">★★★</option>
                                  <option value="2">★★</option>
                                  <option value="1">★</option>
                                </select>
                              </label>
                            </div>
                          </div>

                          {movie.availability === 'Request' ? (
                            <form className="request-form" onSubmit={handleRequestSubmit}>
                              <h3>Request this title</h3>
                              <div className="request-fields">
                                <label>
                                  Your email
                                  <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={requestEmail}
                                    onChange={(event) => setRequestEmail(event.target.value)}
                                    readOnly={Boolean(user?.email)}
                                  />
                                </label>
                                <label>
                                  Delivery method
                                  <select
                                    value={deliveryMethod}
                                    onChange={(event) => setDeliveryMethod(event.target.value)}
                                  >
                                    <option value="USB">USB</option>
                                    <option value="Private Link">Private Link</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </label>
                                <label>
                                  Message (optional)
                                  <textarea
                                    rows="3"
                                    placeholder="Add any details for the admin team."
                                    value={requestMessage}
                                    onChange={(event) => setRequestMessage(event.target.value)}
                                  />
                                </label>
                              </div>
                              <button type="submit" className="primary">
                                Submit request
                              </button>
                              {requestStatus && <p className="status">{requestStatus}</p>}
                            </form>
                          ) : (
                            <div className="streaming-available">
                              <h3>Ready to watch</h3>
                              <p>Stream this title instantly from your library.</p>
                              <button className="primary">Play now</button>
                            </div>
                          )}

                          <div className="detail-extra">
                            <div className="detail-card">
                              <h3>Watch options</h3>
                              <ul className="option-list">
                                {movie.watchOptions.map((option) => (
                                  <li key={option.platform}>
                                    <strong>{option.platform}</strong>
                                    <span>{option.detail}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="detail-card">
                              <h3>Trailers & media</h3>
                              <div className="media-stack">
                                <div className="trailer-embed">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${movie.trailerId}`}
                                    title={`${movie.title} trailer`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                                <div className="media-grid">
                                  {movie.gallery.map((image) => (
                                    <img
                                      key={image}
                                      src={image}
                                      alt={`${movie.title} still`}
                                      loading="lazy"
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {filteredMovies.length === 0 && (
              <p className="status">No matches found. Try adjusting your filters.</p>
            )}
          </section>
        </>
      )}

      {activeTab === 'admin' && canViewAdmin && (
        <section className="admin-dashboard">
          <header className="admin-header">
            <div>
              <p className="eyebrow">Admin Dashboard</p>
              <h2>Operational control center</h2>
              <p className="subtext">
                Manage the catalog, approve member requests, and keep user accounts healthy.
              </p>
            </div>
            <div className="admin-actions">
              <button type="button" className="secondary">
                Export report
              </button>
              <button type="button">Add new movie</button>
            </div>
          </header>

          <div className="admin-metrics">
            {ADMIN_METRICS.map((metric) => (
              <div key={metric.label} className="admin-metric">
                <p className="eyebrow">{metric.label}</p>
                <h3>{metric.value}</h3>
                <span>{metric.detail}</span>
              </div>
            ))}
          </div>

          <div className="admin-grid">
            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3>Manage movies</h3>
                  <p>Add, edit, or remove titles from the catalog.</p>
                </div>
                <button type="button" className="secondary">
                  Upload assets
                </button>
              </div>
              <ul className="admin-list">
                {ADMIN_MOVIES.map((movie) => (
                  <li key={movie.id}>
                    <div>
                      <strong>{movie.title}</strong>
                      <span>
                        {movie.status} · Updated {movie.updated} · {movie.owner}
                      </span>
                    </div>
                    <div className="admin-row-actions">
                      <button type="button" className="secondary">
                        Edit
                      </button>
                      <button type="button">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3>Manage requests</h3>
                  <p>Approve or reject incoming member requests.</p>
                </div>
                <button type="button" className="secondary">
                  Review queue
                </button>
              </div>
              <ul className="admin-list">
                {ADMIN_REQUESTS.map((request) => (
                  <li key={request.id}>
                    <div>
                      <strong>{request.title}</strong>
                      <span>
                        Requested by {request.requestedBy} · {request.timeframe}
                      </span>
                      <em>{request.notes}</em>
                    </div>
                    <div className="admin-row-actions">
                      <button type="button">Approve</button>
                      <button type="button" className="secondary">
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3>User management</h3>
                  <p>Reset passwords, update roles, and review member status.</p>
                </div>
                <button type="button" className="secondary">
                  Invite admin
                </button>
              </div>
              <ul className="admin-list">
                {ADMIN_USERS.map((member) => (
                  <li key={member.id}>
                    <div>
                      <strong>{member.name}</strong>
                      <span>{member.email}</span>
                      <div className="admin-tags">
                        <span className="admin-pill">{member.role}</span>
                        <span className="admin-pill muted">{member.status}</span>
                      </div>
                    </div>
                    <div className="admin-row-actions">
                      <button type="button" className="secondary">
                        Reset password
                      </button>
                      <button type="button">Change role</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'watchlist' && (
        <section className="profile-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Your library</p>
              <h2>Watchlist</h2>
              <p>Keep track of the movies and series you want to see next.</p>
            </div>
          </div>
          <div className="list-grid">
            {watchlist.length === 0 && <p className="status">Your watchlist is empty.</p>}
            {watchlist.map((entry) => (
              <div key={entry.movieId} className="list-card">
                <div>
                  <h3>{renderMovieTitle(entry.movieId)}</h3>
                  <p>{renderMovieMeta(entry.movieId)}</p>
                </div>
                <button type="button" className="secondary" onClick={() => handleRemoveFromWatchlist(entry.movieId)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'requests' && (
        <section className="profile-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Requests</p>
              <h2>Manage your delivery requests</h2>
              <p>Track your requests and submit new ones from the catalog.</p>
            </div>
          </div>
          <div className="request-summary">
            <p>
              Select a title on the Browse tab to submit a request, or keep this page open to monitor
              updates from the admin team.
            </p>
            {requestStatus && <p className="status">{requestStatus}</p>}
          </div>
        </section>
      )}

      {activeTab === 'profile' && (
        <section className="profile-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Profile</p>
              <h2>Manage your account</h2>
              <p>Update your details and review your activity at a glance.</p>
            </div>
          </div>
          <form className="profile-form" onSubmit={handleProfileSave}>
            <label>
              Display name
              <input
                type="text"
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
              />
            </label>
            <label>
              Profile photo URL
              <input
                type="text"
                placeholder="https://"
                value={profileAvatar}
                onChange={(event) => setProfileAvatar(event.target.value)}
              />
            </label>
            <label>
              About you
              <textarea
                rows="3"
                placeholder="Tell your movie crew what you like."
                value={profileBio}
                onChange={(event) => setProfileBio(event.target.value)}
              />
            </label>
            <button type="submit" className="primary">
              Save profile
            </button>
            {profileStatus && <p className="status">{profileStatus}</p>}
          </form>

          <div className="profile-lists">
            <div className="profile-card">
              <h3>Ratings</h3>
              {ratings.length === 0 ? (
                <p className="status">No ratings yet.</p>
              ) : (
                <ul>
                  {ratings.map((entry) => (
                    <li key={entry.movieId}>
                      <div>
                        <strong>{renderMovieTitle(entry.movieId)}</strong>
                        <span>{renderMovieMeta(entry.movieId)}</span>
                      </div>
                      <span className="rating-chip">{'★'.repeat(Number(entry.rating || 0))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="profile-card">
              <h3>Watch history</h3>
              {history.length === 0 ? (
                <p className="status">No watch history yet.</p>
              ) : (
                <ul>
                  {history.map((entry) => (
                    <li key={entry.movieId}>
                      <div>
                        <strong>{renderMovieTitle(entry.movieId)}</strong>
                        <span>{renderMovieMeta(entry.movieId)}</span>
                      </div>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => handleHistoryRemove(entry.movieId)}
                      >
                        Clear
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
