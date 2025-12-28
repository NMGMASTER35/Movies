import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase, isAdminUser } from '../services/supabaseClient';
import {
  addLocalMovie,
  addLocalRequest,
  clearSessionUser,
  getSessionUser,
  loadLocalState,
  saveLocalState,
  updateLocalProfile,
} from '../services/localDatabase';
import {
  ADMIN_METRICS,
  ADMIN_MOVIES,
  ADMIN_REQUESTS,
  ADMIN_USERS,
  MOVIES,
  SHAREABLE_LISTS,
  SOCIAL_FOLLOWING,
  SOCIAL_REVIEWS,
} from '../services/seedData';

const normalizeMovie = (movie) => {
  const genres = Array.isArray(movie.genres)
    ? movie.genres
    : Array.isArray(movie.genre)
    ? movie.genre
    : movie.genre
    ? [movie.genre]
    : [];
  const watchOptions = Array.isArray(movie.watch_options)
    ? movie.watch_options
    : Array.isArray(movie.watchOptions)
    ? movie.watchOptions
    : [];
  const gallery = Array.isArray(movie.gallery) ? movie.gallery : [];
  const cast = Array.isArray(movie.cast) ? movie.cast : [];

  return {
    id: movie.id,
    title: movie.title || 'Untitled',
    genre: movie.genre || genres[0] || 'Unknown',
    genres,
    type: movie.type || 'Movie',
    year: Number(movie.year) || null,
    runtime: movie.runtime || '',
    rating: movie.rating || '',
    score: Number(movie.score) || 0,
    popularity: Number(movie.popularity) || 0,
    releaseDate: movie.release_date || movie.releaseDate || '',
    availability: movie.availability || 'Streaming',
    director: movie.director || '',
    cast,
    watchOptions,
    trailerId: movie.trailer_id || movie.trailerId || '',
    gallery,
    poster: movie.poster || '',
    description: movie.description || '',
    featured: Boolean(movie.featured),
  };
};
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
  const DEMO_USER = useMemo(
    () => ({
      id: 'demo-user',
      email: 'demo@movielibrary.app',
      user_metadata: {
        full_name: 'Demo Member',
        avatar_url: '',
        bio: 'Exploring the catalog in demo mode.',
      },
    }),
    [],
  );
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
  const [movies, setMovies] = useState(MOVIES);
  const [adminMetrics, setAdminMetrics] = useState(ADMIN_METRICS);
  const [adminMovies, setAdminMovies] = useState(ADMIN_MOVIES);
  const [adminRequests, setAdminRequests] = useState(ADMIN_REQUESTS);
  const [adminUsers, setAdminUsers] = useState(ADMIN_USERS);
  const [socialReviews, setSocialReviews] = useState(SOCIAL_REVIEWS);
  const [socialFollowing, setSocialFollowing] = useState(SOCIAL_FOLLOWING);
  const [shareableLists, setShareableLists] = useState(SHAREABLE_LISTS);
  const [isAddingMovie, setIsAddingMovie] = useState(false);
  const [newMovieForm, setNewMovieForm] = useState({
    title: '',
    genre: 'Action',
    type: 'Movie',
    availability: 'Streaming',
    year: new Date().getFullYear(),
    runtime: '',
    rating: 'PG',
    description: '',
    director: '',
    poster: '',
  });
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
  }, [supabase, user]);
  const movieMap = useMemo(() => new Map(movies.map((movie) => [movie.id, movie])), [movies]);

  useEffect(() => {
    const state = loadLocalState();

    setMovies((state.movies || MOVIES).map(normalizeMovie));
    setAdminMetrics(state.adminMetrics || ADMIN_METRICS);
    setAdminMovies(state.adminMovies || ADMIN_MOVIES);
    setAdminRequests(state.adminRequests || ADMIN_REQUESTS);
    setAdminUsers(state.adminUsers || ADMIN_USERS);
    setSocialReviews(state.socialReviews || SOCIAL_REVIEWS);
    setSocialFollowing(state.socialFollowing || SOCIAL_FOLLOWING);
    setShareableLists(state.shareableLists || SHAREABLE_LISTS);
  }, []);

  useEffect(() => {
    if (supabase) {
      return;
    }

    const sessionUser = getSessionUser();
    if (sessionUser) {
      setUser(sessionUser);
      setProfileName(sessionUser.user_metadata?.full_name || '');
      setProfileAvatar(sessionUser.user_metadata?.avatar_url || '');
      setProfileBio(sessionUser.user_metadata?.bio || '');
      return;
    }

    setUser(DEMO_USER);
  }, [DEMO_USER, supabase]);

  useEffect(() => {
    if (!supabase) {
      setAuthStatus('Using local account storage. Connect Supabase to sync across devices.');
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
  }, [supabase, user]);

  useEffect(() => {
    if (!storageKey || (supabase && user?.id)) {
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
  }, [storageKey, supabase, user]);

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
  }, [supabase, user]);

  useEffect(() => {
    if (!storageKey || (supabase && user?.id)) {
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
  }, [storageKey, watchlist, ratings, history, profileName, profileAvatar, profileBio, supabase, user]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    const loadContent = async () => {
      try {
        const [
          moviesResult,
          metricsResult,
          adminMoviesResult,
          adminRequestsResult,
          adminUsersResult,
          reviewsResult,
          followingResult,
          listsResult,
        ] = await Promise.all([
          supabase.from('movies').select('*'),
          supabase.from('admin_metrics').select('*'),
          supabase.from('admin_movies').select('*'),
          supabase.from('admin_requests').select('*'),
          supabase.from('admin_users').select('*'),
          supabase.from('social_reviews').select('*'),
          supabase.from('social_following').select('*'),
          supabase.from('shareable_lists').select('*'),
        ]);

        if (!isMounted) {
          return;
        }

        if (!moviesResult.error && moviesResult.data?.length) {
          setMovies(moviesResult.data.map(normalizeMovie));
        }

        if (!metricsResult.error && metricsResult.data?.length) {
          setAdminMetrics(metricsResult.data);
        }

        if (!adminMoviesResult.error && adminMoviesResult.data?.length) {
          setAdminMovies(adminMoviesResult.data);
        }

        if (!adminRequestsResult.error && adminRequestsResult.data?.length) {
          setAdminRequests(adminRequestsResult.data);
        }

        if (!adminUsersResult.error && adminUsersResult.data?.length) {
          setAdminUsers(adminUsersResult.data);
        }

        if (!reviewsResult.error && reviewsResult.data?.length) {
          setSocialReviews(reviewsResult.data);
        }

        if (!followingResult.error && followingResult.data?.length) {
          setSocialFollowing(followingResult.data);
        }

        if (!listsResult.error && listsResult.data?.length) {
          setShareableLists(
            listsResult.data.map((list) => ({
              ...list,
              movies: Array.isArray(list.movies) ? list.movies : [],
            }))
          );
        }
      } catch (error) {
        // Ignore content load failures; fallback data will remain.
      }
    };

    loadContent();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !user?.id) {
      return;
    }

    let isMounted = true;

    const loadLibrary = async () => {
      try {
        const [watchlistResult, ratingsResult, historyResult] = await Promise.all([
          supabase.from('watchlist').select('movie_id, added_at').eq('user_id', user.id),
          supabase.from('ratings').select('movie_id, rating, updated_at').eq('user_id', user.id),
          supabase.from('history').select('movie_id, watched_at').eq('user_id', user.id),
        ]);

        if (!isMounted) {
          return;
        }

        if (!watchlistResult.error && watchlistResult.data) {
          setWatchlist(
            watchlistResult.data.map((entry) => ({
              movieId: entry.movie_id,
              addedAt: entry.added_at,
            }))
          );
        }

        if (!ratingsResult.error && ratingsResult.data) {
          setRatings(
            ratingsResult.data.map((entry) => ({
              movieId: entry.movie_id,
              rating: entry.rating,
              updatedAt: entry.updated_at,
            }))
          );
        }

        if (!historyResult.error && historyResult.data) {
          setHistory(
            historyResult.data.map((entry) => ({
              movieId: entry.movie_id,
              watchedAt: entry.watched_at,
            }))
          );
        }
      } catch (error) {
        // Ignore library load failures; local state remains.
      }
    };

    loadLibrary();

    return () => {
      isMounted = false;
    };
  }, [supabase, user]);

  useEffect(() => {
    if (supabase) {
      return;
    }

    saveLocalState({
      movies,
      adminMetrics,
      adminMovies,
      adminRequests,
      adminUsers,
      socialReviews,
      socialFollowing,
      shareableLists,
    });
  }, [
    adminMetrics,
    adminMovies,
    adminRequests,
    adminUsers,
    movies,
    shareableLists,
    socialFollowing,
    socialReviews,
    supabase,
  ]);

  const featured = movies.find((movie) => movie.featured) || movies[0] || {};
  const availableYears = useMemo(() => {
    const years = [...new Set(movies.map((movie) => movie.year).filter(Boolean))];
    return ['All', ...years.sort((a, b) => b - a)];
  }, [movies]);
  const availableGenres = useMemo(() => {
    const genreSet = new Set();
    movies.forEach((movie) => {
      if (movie.genre) {
        genreSet.add(movie.genre);
      }
      movie.genres?.forEach((genre) => genreSet.add(genre));
    });

    return ['All', ...Array.from(genreSet).sort()];
  }, [movies]);
  const availableTypes = useMemo(() => {
    const typeSet = new Set();
    movies.forEach((movie) => {
      if (movie.type) {
        typeSet.add(movie.type);
      }
    });
    return ['All', ...Array.from(typeSet).sort()];
  }, [movies]);
  const favoriteGenres = useMemo(() => {
    const genreCounts = {};

    const addGenres = (movieId, weight) => {
      const movie = movieMap.get(movieId);
      if (!movie) {
        return;
      }

      const genres = movie.genres?.length ? movie.genres : movie.genre ? [movie.genre] : [];
      genres.forEach((genre) => {
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

    return movies
      .filter((movie) => !seenIds.has(movie.id))
      .map((movie) => {
        let score = movie.score * 10 + movie.popularity;
        if (boostedGenres.size && (movie.genres || []).some((genre) => boostedGenres.has(genre))) {
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
  }, [favoriteGenres, history, movies, watchlist]);
  const trendingMovies = useMemo(
    () => [...movies].sort((a, b) => b.popularity - a.popularity).slice(0, 3),
    [movies],
  );
  const recommendationsSummary = favoriteGenres.length
    ? `Tailored from your love of ${favoriteGenres.join(' & ')} stories.`
    : 'Personalized using your ratings, watchlist, and recent plays.';

  const filteredMovies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const minScore = selectedScore === 'All' ? null : Number(selectedScore);

    const filtered = movies.filter((movie) => {
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
  }, [movies, searchTerm, selectedGenre, selectedType, selectedYear, selectedScore, sortBy]);

  const handleAddToWatchlist = (movie) => {
    const timestamp = new Date().toISOString();
    setWatchlist((prev) => {
      if (prev.some((item) => item.movieId === movie.id)) {
        return prev;
      }
      return [...prev, { movieId: movie.id, addedAt: timestamp }];
    });

    if (supabase && user?.id) {
      supabase
        .from('watchlist')
        .upsert({ user_id: user.id, movie_id: movie.id, added_at: timestamp }, { onConflict: 'user_id,movie_id' });
    }
  };

  const handleRemoveFromWatchlist = (movieId) => {
    setWatchlist((prev) => prev.filter((item) => item.movieId !== movieId));

    if (supabase && user?.id) {
      supabase.from('watchlist').delete().eq('user_id', user.id).eq('movie_id', movieId);
    }
  };

  const handleRatingChange = (movieId, rating) => {
    const timestamp = new Date().toISOString();
    setRatings((prev) => {
      const existing = prev.find((entry) => entry.movieId === movieId);
      if (existing) {
        return prev.map((entry) =>
          entry.movieId === movieId ? { ...entry, rating, updatedAt: timestamp } : entry
        );
      }
      return [...prev, { movieId, rating, updatedAt: timestamp }];
    });

    if (supabase && user?.id) {
      supabase
        .from('ratings')
        .upsert(
          { user_id: user.id, movie_id: movieId, rating, updated_at: timestamp },
          { onConflict: 'user_id,movie_id' }
        );
    }
  };

  const handleHistoryMark = (movieId) => {
    const timestamp = new Date().toISOString();
    setHistory((prev) => {
      const existing = prev.find((entry) => entry.movieId === movieId);
      if (existing) {
        return prev.map((entry) =>
          entry.movieId === movieId ? { ...entry, watchedAt: timestamp } : entry
        );
      }
      return [...prev, { movieId, watchedAt: timestamp }];
    });

    if (supabase && user?.id) {
      supabase
        .from('history')
        .upsert(
          { user_id: user.id, movie_id: movieId, watched_at: timestamp },
          { onConflict: 'user_id,movie_id' }
        );
    }
  };

  const handleHistoryRemove = (movieId) => {
    setHistory((prev) => prev.filter((entry) => entry.movieId !== movieId));

    if (supabase && user?.id) {
      supabase.from('history').delete().eq('user_id', user.id).eq('movie_id', movieId);
    }
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setProfileStatus('');

    if (!profileName) {
      setProfileStatus('Please provide a name for your profile.');
      return;
    }

    if (!supabase) {
      const updated = updateLocalProfile(user?.id, {
        full_name: profileName,
        avatar_url: profileAvatar,
        bio: profileBio,
      });

      if (!updated) {
        setProfileStatus('Unable to update your local profile. Please try again.');
        return;
      }

      setUser(updated);
      setProfileStatus('Profile updated successfully (local mode).');
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

  const renderMovieTitle = (movieId) => movieMap.get(movieId)?.title || 'Unknown';

  const renderMovieMeta = (movieId) => {
    const movie = movieMap.get(movieId);
    if (!movie) {
      return '';
    }
    return [movie.genre, movie.type].filter(Boolean).join(' • ');
  };

  const renderRecommendationReason = (movie) => {
    const matchingGenre = favoriteGenres.find((genre) => (movie.genres || []).includes(genre));
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
      const newRequest = addLocalRequest({
        movieId: selectedMovie.id,
        title: selectedMovie.title,
        type: selectedMovie.type,
        requesterEmail,
        userId: user?.id || requesterEmail,
        message: requestMessage,
        deliveryMethod,
      });
      setAdminRequests((prev) => [newRequest, ...prev]);
      setRequestStatus('Request saved locally. Admins can review it from the dashboard.');
      setRequestMessage('');
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

  const handleNewMovieSubmit = (event) => {
    event.preventDefault();

    if (!newMovieForm.title || !newMovieForm.genre || !newMovieForm.type) {
      setAuthStatus('Please provide a title, genre, and type for the new entry.');
      return;
    }

    const createdMovie = addLocalMovie({
      ...newMovieForm,
      addedBy: profileName || user?.email || 'Local admin',
    });
    const normalizedMovie = normalizeMovie(createdMovie);

    setMovies((prev) => [normalizedMovie, ...prev]);
    setAdminMovies((prev) => [
      {
        id: `admin-${createdMovie.id}`,
        title: createdMovie.title,
        status: 'New',
        updated: 'Just now',
        owner: profileName || user?.email || 'Local admin',
      },
      ...prev,
    ]);
    setAdminMetrics((prev) =>
      prev.map((metric) =>
        metric.label === 'Catalog titles'
          ? { ...metric, value: String((movies?.length || 0) + 1), detail: 'Includes locally added titles' }
          : metric,
      ),
    );
    setIsAddingMovie(false);
    setSelectedMovie(normalizedMovie);
    setActiveTab('browse');
    setNewMovieForm({
      title: '',
      genre: 'Action',
      type: 'Movie',
      availability: 'Streaming',
      year: new Date().getFullYear(),
      runtime: '',
      rating: 'PG',
      description: '',
      director: '',
      poster: '',
    });
  };

  const handleSignOut = async () => {
    if (!supabase) {
      clearSessionUser();
      setUser(null);
      router.push('/');
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
                {availableGenres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
              <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
                {availableTypes.map((type) => (
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
                  {socialReviews.map((review) => (
                    <li key={review.id}>
                      <div>
                        <strong>{review.reviewer}</strong>
                        <span>{renderMovieTitle(review.movie_id || review.movieId)}</span>
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
                  {socialFollowing.map((member) => (
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
                  {shareableLists.map((list) => (
                    <article key={list.id} className="shareable-item">
                      <div>
                        <strong>{list.title}</strong>
                        <span>
                          Curated by {list.curator} · {list.followers} followers
                        </span>
                        <p>
                          {(list.movies || []).map((movieId) => renderMovieTitle(movieId)).join(' · ')}
                        </p>
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
                                  <strong>{(movie.genres || []).join(', ')}</strong>
                                </li>
                              </ul>
                            </div>
                            <div className="detail-card">
                              <h3>Cast & crew</h3>
                              <p>{(movie.cast || []).join(' · ')}</p>
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
                                {(movie.watchOptions || []).map((option) => (
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
                                  {(movie.gallery || []).map((image) => (
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
              <button type="button" onClick={() => setIsAddingMovie((open) => !open)}>
                {isAddingMovie ? 'Close form' : 'Add new movie'}
              </button>
            </div>
          </header>

          {isAddingMovie && (
            <form className="admin-add-form" onSubmit={handleNewMovieSubmit}>
              <div className="admin-add-grid">
                <label>
                  Title
                  <input
                    type="text"
                    value={newMovieForm.title}
                    onChange={(event) => setNewMovieForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="New release title"
                  />
                </label>
                <label>
                  Genre
                  <input
                    type="text"
                    value={newMovieForm.genre}
                    onChange={(event) => setNewMovieForm((prev) => ({ ...prev, genre: event.target.value }))}
                    placeholder="Drama, Action..."
                  />
                </label>
                <label>
                  Type
                  <select
                    value={newMovieForm.type}
                    onChange={(event) => setNewMovieForm((prev) => ({ ...prev, type: event.target.value }))}
                  >
                    <option value="Movie">Movie</option>
                    <option value="Series">Series</option>
                  </select>
                </label>
                <label>
                  Year
                  <input
                    type="number"
                    value={newMovieForm.year}
                    onChange={(event) => setNewMovieForm((prev) => ({ ...prev, year: event.target.value }))}
                    min="1950"
                    max="2100"
                  />
                </label>
                <label>
                  Runtime / Episodes
                  <input
                    type="text"
                    value={newMovieForm.runtime}
                    onChange={(event) => setNewMovieForm((prev) => ({ ...prev, runtime: event.target.value }))}
                    placeholder="2h 10m"
                  />
                </label>
                <label>
                  Rating
                  <input
                    type="text"
                    value={newMovieForm.rating}
                    onChange={(event) => setNewMovieForm((prev) => ({ ...prev, rating: event.target.value }))}
                    placeholder="PG-13"
                  />
                </label>
                <label>
                  Availability
                  <select
                    value={newMovieForm.availability}
                    onChange={(event) =>
                      setNewMovieForm((prev) => ({ ...prev, availability: event.target.value }))
                    }
                  >
                    <option value="Streaming">Streaming</option>
                    <option value="Request">Request</option>
                  </select>
                </label>
                <label>
                  Director
                  <input
                    type="text"
                    value={newMovieForm.director}
                    onChange={(event) => setNewMovieForm((prev) => ({ ...prev, director: event.target.value }))}
                    placeholder="Director name"
                  />
                </label>
              </div>
              <label>
                Poster URL
                <input
                  type="url"
                  value={newMovieForm.poster}
                  onChange={(event) => setNewMovieForm((prev) => ({ ...prev, poster: event.target.value }))}
                  placeholder="https://example.com/poster.jpg"
                />
              </label>
              <label>
                Description
                <textarea
                  rows="3"
                  value={newMovieForm.description}
                  onChange={(event) => setNewMovieForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Short synopsis for the catalog."
                />
              </label>
              <div className="admin-add-actions">
                <button type="button" className="secondary" onClick={() => setIsAddingMovie(false)}>
                  Cancel
                </button>
                <button type="submit">Save to catalog</button>
              </div>
            </form>
          )}

          <div className="admin-metrics">
            {adminMetrics.map((metric) => (
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
                {adminMovies.map((movie) => (
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
                {adminRequests.map((request) => (
                  <li key={request.id}>
                    <div>
                      <strong>{request.title}</strong>
                      <span>
                        Requested by {request.requested_by || request.requestedBy} · {request.timeframe}
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
                {adminUsers.map((member) => (
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
