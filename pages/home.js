import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase, isAdminUser } from '../services/supabaseClient';

const MOVIES = [
  {
    id: 'm1',
    title: 'Skyline Drift',
    genre: 'Action',
    type: 'Movie',
    year: 2023,
    rating: 'PG-13',
    availability: 'Streaming',
    poster:
      'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=500&q=80',
    description: 'An elite driver fights to clear his name in a high-stakes city race.',
    featured: true,
  },
  {
    id: 'm2',
    title: 'The Silent Reef',
    genre: 'Thriller',
    type: 'Movie',
    year: 2022,
    rating: 'R',
    availability: 'Request',
    poster:
      'https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=500&q=80',
    description: 'A marine biologist uncovers a hidden conspiracy beneath the waves.',
  },
  {
    id: 'm3',
    title: 'Glass Frontier',
    genre: 'Drama',
    type: 'Series',
    year: 2021,
    rating: 'TV-MA',
    availability: 'Streaming',
    poster:
      'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=500&q=80',
    description: 'A family-run empire struggles to survive a ruthless tech takeover.',
  },
  {
    id: 'm4',
    title: 'Orbit City',
    genre: 'Sci-Fi',
    type: 'Series',
    year: 2024,
    rating: 'TV-14',
    availability: 'Request',
    poster:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=500&q=80',
    description: 'Citizens in a floating metropolis uncover secrets in the lower decks.',
  },
  {
    id: 'm5',
    title: 'Café Sonata',
    genre: 'Romance',
    type: 'Movie',
    year: 2020,
    rating: 'PG',
    availability: 'Streaming',
    poster:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80',
    description: 'Two strangers bond over music, pastries, and a Parisian café.',
  },
  {
    id: 'm6',
    title: 'Hidden Atlas',
    genre: 'Adventure',
    type: 'Movie',
    year: 2019,
    rating: 'PG-13',
    availability: 'Request',
    poster:
      'https://images.unsplash.com/photo-1497032205916-ac775f0649ae?auto=format&fit=crop&w=500&q=80',
    description: 'A cartographer and her crew hunt for a legendary island map.',
  },
];

const GENRES = ['All', 'Action', 'Thriller', 'Drama', 'Sci-Fi', 'Romance', 'Adventure'];
const TYPES = ['All', 'Movie', 'Series'];

export default function Home() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedMovie, setSelectedMovie] = useState(MOVIES[0]);
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
  const isAdmin = useMemo(() => isAdminUser(user), [user]);
  const storageKey = useMemo(() => {
    if (!user?.id && !user?.email) {
      return null;
    }

    return `movie-profile-${user?.id || user?.email}`;
  }, [user]);

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

      if (!activeUser) {
        router.push('/');
      }
    };

    hydrateSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);

      if (!activeUser) {
        router.push('/');
      }
    });

    return () => {
      isMounted = false;
      data?.subscription?.unsubscribe();
    };
  }, [router]);

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

  const filteredMovies = useMemo(() => {
    return MOVIES.filter((movie) => {
      const matchesSearch =
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.genre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = selectedGenre === 'All' || movie.genre === selectedGenre;
      const matchesType = selectedType === 'All' || movie.type === selectedType;
      return matchesSearch && matchesGenre && matchesType;
    });
  }, [searchTerm, selectedGenre, selectedType]);

  const selectedRating = ratings.find((entry) => entry.movieId === selectedMovie?.id)?.rating || '';

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

  return (
    <div className="home-page">
      <nav className="top-nav">
        <div className="logo">Movie Library</div>
        <div className="nav-links">
          {['browse', 'watchlist', 'requests', 'profile'].map((tab) => (
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
          <div className="user-chip">
            <span>{profileName || user.email}</span>
            {isAdmin && <span className="admin-badge">Admin</span>}
          </div>
        )}
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
            </div>
          </section>

          <section className="catalog">
            <h2>Browse the catalog</h2>
            <div className="movie-grid">
              {filteredMovies.map((movie) => (
                <button
                  key={movie.id}
                  type="button"
                  className={`movie-card ${selectedMovie?.id === movie.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMovie(movie)}
                >
                  <img src={movie.poster} alt={movie.title} />
                  <div className="movie-info">
                    <h3>{movie.title}</h3>
                    <p>
                      {movie.genre} • {movie.type}
                    </p>
                    <span className={`badge ${movie.availability === 'Request' ? 'warning' : ''}`}>
                      {movie.availability}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {selectedMovie && (
            <section className="detail-panel">
              <div className="detail-content">
                <div>
                  <p className="eyebrow">Selected title</p>
                  <h2>{selectedMovie.title}</h2>
                  <p>{selectedMovie.description}</p>
                  <div className="detail-meta">
                    <span>{selectedMovie.genre}</span>
                    <span>{selectedMovie.type}</span>
                    <span>{selectedMovie.year}</span>
                    <span>{selectedMovie.rating}</span>
                  </div>
                </div>
                <img src={selectedMovie.poster} alt={selectedMovie.title} />
              </div>

              <div className="detail-actions">
                <div>
                  <h3>Personalize</h3>
                  <p>Keep your watchlist, ratings, and history up to date.</p>
                </div>
                <div className="detail-action-grid">
                  <button type="button" className="secondary" onClick={() => handleAddToWatchlist(selectedMovie)}>
                    Add to watchlist
                  </button>
                  <button type="button" className="secondary" onClick={() => handleHistoryMark(selectedMovie.id)}>
                    Mark as watched
                  </button>
                  <label>
                    Rating
                    <select
                      value={selectedRating}
                      onChange={(event) => handleRatingChange(selectedMovie.id, event.target.value)}
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

              {selectedMovie.availability === 'Request' ? (
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
            </section>
          )}
        </>
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
