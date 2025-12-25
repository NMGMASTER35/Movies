import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../services/supabaseClient';

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
  const [requestEmail, setRequestEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('USB');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestStatus, setRequestStatus] = useState('');
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState('');

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
          <span className="active">Browse</span>
          <span>Watchlist</span>
          <span>Requests</span>
          <span>Profile</span>
        </div>
        {user && <div className="user-chip">{user.email}</div>}
      </nav>

      {authStatus && <p className="status">{authStatus}</p>}

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
    </div>
  );
}
