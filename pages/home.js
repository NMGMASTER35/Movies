import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase, isAdminUser } from '../services/supabaseClient';

const normalizeMovie = (movie) => ({
  id: movie.id,
  title: movie.title,
  description: movie.description || '',
  genre: movie.genre || 'Unknown',
  genres: Array.isArray(movie.genres) ? movie.genres : movie.genre ? [movie.genre] : [],
  type: movie.type || 'Movie',
  year: movie.year,
  rating: movie.rating || '',
  runtime: movie.runtime || '',
  availability: movie.availability || 'Request',
  usbLocation: movie.usb_location || '',
  trailerId: movie.trailer_id || '',
  watchOptions: Array.isArray(movie.watch_options) ? movie.watch_options : [],
  poster: movie.poster || 'https://via.placeholder.com/300x450.png?text=N%26M+Movies',
  director: movie.director || '',
  cast: Array.isArray(movie.cast) ? movie.cast : [],
  score: Number(movie.score) || 0,
  popularity: Number(movie.popularity) || 0,
  featured: Boolean(movie.featured),
});

const ratingFilters = [
  { label: 'All ratings', value: 'All' },
  { label: '9+ score', value: '9' },
  { label: '8+ score', value: '8' },
  { label: '7+ score', value: '7' },
  { label: '6+ score', value: '6' },
];

const sortOptions = [
  { label: 'Sort by popularity', value: 'popularity' },
  { label: 'Newest releases', value: 'newest' },
  { label: 'Oldest releases', value: 'oldest' },
  { label: 'Highest rated', value: 'rating' },
];

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedScore, setSelectedScore] = useState('All');
  const [sortBy, setSortBy] = useState('popularity');
  const [watchlist, setWatchlist] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [inviteList, setInviteList] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingMessage, setLoadingMessage] = useState('Loading your account…');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [newMovieForm, setNewMovieForm] = useState({
    title: '',
    genre: 'Action',
    type: 'Movie',
    availability: 'Request',
    year: new Date().getFullYear(),
    runtime: '',
    rating: 'PG-13',
    description: '',
    director: '',
    trailerId: '',
    usbLocation: '',
    poster: '',
  });
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' });
  const [requestMessage, setRequestMessage] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('USB');
  const [requestStatus, setRequestStatus] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAdmin = useMemo(() => isAdminUser(user || profile), [user, profile]);
  const movieMap = useMemo(() => new Map(movies.map((movie) => [movie.id, movie])), [movies]);

  useEffect(() => {
    if (user && !profile) {
      setProfile({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email,
        avatar_url: user.user_metadata?.avatar_url || '',
        bio: user.user_metadata?.bio || '',
        role: user.user_metadata?.role || 'member',
      });
    }
  }, [profile, user]);

  useEffect(() => {
    if (!supabase) {
      setError(
        'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      );
      return;
    }

    const hydrateSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      const currentUser = data?.session?.user;
      if (!currentUser) {
        router.replace('/');
        return;
      }

      setUser(currentUser);
    };

    hydrateSession();

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const activeUser = session?.user;
      setUser(activeUser);
      if (!activeUser) {
        router.replace('/');
      }
    });

    return () => authSubscription?.subscription?.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!supabase || !user?.id) {
      return;
    }

    const loadData = async () => {
      setLoadingMessage('Fetching catalog and account data…');
      setError('');

      try {
        const [
          moviesResult,
          profileResult,
          watchlistResult,
          favoritesResult,
          ratingsResult,
          myRequestsResult,
          adminRequestsResult,
          inviteResult,
          usersResult,
        ] = await Promise.all([
          supabase.from('movies').select('*').order('popularity', { ascending: false }),
          supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
          supabase.from('watchlist').select('movie_id').eq('user_id', user.id),
          supabase.from('favorites').select('movie_id').eq('user_id', user.id),
          supabase.from('ratings').select('movie_id, rating').eq('user_id', user.id),
          supabase
            .from('requests')
            .select('id, movie_id, status, delivery_method, message, created_at, updated_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('requests')
            .select(
              'id, movie_id, status, delivery_method, message, created_at, updated_at, requester_email, user_id'
            )
            .order('created_at', { ascending: false }),
          supabase.from('invites').select('*').order('created_at', { ascending: false }),
          supabase.from('profiles').select('id, email, full_name, role, updated_at'),
        ]);

        if (moviesResult.error) throw moviesResult.error;
        setMovies((moviesResult.data || []).map(normalizeMovie));

        if (!profileResult.error && profileResult.data) {
          setProfile(profileResult.data);
        }

        if (!watchlistResult.error && watchlistResult.data) {
          setWatchlist(watchlistResult.data.map((entry) => entry.movie_id));
        }

        if (!favoritesResult.error && favoritesResult.data) {
          setFavorites(favoritesResult.data.map((entry) => entry.movie_id));
        }

        if (!ratingsResult.error && ratingsResult.data) {
          setRatings(ratingsResult.data);
        }

        if (!myRequestsResult.error && myRequestsResult.data) {
          setMyRequests(myRequestsResult.data);
        }

        if (!adminRequestsResult.error && adminRequestsResult.data && isAdmin) {
          setRequests(adminRequestsResult.data);
        } else {
          setRequests([]);
        }

        if (!inviteResult.error && inviteResult.data && isAdmin) {
          setInviteList(inviteResult.data);
        } else {
          setInviteList([]);
        }

        if (!usersResult.error && usersResult.data && isAdmin) {
          setUsers(usersResult.data);
        } else {
          setUsers([]);
        }

        setLoadingMessage('');
      } catch (loadError) {
        setError(loadError.message || 'Unable to load data.');
        setLoadingMessage('');
      }
    };

    loadData();
  }, [isAdmin, user]);

  const availableYears = useMemo(() => {
    const years = [...new Set(movies.map((movie) => movie.year).filter(Boolean))];
    return ['All', ...years.sort((a, b) => b - a)];
  }, [movies]);

  const availableGenres = useMemo(() => {
    const genres = new Set();
    movies.forEach((movie) => {
      if (movie.genre) genres.add(movie.genre);
      (movie.genres || []).forEach((genre) => genres.add(genre));
    });
    return ['All', ...Array.from(genres).sort()];
  }, [movies]);

  const availableTypes = useMemo(() => {
    const types = new Set();
    movies.forEach((movie) => movie.type && types.add(movie.type));
    return ['All', ...Array.from(types).sort()];
  }, [movies]);

  const filteredMovies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const minScore = selectedScore === 'All' ? null : Number(selectedScore);

    const filtered = movies.filter((movie) => {
      const searchable = [
        movie.title,
        movie.genre,
        ...(movie.genres || []),
        movie.type,
        movie.director,
        ...(movie.cast || []),
        movie.usbLocation,
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
          return (b.year || 0) - (a.year || 0);
        case 'oldest':
          return (a.year || 0) - (b.year || 0);
        case 'rating':
          return b.score - a.score;
        case 'popularity':
        default:
          return b.popularity - a.popularity;
      }
    });
  }, [movies, searchTerm, selectedGenre, selectedType, selectedYear, selectedScore, sortBy]);

  const featured = movies.find((movie) => movie.featured) || movies[0] || {};

  const renderMovieTitle = (movieId) => movieMap.get(movieId)?.title || 'Unknown';
  const renderMovieMeta = (movieId) => {
    const movie = movieMap.get(movieId);
    if (!movie) return '';
    return [movie.genre, movie.type, movie.year].filter(Boolean).join(' • ');
  };

  const toggleWatchlist = async (movieId) => {
    if (!supabase || !user) return;

    const isSaved = watchlist.includes(movieId);
    setWatchlist((prev) => (isSaved ? prev.filter((id) => id !== movieId) : [...prev, movieId]));

    if (isSaved) {
      await supabase.from('watchlist').delete().eq('user_id', user.id).eq('movie_id', movieId);
    } else {
      await supabase.from('watchlist').upsert({ user_id: user.id, movie_id: movieId });
    }
  };

  const toggleFavorite = async (movieId) => {
    if (!supabase || !user) return;

    const isSaved = favorites.includes(movieId);
    setFavorites((prev) => (isSaved ? prev.filter((id) => id !== movieId) : [...prev, movieId]));

    if (isSaved) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('movie_id', movieId);
    } else {
      await supabase.from('favorites').upsert({ user_id: user.id, movie_id: movieId });
    }
  };

  const handleRatingChange = async (movieId, rating) => {
    if (!supabase || !user) return;

    const parsedRating = Number(rating);
    setRatings((prev) => {
      const existing = prev.find((entry) => entry.movie_id === movieId);
      if (existing) {
        return prev.map((entry) => (entry.movie_id === movieId ? { ...entry, rating: parsedRating } : entry));
      }
      return [...prev, { movie_id: movieId, rating: parsedRating }];
    });

    await supabase.from('ratings').upsert({ user_id: user.id, movie_id: movieId, rating: parsedRating });
  };

  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    setRequestStatus('');
    if (!supabase || !user || !selectedMovie) return;

    const { error: requestError } = await supabase.from('requests').insert([
      {
        movie_id: selectedMovie.id,
        user_id: user.id,
        requester_email: user.email,
        message: requestMessage,
        delivery_method: deliveryMethod,
        status: 'OPEN',
      },
    ]);

    if (requestError) {
      setRequestStatus(requestError.message || 'Unable to submit request.');
      return;
    }

    setRequestStatus('Request submitted. Track updates on the My Requests tab.');
    setRequestMessage('');

    const { data: refreshed } = await supabase
      .from('requests')
      .select('id, movie_id, status, delivery_method, message, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setMyRequests(refreshed || []);
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    if (!supabase || !user) return;
    setIsSavingProfile(true);
    setStatusMessage('');
    setError('');

    const payload = {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || '',
      avatar_url: profile?.avatar_url || '',
      bio: profile?.bio || '',
      role: profile?.role || 'member',
    };

    const { error: profileError } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: payload.full_name, avatar_url: payload.avatar_url, bio: payload.bio, role: payload.role },
    });

    if (profileError || authError) {
      setError(profileError?.message || authError?.message || 'Unable to update profile.');
    } else {
      setStatusMessage('Profile saved.');
    }
    setIsSavingProfile(false);
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace('/');
  };

  const handleCreateInvite = async () => {
    if (!supabase || !inviteForm.email) {
      setStatusMessage('Invite email is required.');
      return;
    }
    const code = `NM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { error: inviteError } = await supabase.from('invites').insert([
      {
        email: inviteForm.email,
        code,
        role: inviteForm.role,
        created_by: user.id,
      },
    ]);

    if (inviteError) {
      setStatusMessage(inviteError.message || 'Unable to create invite.');
      return;
    }

    const { data } = await supabase.from('invites').select('*').order('created_at', { ascending: false });
    setInviteList(data || []);
    setInviteForm({ email: '', role: 'member' });
    setStatusMessage('Invite created.');
  };

  const handleRevokeInvite = async (inviteId) => {
    if (!supabase) return;
    const { error: revokeError } = await supabase.from('invites').update({ revoked: true }).eq('id', inviteId);
    if (revokeError) {
      setStatusMessage(revokeError.message || 'Unable to revoke invite.');
      return;
    }
    const { data } = await supabase.from('invites').select('*').order('created_at', { ascending: false });
    setInviteList(data || []);
  };

  const handleRequestStatusUpdate = async (requestId, status) => {
    if (!supabase) return;
    await supabase.from('requests').update({ status }).eq('id', requestId);
    const { data: updatedRequests } = await supabase
      .from('requests')
      .select(
        'id, movie_id, status, delivery_method, message, created_at, updated_at, requester_email, user_id'
      )
      .order('created_at', { ascending: false });
    setRequests(updatedRequests || []);
  };

  const handleAddMovie = async (event) => {
    event.preventDefault();
    if (!supabase || !newMovieForm.title) {
      setStatusMessage('Title is required.');
      return;
    }

    const payload = {
      title: newMovieForm.title,
      genre: newMovieForm.genre,
      type: newMovieForm.type,
      availability: newMovieForm.availability,
      year: Number(newMovieForm.year) || null,
      runtime: newMovieForm.runtime,
      rating: newMovieForm.rating,
      description: newMovieForm.description,
      director: newMovieForm.director,
      trailer_id: newMovieForm.trailerId,
      usb_location: newMovieForm.usbLocation,
      poster: newMovieForm.poster,
    };

    const { error: insertError } = await supabase.from('movies').insert([payload]);
    if (insertError) {
      setStatusMessage(insertError.message || 'Unable to add movie.');
      return;
    }

    const { data: refreshed } = await supabase.from('movies').select('*').order('popularity', { ascending: false });
    setMovies((refreshed || []).map(normalizeMovie));
    setNewMovieForm({
      title: '',
      genre: 'Action',
      type: 'Movie',
      availability: 'Request',
      year: new Date().getFullYear(),
      runtime: '',
      rating: 'PG-13',
      description: '',
      director: '',
      trailerId: '',
      usbLocation: '',
      poster: '',
    });
    setStatusMessage('Movie added.');
  };

  const handleProfileFieldChange = (field, value) => {
    setProfile((prev) => ({ ...(prev || {}), [field]: value }));
  };

  const navTabs = useMemo(
    () => ['browse', 'watchlist', 'requests', 'profile', ...(isAdmin ? ['admin'] : [])],
    [isAdmin]
  );

  if (!supabase) {
    return (
      <div className="home-page">
        <p className="error">
          Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to proceed.
        </p>
      </div>
    );
  }

  return (
    <div className="home-page">
      <nav className="top-nav">
        <div className="logo">N&M Movies</div>
        <div className="nav-links">
          {navTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? 'active' : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'admin' ? 'Admin' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        {profile && (
          <div className="user-menu">
            <button
              type="button"
              className="user-chip user-trigger"
              onClick={() => setUserMenuOpen((open) => !open)}
            >
              <span>{profile.full_name || user?.email}</span>
              {isAdmin && <span className="admin-badge">Admin</span>}
              <span className="chevron">▾</span>
            </button>
            {userMenuOpen && (
              <div className="user-dropdown">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('profile');
                    setUserMenuOpen(false);
                  }}
                >
                  Profile
                </button>
                <button type="button" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {loadingMessage && <p className="status">{loadingMessage}</p>}
      {statusMessage && <p className="status">{statusMessage}</p>}
      {error && <p className="error">{error}</p>}

      {activeTab === 'browse' && (
        <>
          <section className="hero">
            <div className="hero-content">
              <p className="eyebrow">Featured</p>
              <h1>{featured.title || 'Welcome to N&M Movies'}</h1>
              <p>{featured.description || 'Browse the curated catalog and request deliveries.'}</p>
              <div className="hero-meta">
                <span>{featured.genre}</span>
                <span>{featured.year}</span>
                <span>{featured.rating}</span>
              </div>
              {featured.trailerId && (
                <a
                  className="primary"
                  href={`https://www.youtube.com/watch?v=${featured.trailerId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Watch trailer
                </a>
              )}
            </div>
            {featured.poster && (
              <div className="hero-poster">
                <img src={featured.poster} alt={featured.title} />
              </div>
            )}
          </section>

          <section className="controls">
            <div className="search">
              <input
                type="text"
                placeholder="Search by title, genre, or location"
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
                {ratingFilters.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="catalog">
            <h2>Browse the catalog</h2>
            <div className="movie-grid">
              {filteredMovies.map((movie) => {
                const isSelected = selectedMovie?.id === movie.id;
                const rating = ratings.find((entry) => entry.movie_id === movie.id)?.rating || '';

                return (
                  <div key={movie.id} className="movie-grid-item">
                    <button
                      type="button"
                      className={`movie-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedMovie((prev) => (prev?.id === movie.id ? null : movie))}
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
                                {movie.usbLocation && <span>USB: {movie.usbLocation}</span>}
                              </div>
                            </div>
                            {movie.poster && <img src={movie.poster} alt={movie.title} />}
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
                                  <span>Genres</span>
                                  <strong>{(movie.genres || []).join(', ')}</strong>
                                </li>
                                <li>
                                  <span>USB location</span>
                                  <strong>{movie.usbLocation || 'See admin for pickup'}</strong>
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
                                <span>Your rating</span>
                                <select value={rating} onChange={(event) => handleRatingChange(movie.id, event.target.value)}>
                                  <option value="">Rate</option>
                                  <option value="5">★★★★★</option>
                                  <option value="4">★★★★</option>
                                  <option value="3">★★★</option>
                                  <option value="2">★★</option>
                                  <option value="1">★</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="detail-actions">
                            <div>
                              <h3>Personalize</h3>
                              <p>Save titles to your watchlist or favorites.</p>
                            </div>
                            <div className="detail-action-grid">
                              <button
                                type="button"
                                className={watchlist.includes(movie.id) ? 'secondary' : 'primary'}
                                onClick={() => toggleWatchlist(movie.id)}
                              >
                                {watchlist.includes(movie.id) ? 'Remove from watchlist' : 'Add to watchlist'}
                              </button>
                              <button
                                type="button"
                                className={favorites.includes(movie.id) ? 'secondary' : 'primary'}
                                onClick={() => toggleFavorite(movie.id)}
                              >
                                {favorites.includes(movie.id) ? 'Remove favorite' : 'Favorite'}
                              </button>
                            </div>
                          </div>

                          {movie.availability === 'Request' ? (
                            <form className="request-form" onSubmit={handleRequestSubmit}>
                              <h3>Request this title</h3>
                              <div className="request-fields">
                                <label>
                                  Delivery method
                                  <select
                                    value={deliveryMethod}
                                    onChange={(event) => setDeliveryMethod(event.target.value)}
                                  >
                                    <option value="USB">USB</option>
                                    <option value="Private Link">Private Link</option>
                                    <option value="Remote Session">Remote Session</option>
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
                              {movie.trailerId && (
                                <a
                                  className="secondary"
                                  href={`https://www.youtube.com/watch?v=${movie.trailerId}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Open trailer
                                </a>
                              )}
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
                            {movie.trailerId && (
                              <div className="detail-card">
                                <h3>Trailer</h3>
                                <div className="trailer-embed">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${movie.trailerId}`}
                                    title={`${movie.title} trailer`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              </div>
                            )}
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

      {activeTab === 'watchlist' && (
        <section className="profile-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Your library</p>
              <h2>Watchlist & favorites</h2>
              <p>Quick access to the titles you’ve pinned.</p>
            </div>
          </div>
          <div className="list-grid">
            {watchlist.length === 0 && favorites.length === 0 && <p className="status">Nothing saved yet.</p>}
            {watchlist.map((id) => (
              <div key={`watch-${id}`} className="list-card">
                <div>
                  <h3>{renderMovieTitle(id)}</h3>
                  <p>{renderMovieMeta(id)}</p>
                  <span className="badge">Watchlist</span>
                </div>
                <button type="button" className="secondary" onClick={() => toggleWatchlist(id)}>
                  Remove
                </button>
              </div>
            ))}
            {favorites.map((id) => (
              <div key={`fav-${id}`} className="list-card">
                <div>
                  <h3>{renderMovieTitle(id)}</h3>
                  <p>{renderMovieMeta(id)}</p>
                  <span className="badge">Favorite</span>
                </div>
                <button type="button" className="secondary" onClick={() => toggleFavorite(id)}>
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
              <p className="eyebrow">My Requests</p>
              <h2>Track delivery progress</h2>
              <p>Every submission from this account appears here with live status.</p>
            </div>
          </div>
          <div className="list-grid">
            {myRequests.length === 0 && <p className="status">No requests yet. Choose a title to submit one.</p>}
            {myRequests.map((request) => (
              <div key={request.id} className="list-card">
                <div>
                  <h3>{renderMovieTitle(request.movie_id)}</h3>
                  <p>{renderMovieMeta(request.movie_id)}</p>
                  <div className="admin-tags">
                    <span className="admin-pill">{request.status}</span>
                    <span className="admin-pill muted">{request.delivery_method}</span>
                  </div>
                  {request.message && <p className="subtext">{request.message}</p>}
                </div>
                <small className="subtext">
                  Created {new Date(request.created_at || '').toLocaleString()} • Updated{' '}
                  {new Date(request.updated_at || request.created_at || '').toLocaleString()}
                </small>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'profile' && (
        <section className="profile-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Profile</p>
              <h2>Manage your account</h2>
              <p>Update your details and preferences.</p>
            </div>
          </div>
          <form className="profile-form" onSubmit={handleProfileSave}>
            <label>
              Full name
              <input
                type="text"
                value={profile?.full_name || ''}
                onChange={(event) => handleProfileFieldChange('full_name', event.target.value)}
              />
            </label>
            <label>
              Avatar URL
              <input
                type="text"
                value={profile?.avatar_url || ''}
                onChange={(event) => handleProfileFieldChange('avatar_url', event.target.value)}
              />
            </label>
            <label>
              Bio
              <textarea
                rows="3"
                value={profile?.bio || ''}
                onChange={(event) => handleProfileFieldChange('bio', event.target.value)}
              />
            </label>
            <button type="submit" className="primary" disabled={isSavingProfile}>
              {isSavingProfile ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </section>
      )}

      {activeTab === 'admin' && isAdmin && (
        <section className="admin-dashboard">
          <header className="admin-header">
            <div>
              <p className="eyebrow">Admin Dashboard</p>
              <h2>N&M Movies Control Center</h2>
              <p className="subtext">Manage invites, members, catalog, and incoming requests.</p>
            </div>
          </header>

          <div className="admin-grid">
            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3>Invitations</h3>
                  <p>Create and revoke invite codes.</p>
                </div>
              </div>
              <div className="admin-form-inline">
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={inviteForm.email}
                  onChange={(event) => setInviteForm((prev) => ({ ...prev, email: event.target.value }))}
                />
                <select
                  value={inviteForm.role}
                  onChange={(event) => setInviteForm((prev) => ({ ...prev, role: event.target.value }))}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="button" onClick={handleCreateInvite}>
                  Create invite
                </button>
              </div>
              <ul className="admin-list">
                {inviteList.map((invite) => (
                  <li key={invite.id}>
                    <div>
                      <strong>{invite.email}</strong>
                      <span>Code: {invite.code}</span>
                      <div className="admin-tags">
                        <span className="admin-pill">{invite.role}</span>
                        <span className="admin-pill muted">
                          {invite.revoked ? 'Revoked' : invite.used_at ? 'Used' : 'Active'}
                        </span>
                      </div>
                    </div>
                    {!invite.revoked && !invite.used_at && (
                      <button type="button" className="secondary" onClick={() => handleRevokeInvite(invite.id)}>
                        Revoke
                      </button>
                    )}
                  </li>
                ))}
                {inviteList.length === 0 && <p className="status">No invites created yet.</p>}
              </ul>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3>Catalog</h3>
                  <p>Add movies and keep metadata current.</p>
                </div>
              </div>
              <form className="admin-add-form" onSubmit={handleAddMovie}>
                <div className="admin-add-grid">
                  <label>
                    Title
                    <input
                      type="text"
                      value={newMovieForm.title}
                      onChange={(event) => setNewMovieForm((prev) => ({ ...prev, title: event.target.value }))}
                    />
                  </label>
                  <label>
                    Genre
                    <input
                      type="text"
                      value={newMovieForm.genre}
                      onChange={(event) => setNewMovieForm((prev) => ({ ...prev, genre: event.target.value }))}
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
                    Year
                    <input
                      type="number"
                      value={newMovieForm.year}
                      onChange={(event) => setNewMovieForm((prev) => ({ ...prev, year: event.target.value }))}
                    />
                  </label>
                  <label>
                    Rating
                    <input
                      type="text"
                      value={newMovieForm.rating}
                      onChange={(event) => setNewMovieForm((prev) => ({ ...prev, rating: event.target.value }))}
                    />
                  </label>
                  <label>
                    Runtime
                    <input
                      type="text"
                      value={newMovieForm.runtime}
                      onChange={(event) => setNewMovieForm((prev) => ({ ...prev, runtime: event.target.value }))}
                    />
                  </label>
                </div>
                <label>
                  Director
                  <input
                    type="text"
                    value={newMovieForm.director}
                    onChange={(event) => setNewMovieForm((prev) => ({ ...prev, director: event.target.value }))}
                  />
                </label>
                <label>
                  Trailer ID (YouTube)
                  <input
                    type="text"
                    value={newMovieForm.trailerId}
                    onChange={(event) => setNewMovieForm((prev) => ({ ...prev, trailerId: event.target.value }))}
                  />
                </label>
                <label>
                  USB location
                  <input
                    type="text"
                    value={newMovieForm.usbLocation}
                    onChange={(event) => setNewMovieForm((prev) => ({ ...prev, usbLocation: event.target.value }))}
                  />
                </label>
                <label>
                  Poster URL
                  <input
                    type="url"
                    value={newMovieForm.poster}
                    onChange={(event) => setNewMovieForm((prev) => ({ ...prev, poster: event.target.value }))}
                  />
                </label>
                <label>
                  Description
                  <textarea
                    rows="3"
                    value={newMovieForm.description}
                    onChange={(event) => setNewMovieForm((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </label>
                <button type="submit">Save movie</button>
              </form>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3>Requests</h3>
                  <p>Approve or decline member submissions.</p>
                </div>
              </div>
              <ul className="admin-list">
                {requests.map((request) => (
                  <li key={request.id}>
                    <div>
                      <strong>{renderMovieTitle(request.movie_id)}</strong>
                      <span>{request.requester_email}</span>
                      <div className="admin-tags">
                        <span className="admin-pill">{request.status}</span>
                        <span className="admin-pill muted">{request.delivery_method}</span>
                      </div>
                      {request.message && <p className="subtext">{request.message}</p>}
                    </div>
                    <div className="admin-row-actions">
                      <button type="button" onClick={() => handleRequestStatusUpdate(request.id, 'APPROVED')}>
                        Approve
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => handleRequestStatusUpdate(request.id, 'REJECTED')}
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
                {requests.length === 0 && <p className="status">No incoming requests.</p>}
              </ul>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3>Members</h3>
                  <p>View active accounts.</p>
                </div>
              </div>
              <ul className="admin-list">
                {users.map((member) => (
                  <li key={member.id}>
                    <div>
                      <strong>{member.full_name || member.email}</strong>
                      <span>{member.email}</span>
                      <div className="admin-tags">
                        <span className="admin-pill">{member.role || 'member'}</span>
                        <span className="admin-pill muted">
                          Updated {member.updated_at ? new Date(member.updated_at).toLocaleString() : 'n/a'}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
                {users.length === 0 && <p className="status">No users found.</p>}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
