import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase, isAdminUser } from '../services/supabaseClient';

const normalizeMovie = (movie) => ({
  id: movie.id,
  title: movie.title,
  description: movie.description || '',
  detail: movie.detail || '',
  genre: movie.genre || 'Unknown',
  genres: Array.isArray(movie.genres) ? movie.genres : movie.genre ? [movie.genre] : [],
  type: movie.type || 'Movie',
  year: movie.year,
  rating: movie.rating || '',
  runtime: movie.runtime || '',
  availability: movie.availability || 'Request',
  usbLocation: movie.usb_location || '',
  platform: movie.platform || '',
  trailerId: movie.trailer_id || '',
  watchOptions: Array.isArray(movie.watch_options)
    ? movie.watch_options
    : movie.watch_options && typeof movie.watch_options === 'object'
      ? [movie.watch_options]
      : [],
  poster: movie.poster || 'https://via.placeholder.com/300x450.png?text=N%26M+Movies',
  director: movie.director || '',
  castMembers: Array.isArray(movie.cast_members) ? movie.cast_members : [],
  gallery: Array.isArray(movie.gallery) ? movie.gallery : [],
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

const parseList = (value) =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const parseWatchOptions = (value) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [platform, detail, instruction] = line.split('|').map((part) => part.trim());
      return { platform, detail: detail || '', instruction: instruction || '' };
    })
    .filter((option) => option.platform);

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [isAdmin, setIsAdmin] = useState(false);
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
  const [adminRequests, setAdminRequests] = useState([]);
  const [adminMovies, setAdminMovies] = useState([]);
  const [adminMetrics, setAdminMetrics] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [editingMovie, setEditingMovie] = useState(null);
  const [editMovieForm, setEditMovieForm] = useState({
    title: '',
    genre: 'Action',
    type: 'Movie',
    availability: 'Request',
    year: new Date().getFullYear(),
    runtime: '',
    rating: 'PG-13',
    description: '',
    detail: '',
    director: '',
    trailerId: '',
    usbLocation: '',
    platform: '',
    poster: '',
    genresText: '',
    castMembersText: '',
    galleryText: '',
    watchOptionsText: '',
  });
  const [isUpdatingMovie, setIsUpdatingMovie] = useState(false);
  const [deletingMovieId, setDeletingMovieId] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingMessage, setLoadingMessage] = useState('Loading your account…');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [communityProfiles, setCommunityProfiles] = useState([]);
  const [userFollows, setUserFollows] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [userLists, setUserLists] = useState([]);
  const [userListItems, setUserListItems] = useState([]);
  const [socialFeed, setSocialFeed] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [listForm, setListForm] = useState({ title: '', description: '', is_public: true });
  const [listSelections, setListSelections] = useState({});
  const [newMovieForm, setNewMovieForm] = useState({
    title: '',
    genre: 'Action',
    type: 'Movie',
    availability: 'Request',
    year: new Date().getFullYear(),
    runtime: '',
    rating: 'PG-13',
    description: '',
    detail: '',
    director: '',
    trailerId: '',
    usbLocation: '',
    poster: '',
    platform: '',
    genresText: '',
    castMembersText: '',
    galleryText: '',
    watchOptionsText: '',
  });
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' });
  const [requestMessage, setRequestMessage] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('USB');
  const [requestStatus, setRequestStatus] = useState('');
  const [customRequestForm, setCustomRequestForm] = useState({
    title: '',
    year: '',
    details: '',
    deliveryMethod: 'USB',
  });
  const [customRequestStatus, setCustomRequestStatus] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const movieMap = useMemo(() => new Map(movies.map((movie) => [movie.id, movie])), [movies]);
  const userMap = useMemo(() => {
    const map = new Map();
    (communityProfiles || []).forEach((member) => map.set(member.id, member));
    (users || []).forEach((member) => {
      if (!map.has(member.id)) {
        map.set(member.id, member);
      }
    });
    return map;
  }, [communityProfiles, users]);
  const userListsMap = useMemo(() => new Map(userLists.map((list) => [list.id, list])), [userLists]);

  const renderUserName = (userId) => {
    const member = userMap.get(userId);
    if (member) {
      return member.full_name || member.email || userId || 'Unassigned';
    }
    const adminFallback = adminUsers.find((entry) => entry.user_id === userId);
    if (adminFallback) {
      return adminFallback.user_id;
    }
    return userId || 'Unassigned';
  };

  const followerCounts = useMemo(() => {
    const map = new Map();
    (userFollows || []).forEach((entry) => {
      map.set(entry.followee_id, (map.get(entry.followee_id) || 0) + 1);
    });
    return map;
  }, [userFollows]);

  const followingCounts = useMemo(() => {
    const map = new Map();
    (userFollows || []).forEach((entry) => {
      map.set(entry.follower_id, (map.get(entry.follower_id) || 0) + 1);
    });
    return map;
  }, [userFollows]);

  const followingSet = useMemo(
    () =>
      new Set(
        (userFollows || [])
          .filter((entry) => entry.follower_id === user?.id)
          .map((entry) => entry.followee_id)
      ),
    [userFollows, user?.id]
  );

  const handleFollowToggle = async (targetUserId) => {
    if (!supabase || !user || targetUserId === user.id) return;
    const isFollowing = followingSet.has(targetUserId);

    if (isFollowing) {
      await supabase.from('user_follows').delete().eq('follower_id', user.id).eq('followee_id', targetUserId);
    } else {
      await supabase.from('user_follows').upsert({ follower_id: user.id, followee_id: targetUserId });
      await supabase.from('user_activity').insert({ actor_id: user.id, type: 'follow', followee_id: targetUserId });
    }

    const { data } = await supabase.from('user_follows').select('*');
    setUserFollows(data || []);
  };

  const handleReviewDraftChange = (movieId, field, value) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [movieId]: { ...(prev[movieId] || {}), [field]: value },
    }));
  };

  const handleReviewSubmit = async (movieId) => {
    if (!supabase || !user) return;
    const draft = reviewDrafts[movieId] || {};
    if (!draft.rating || !draft.comment) {
      setStatusMessage('Rating and comment are required for reviews.');
      return;
    }

    const payload = {
      user_id: user.id,
      movie_id: movieId,
      rating: Number(draft.rating),
      comment: draft.comment,
    };

    const { data: reviewData, error: reviewError } = await supabase.from('user_reviews').upsert(payload).select('*');
    if (reviewError) {
      setError(reviewError.message || 'Unable to save review.');
      return;
    }

    setUserReviews((prev) => {
      const filtered = prev.filter((entry) => !(entry.user_id === user.id && entry.movie_id === movieId));
      return [...filtered, ...(reviewData || [])];
    });
    await supabase.from('user_activity').insert({ actor_id: user.id, type: 'review', movie_id: movieId });
    setStatusMessage('Review shared.');
  };

  const handleCreateList = async (event) => {
    event.preventDefault();
    if (!supabase || !user || !listForm.title) {
      setStatusMessage('List title is required.');
      return;
    }

    const payload = {
      user_id: user.id,
      title: listForm.title,
      description: listForm.description,
      is_public: Boolean(listForm.is_public),
    };

    const { data: newList, error: listError } = await supabase.from('user_lists').insert(payload).select('*');
    if (listError) {
      setError(listError.message || 'Unable to create list.');
      return;
    }

    setUserLists((prev) => [...prev, ...(newList || [])]);
    setListForm({ title: '', description: '', is_public: true });
    await supabase.from('user_activity').insert({ actor_id: user.id, type: 'list' });
    setStatusMessage('List created.');
  };

  const handleAddToList = async (movieId, listId) => {
    if (!supabase || !user || !listId) return;

    const payload = { list_id: listId, movie_id: movieId };
    const { data, error: listItemError } = await supabase.from('user_list_items').upsert(payload).select('*');
    if (listItemError) {
      setError(listItemError.message || 'Unable to add to list.');
      return;
    }

    setUserListItems((prev) => {
      const filtered = prev.filter((entry) => !(entry.list_id === listId && entry.movie_id === movieId));
      return [...filtered, ...(data || [])];
    });
    await supabase.from('user_activity').insert({ actor_id: user.id, type: 'list_item', movie_id: movieId, list_id: listId });
    setStatusMessage('Added to your list.');
  };

  const describeActivity = (activity) => {
    const actor = renderUserName(activity.actor_id);
    switch (activity.type) {
      case 'review':
        return `${actor} reviewed ${renderMovieTitle(activity.movie_id)}`;
      case 'list':
        return `${actor} created a new list`;
      case 'list_item':
        return `${actor} added a movie to ${userListsMap.get(activity.list_id)?.title || 'a list'}`;
      case 'follow':
        return `${actor} followed someone new`;
      default:
        return `${actor} shared an update`;
    }
  };

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
          adminUserResult,
          followsResult,
          communityProfilesResult,
          reviewsResult,
          listsResult,
          listItemsResult,
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
          supabase.from('admin_users').select('role').eq('user_id', user.id).maybeSingle(),
          supabase.from('user_follows').select('*'),
          supabase.from('profiles').select('id, email, full_name, avatar_url, bio, role'),
          supabase.from('user_reviews').select('*'),
          supabase.from('user_lists').select('*'),
          supabase.from('user_list_items').select('*'),
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

        if (!followsResult.error && followsResult.data) {
          setUserFollows(followsResult.data);
        }

        if (!communityProfilesResult.error && communityProfilesResult.data) {
          setCommunityProfiles(communityProfilesResult.data);
          setSelectedProfileId((prev) => prev || communityProfilesResult.data?.find((p) => p.id === user.id)?.id || user.id);
        }

        if (!reviewsResult.error && reviewsResult.data) {
          setUserReviews(reviewsResult.data);
        }

        if (!listsResult.error && listsResult.data) {
          setUserLists(listsResult.data);
        }

        if (!listItemsResult.error && listItemsResult.data) {
          setUserListItems(listItemsResult.data);
        }

        const adminFlag = Boolean(
          adminUserResult.data?.role === 'admin' || isAdminUser(profileResult.data || user)
        );
        setIsAdmin(adminFlag);

        if (adminFlag) {
          const [
            adminRequestsResult,
            inviteResult,
            usersResult,
            adminRequestsMetaResult,
            adminMoviesResult,
            adminMetricsResult,
            adminUsersResult,
          ] = await Promise.all([
            supabase
              .from('requests')
              .select(
                'id, movie_id, status, delivery_method, message, created_at, updated_at, requester_email, user_id'
              )
              .order('created_at', { ascending: false }),
            supabase.from('invites').select('*').order('created_at', { ascending: false }),
            supabase.from('profiles').select('id, email, full_name, role, updated_at'),
            supabase.from('admin_requests').select('id, request_id, status, assigned_to, notes'),
            supabase
              .from('admin_movies')
              .select('id, status, notes, movie_id, movies (title, availability, popularity)')
              .order('created_at', { ascending: false }),
            supabase.from('admin_metrics').select('*').order('recorded_at', { ascending: false }).limit(25),
            supabase.from('admin_users').select('id, user_id, role, created_at, updated_at'),
          ]);

          if (!adminRequestsResult.error && adminRequestsResult.data) {
            const adminRequestMap = new Map(
              (adminRequestsMetaResult.data || []).map((entry) => [entry.request_id, entry])
            );
            setRequests(
              (adminRequestsResult.data || []).map((request) => ({
                ...request,
                admin: adminRequestMap.get(request.id) || null,
              }))
            );
            setAdminRequests(adminRequestsMetaResult.data || []);
          } else {
            setRequests([]);
            setAdminRequests([]);
          }

          if (!inviteResult.error && inviteResult.data) {
            setInviteList(inviteResult.data);
          } else {
            setInviteList([]);
          }

          if (!usersResult.error && usersResult.data) {
            setUsers(usersResult.data);
          } else {
            setUsers([]);
          }

          if (!adminMoviesResult.error && adminMoviesResult.data) {
            setAdminMovies(adminMoviesResult.data);
          } else {
            setAdminMovies([]);
          }

          if (!adminMetricsResult.error && adminMetricsResult.data) {
            setAdminMetrics(adminMetricsResult.data);
          } else {
            setAdminMetrics([]);
          }

          if (!adminUsersResult.error && adminUsersResult.data) {
            setAdminUsers(adminUsersResult.data);
          } else {
            setAdminUsers([]);
          }
        } else {
          setRequests([]);
          setInviteList([]);
          setUsers([]);
          setAdminRequests([]);
          setAdminMovies([]);
          setAdminMetrics([]);
          setAdminUsers([]);
        }

        const followingIds = (followsResult.data || [])
          .filter((entry) => entry.follower_id === user.id)
          .map((entry) => entry.followee_id);

        if (followingIds.length > 0) {
          const { data: activityData, error: activityError } = await supabase
            .from('user_activity')
            .select('*')
            .in('actor_id', followingIds)
            .order('created_at', { ascending: false })
            .limit(50);

          if (!activityError && activityData) {
            setSocialFeed(activityData);
          } else {
            setSocialFeed([]);
          }
        } else {
          setSocialFeed([]);
        }

        setLoadingMessage('');
      } catch (loadError) {
        setError(loadError.message || 'Unable to load data.');
        setLoadingMessage('');
      }
    };

    loadData();
  }, [user]);

  useEffect(() => {
    if (!supabase || !user?.id) return;
    const followingIds = Array.from(followingSet);
    if (followingIds.length === 0) {
      setSocialFeed([]);
      return;
    }

    const refreshFeed = async () => {
      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .in('actor_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error) {
        setSocialFeed(data || []);
      }
    };

    refreshFeed();
  }, [followingSet, supabase, user?.id]);

  useEffect(() => {
    if (!selectedProfileId && communityProfiles.length > 0) {
      const preferred = communityProfiles.find((profile) => profile.id === user?.id) || communityProfiles[0];
      setSelectedProfileId(preferred?.id || null);
    }
  }, [communityProfiles, selectedProfileId, user?.id]);

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
        ...(movie.castMembers || []),
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

  const parseCustomRequestDetails = (message) => {
    if (!message || !message.startsWith('[CUSTOM_TITLE_REQUEST]')) {
      return null;
    }

    const details = {};
    message
      .split('\n')
      .slice(1)
      .forEach((line) => {
        const [label, ...rest] = line.split(':');
        if (!rest.length) return;
        const value = rest.join(':').trim();
        switch (label.trim().toLowerCase()) {
          case 'title':
            details.title = value;
            break;
          case 'year':
            details.year = value;
            break;
          case 'details':
            details.details = value;
            break;
          case 'preferred delivery':
            details.deliveryMethod = value;
            break;
          default:
            break;
        }
      });

    return details.title ? details : null;
  };

  const renderRequestTitle = (request) => {
    const custom = parseCustomRequestDetails(request.message || '');
    if (custom?.title) {
      return `Requested: ${custom.title}${custom.year ? ` (${custom.year})` : ''}`;
    }
    return renderMovieTitle(request.movie_id);
  };

  const renderRequestMeta = (request) => {
    const custom = parseCustomRequestDetails(request.message || '');
    if (custom?.title) {
      return ['Custom title request', custom.deliveryMethod || request.delivery_method].filter(Boolean).join(' • ');
    }
    return renderMovieMeta(request.movie_id);
  };

  const renderRequestNotes = (request) => {
    const custom = parseCustomRequestDetails(request.message || '');
    if (custom?.title) {
      return custom.details || 'No additional details provided.';
    }
    return request.message;
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

    const { data: requestRow, error: requestError } = await supabase
      .from('requests')
      .insert([
        {
          movie_id: selectedMovie.id,
          user_id: user.id,
          requester_email: user.email,
          message: requestMessage,
          delivery_method: deliveryMethod,
          status: 'OPEN',
        },
      ])
      .select('*')
      .single();

    if (requestError) {
      setRequestStatus(requestError.message || 'Unable to submit request.');
      return;
    }

    if (requestRow?.id) {
      await supabase
        .from('admin_requests')
        .upsert({ request_id: requestRow.id, status: requestRow.status, notes: requestRow.message || '' });
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

  const handleCustomRequestSubmit = async (event) => {
    event.preventDefault();
    setCustomRequestStatus('');

    if (!supabase || !user) return;
    if (!customRequestForm.title.trim()) {
      setCustomRequestStatus('Please add the movie title you want to request.');
      return;
    }

    const message = [
      '[CUSTOM_TITLE_REQUEST]',
      `Title: ${customRequestForm.title.trim()}`,
      customRequestForm.year.trim() ? `Year: ${customRequestForm.year.trim()}` : null,
      `Preferred delivery: ${customRequestForm.deliveryMethod}`,
      customRequestForm.details.trim() ? `Details: ${customRequestForm.details.trim()}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const { data: requestRow, error: requestError } = await supabase
      .from('requests')
      .insert([
        {
          movie_id: null,
          user_id: user.id,
          requester_email: user.email,
          message,
          delivery_method: customRequestForm.deliveryMethod,
          status: 'OPEN',
        },
      ])
      .select('*')
      .single();

    if (requestError) {
      setCustomRequestStatus(requestError.message || 'Unable to submit request.');
      return;
    }

    if (requestRow?.id) {
      await supabase
        .from('admin_requests')
        .upsert({ request_id: requestRow.id, status: requestRow.status, notes: requestRow.message || '' });
    }

    setCustomRequestStatus('Request submitted. We will notify you once it is available.');
    setCustomRequestForm({ title: '', year: '', details: '', deliveryMethod: 'USB' });

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

    if (!profileError && !authError) {
      if (payload.role === 'admin') {
        await supabase.from('admin_users').upsert({ user_id: user.id, role: 'admin' });
      } else {
        await supabase.from('admin_users').delete().eq('user_id', user.id);
      }
      setStatusMessage('Profile saved.');
    } else {
      setError(profileError?.message || authError?.message || 'Unable to update profile.');
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
    await Promise.all([
      supabase.from('requests').update({ status }).eq('id', requestId),
      supabase.from('admin_requests').upsert({ request_id: requestId, status }),
    ]);
    const [updatedRequests, updatedAdminMeta] = await Promise.all([
      supabase
        .from('requests')
        .select('id, movie_id, status, delivery_method, message, created_at, updated_at, requester_email, user_id')
        .order('created_at', { ascending: false }),
      supabase.from('admin_requests').select('id, request_id, status, assigned_to, notes'),
    ]);
    if (!updatedRequests.error) {
      const meta = new Map((updatedAdminMeta.data || []).map((entry) => [entry.request_id, entry]));
      setRequests(
        (updatedRequests.data || []).map((request) => ({
          ...request,
          admin: meta.get(request.id) || null,
        }))
      );
      setAdminRequests(updatedAdminMeta.data || []);
    }
  };

  const refreshCatalogData = async () => {
    const [{ data: refreshed, error: moviesError }, { data: adminCatalog, error: adminMoviesError }] = await Promise.all(
      [
        supabase.from('movies').select('*').order('popularity', { ascending: false }),
        isAdmin
          ? supabase
              .from('admin_movies')
              .select('id, status, notes, movie_id, movies (title, availability, popularity)')
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ]
    );

    if (!moviesError && refreshed) {
      setMovies((refreshed || []).map(normalizeMovie));
    }

    if (!adminMoviesError && adminCatalog) {
      setAdminMovies(adminCatalog || []);
    }
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
      genres: parseList(newMovieForm.genresText),
      type: newMovieForm.type,
      availability: newMovieForm.availability,
      year: Number(newMovieForm.year) || null,
      runtime: newMovieForm.runtime,
      rating: newMovieForm.rating,
      description: newMovieForm.description,
      detail: newMovieForm.detail,
      director: newMovieForm.director,
      trailer_id: newMovieForm.trailerId,
      usb_location: newMovieForm.usbLocation,
      platform: newMovieForm.platform,
      cast_members: parseList(newMovieForm.castMembersText),
      gallery: parseList(newMovieForm.galleryText),
      watch_options: parseWatchOptions(newMovieForm.watchOptionsText),
      poster: newMovieForm.poster,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('movies')
      .insert([payload])
      .select('*')
      .single();
    if (insertError) {
      setStatusMessage(insertError.message || 'Unable to add movie.');
      return;
    }

    if (inserted?.id && isAdmin) {
      await supabase.from('admin_movies').upsert({ movie_id: inserted.id, status: 'ACTIVE', notes: '' });
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
      detail: '',
      director: '',
      trailerId: '',
      usbLocation: '',
      platform: '',
      poster: '',
      genresText: '',
      castMembersText: '',
      galleryText: '',
      watchOptionsText: '',
    });
    await refreshCatalogData();
    setStatusMessage('Movie added.');
  };

  const handleEditMovieStart = (movieId) => {
    const movie =
      movieMap.get(movieId) ||
      (adminMovies.find((entry) => entry.movie_id === movieId)?.movies
        ? normalizeMovie({ ...adminMovies.find((entry) => entry.movie_id === movieId).movies, id: movieId })
        : null);
    if (!movie) {
      setStatusMessage('Movie not found.');
      return;
    }

    setEditingMovie(movie);
    setEditMovieForm({
      title: movie.title || '',
      genre: movie.genre || 'Action',
      type: movie.type || 'Movie',
      availability: movie.availability || 'Request',
      year: movie.year || new Date().getFullYear(),
      runtime: movie.runtime || '',
      rating: movie.rating || 'PG-13',
      description: movie.description || '',
      detail: movie.detail || '',
      director: movie.director || '',
      trailerId: movie.trailerId || '',
      usbLocation: movie.usbLocation || '',
      platform: movie.platform || '',
      poster: movie.poster || '',
      genresText: (movie.genres || []).join(', '),
      castMembersText: (movie.castMembers || []).join(', '),
      galleryText: (movie.gallery || []).join(', '),
      watchOptionsText: (movie.watchOptions || [])
        .map(({ platform: optionPlatform, detail, instruction }) =>
          [optionPlatform, detail, instruction].filter(Boolean).join(' | ')
        )
        .join('\n'),
    });
    setStatusMessage('');
    setError('');
  };

  const handleEditMovieFieldChange = (field, value) => {
    setEditMovieForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateMovie = async (event) => {
    event.preventDefault();
    if (!supabase || !editingMovie) return;
    setIsUpdatingMovie(true);

    const payload = {
      title: editMovieForm.title,
      genre: editMovieForm.genre,
      genres: parseList(editMovieForm.genresText),
      type: editMovieForm.type,
      availability: editMovieForm.availability,
      year: Number(editMovieForm.year) || null,
      runtime: editMovieForm.runtime,
      rating: editMovieForm.rating,
      description: editMovieForm.description,
      detail: editMovieForm.detail,
      director: editMovieForm.director,
      trailer_id: editMovieForm.trailerId,
      usb_location: editMovieForm.usbLocation,
      platform: editMovieForm.platform,
      cast_members: parseList(editMovieForm.castMembersText),
      gallery: parseList(editMovieForm.galleryText),
      watch_options: parseWatchOptions(editMovieForm.watchOptionsText),
      poster: editMovieForm.poster,
    };

    const { error: updateError } = await supabase.from('movies').update(payload).eq('id', editingMovie.id);
    if (updateError) {
      setStatusMessage(updateError.message || 'Unable to update movie.');
      setIsUpdatingMovie(false);
      return;
    }

    await refreshCatalogData();
    setEditingMovie(null);
    setIsUpdatingMovie(false);
    setStatusMessage('Movie updated.');
  };

  const handleDeleteMovie = async (movieId) => {
    if (!supabase) return;
    setDeletingMovieId(movieId);

    const { error: deleteError } = await supabase.from('movies').delete().eq('id', movieId);
    if (deleteError) {
      setStatusMessage(deleteError.message || 'Unable to delete movie.');
      setDeletingMovieId(null);
      return;
    }

    await supabase.from('admin_movies').delete().eq('movie_id', movieId);
    await refreshCatalogData();
    if (editingMovie?.id === movieId) {
      setEditingMovie(null);
    }
    setDeletingMovieId(null);
    setStatusMessage('Movie deleted.');
  };

  const handleProfileFieldChange = (field, value) => {
    setProfile((prev) => ({ ...(prev || {}), [field]: value }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setUserMenuOpen(false);
  };

  const navTabs = useMemo(
    () => ['browse', 'feed', 'community', 'watchlist', 'requests', 'profile', ...(isAdmin ? ['admin'] : [])],
    [isAdmin]
  );
  const adminUserIds = useMemo(() => new Set((adminUsers || []).map((entry) => entry.user_id)), [adminUsers]);

  const requestBuckets = useMemo(() => {
    const buckets = {
      open: [],
      inProgress: [],
      approved: [],
      rejected: [],
    };

    (requests || []).forEach((request) => {
      const status = (request.admin?.status || request.status || 'OPEN').toUpperCase();
      if (status === 'IN_PROGRESS' || status === 'IN PROGRESS') {
        buckets.inProgress.push(request);
      } else if (status === 'APPROVED') {
        buckets.approved.push(request);
      } else if (status === 'REJECTED') {
        buckets.rejected.push(request);
      } else {
        buckets.open.push(request);
      }
    });

    return buckets;
  }, [requests]);

  const manageableCatalog = useMemo(() => {
    if (adminMovies.length > 0) {
      return adminMovies.map((entry) => {
        const movieTitle = entry.movies?.title || renderMovieTitle(entry.movie_id);
        const availability = entry.movies?.availability || movieMap.get(entry.movie_id)?.availability || 'Request';
        const popularity = entry.movies?.popularity ?? movieMap.get(entry.movie_id)?.popularity;

        return {
          id: entry.movie_id,
          title: movieTitle,
          status: entry.status || 'ACTIVE',
          availability,
          notes: entry.notes || (popularity !== undefined ? `Popularity: ${popularity}` : ''),
        };
      });
    }

    return movies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      status: movie.availability === 'Streaming' ? 'READY' : 'REQUEST',
      availability: movie.availability || 'Request',
      notes: movie.platform ? `Platform: ${movie.platform}` : movie.usbLocation ? `USB: ${movie.usbLocation}` : '',
    }));
  }, [adminMovies, movieMap, movies]);

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
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <button type="button" className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            ✕
          </button>
          <div className="logo">N&M Movies</div>
          <p className="subtext">Cinematic, private, curated.</p>
        </div>
        <nav className="sidebar-nav">
          {navTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`nav-pill ${activeTab === tab ? 'active' : ''}`}
              onClick={() => {
                handleTabChange(tab);
                setSidebarOpen(false);
              }}
            >
              <span className="nav-label">{tab === 'admin' ? 'Admin' : tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            </button>
          ))}
        </nav>
        {isAdmin && (
          <div className="sidebar-section">
            <p className="eyebrow">Admin</p>
            <div className="sidebar-tags">
              <span className="badge muted">Catalog</span>
              <span className="badge muted">Requests</span>
              <span className="badge muted">Users</span>
            </div>
          </div>
        )}
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="ghost-toggle"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <div className="topbar-search">
              <input
                type="text"
                placeholder="Search movies, genres, or people"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>
          {profile && (
            <div className="topbar-actions">
              <div className="user-menu">
                <button
                  type="button"
                  className="user-chip user-trigger"
                  onClick={() => setUserMenuOpen((open) => !open)}
                >
                  <span className="avatar chip small">{(profile.full_name || user?.email || 'U').charAt(0)}</span>
                  <span>{profile.full_name || user?.email}</span>
                  {isAdmin && <span className="admin-badge">Admin</span>}
                  <span className="chevron">▾</span>
                </button>
                {userMenuOpen && (
                  <div className="user-dropdown">
                    <button
                      type="button"
                      onClick={() => handleTabChange('profile')}
                    >
                      Profile
                    </button>
                    <button type="button" onClick={handleSignOut}>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        {loadingMessage && <p className="status">{loadingMessage}</p>}
        {statusMessage && <p className="status">{statusMessage}</p>}
        {error && <p className="error">{error}</p>}

      {activeTab === 'browse' && (
        <>
          <section className="hero cinematic-hero" style={{ '--hero-image': `url(${featured.poster})` }}>
            <div className="hero-overlay" />
            <div className="hero-content">
              <p className="eyebrow">Featured</p>
              <h1>{featured.title || 'Welcome to N&M Movies'}</h1>
              <p>{featured.description || 'Browse the curated catalog and request deliveries.'}</p>
              <div className="hero-meta">
                <span>{featured.genre}</span>
                <span>{featured.year}</span>
                <span>{featured.rating}</span>
              </div>
              <div className="hero-actions">
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
                {featured.availability === 'Request' && (
                  <button type="button" className="secondary" onClick={() => setSelectedMovie(featured)}>
                    Request
                  </button>
                )}
              </div>
            </div>
            {featured.poster && (
              <div className="hero-poster">
                <img src={featured.poster} alt={featured.title} />
              </div>
            )}
          </section>

          <section className="content-section streaming-rows">
            <div className="row-header">
              <div>
                <p className="eyebrow">Spotlight</p>
                <h2>Cinematic picks</h2>
              </div>
            </div>
            <div className="scroll-row">
              {filteredMovies.slice(0, 12).map((movie) => (
                <button
                  key={`trend-${movie.id}`}
                  type="button"
                  className="rail-card"
                  onClick={() => setSelectedMovie((prev) => (prev?.id === movie.id ? null : movie))}
                >
                  <img src={movie.poster} alt={movie.title} loading="lazy" />
                  <div className="rail-info">
                    <h3>{movie.title}</h3>
                    <p>{[movie.genre, movie.year].filter(Boolean).join(' • ')}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="discover-layout">
            <div className="filter-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Filters</p>
                  <h3>Refine results</h3>
                </div>
              </div>
              <div className="filter-grid">
                <label>
                  Genre
                  <select value={selectedGenre} onChange={(event) => setSelectedGenre(event.target.value)}>
                    {availableGenres.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Type
                  <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
                    {availableTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Year
                  <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year === 'All' ? 'All years' : year}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Score
                  <select value={selectedScore} onChange={(event) => setSelectedScore(event.target.value)}>
                    {ratingFilters.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Sort
                  <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="catalog">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Discover</p>
                  <h2>Browse the catalog</h2>
                </div>
                <div className="pill muted">{filteredMovies.length} titles</div>
              </div>
              <div className="movie-grid">
                {filteredMovies.map((movie) => {
                  const isSelected = selectedMovie?.id === movie.id;
                  const rating = ratings.find((entry) => entry.movie_id === movie.id)?.rating || '';
                  const socialReviews = userReviews.filter((review) => review.movie_id === movie.id);
                  const myExistingReview = socialReviews.find((review) => review.user_id === user?.id);
                  const draftRating = reviewDrafts[movie.id]?.rating ?? myExistingReview?.rating ?? '';
                  const draftComment = reviewDrafts[movie.id]?.comment ?? myExistingReview?.comment ?? '';
                  const listsContainingMovie = userListItems.filter((entry) => entry.movie_id === movie.id);
                  const myLists = userLists.filter((list) => list.user_id === user?.id);

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
                              {movie.detail && <p className="subtext">{movie.detail}</p>}
                              <div className="detail-meta">
                                <span>{movie.genre}</span>
                                <span>{movie.type}</span>
                                <span>{movie.year}</span>
                                <span>{movie.rating}</span>
                                {movie.platform && <span>Platform: {movie.platform}</span>}
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
                              <p>{(movie.castMembers || []).join(' · ')}</p>
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
                              <h3>Social reviews</h3>
                              {socialReviews.length === 0 && <p className="status">No community reviews yet.</p>}
                              <ul className="review-list">
                                {socialReviews.map((review) => {
                                  const reviewer = userMap.get(review.user_id) || {};
                                  return (
                                    <li key={`${review.user_id}-${review.movie_id}`} className="review-item">
                                      <div className="reviewer-meta">
                                        <div className="avatar chip">
                                          {reviewer.avatar_url ? (
                                            <img src={reviewer.avatar_url} alt={renderUserName(review.user_id)} />
                                          ) : (
                                            <span>{(renderUserName(review.user_id) || 'U').charAt(0)}</span>
                                          )}
                                        </div>
                                        <div>
                                          <strong>{renderUserName(review.user_id)}</strong>
                                          <p className="subtext">
                                            {review.rating ? `★ ${Number(review.rating).toFixed(1)} • ` : ''}
                                            {review.created_at ? new Date(review.created_at).toLocaleString() : ''}
                                          </p>
                                        </div>
                                      </div>
                                      <p className="review-comment">{review.comment}</p>
                                    </li>
                                  );
                                })}
                              </ul>
                              <div className="review-form">
                                <h4>Share your take</h4>
                                <div className="review-grid">
                                  <select
                                    value={draftRating}
                                    onChange={(event) => handleReviewDraftChange(movie.id, 'rating', event.target.value)}
                                  >
                                    <option value="">Select rating</option>
                                    <option value="5">★★★★★</option>
                                    <option value="4">★★★★</option>
                                    <option value="3">★★★</option>
                                    <option value="2">★★</option>
                                    <option value="1">★</option>
                                  </select>
                                  <textarea
                                    rows="3"
                                    placeholder="What did you think?"
                                    value={draftComment}
                                    onChange={(event) => handleReviewDraftChange(movie.id, 'comment', event.target.value)}
                                  />
                                </div>
                                <button
                                  type="button"
                                  className="primary"
                                  onClick={() => handleReviewSubmit(movie.id)}
                                  disabled={!draftRating || !draftComment}
                                >
                                  Post review
                                </button>
                              </div>
                            </div>

                            <div className="detail-card">
                              <h3>Watch options</h3>
                              <ul className="option-list">
                                {(movie.watchOptions || []).map((option, index) => (
                                  <li key={`${option.platform}-${index}`}>
                                    <strong>{option.platform}</strong>
                                    {option.detail && <span>{option.detail}</span>}
                                    {option.instruction && <span>{option.instruction}</span>}
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
                            {(movie.gallery || []).length > 0 && (
                              <div className="detail-card media-stack">
                                <h3>Gallery</h3>
                                <div className="media-grid">
                                  {movie.gallery.map((image, index) => (
                                    <img key={`${image}-${index}`} src={image} alt={`${movie.title} still ${index + 1}`} />
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="detail-card">
                              <h3>Lists & saves</h3>
                              <p className="subtext">Add this title to your lists or explore public collections.</p>
                              <div className="list-add-row">
                                <select
                                  value={listSelections[movie.id] || ''}
                                  onChange={(event) =>
                                    setListSelections((prev) => ({ ...prev, [movie.id]: event.target.value }))
                                  }
                                >
                                  <option value="">Choose one of your lists</option>
                                  {myLists.map((list) => (
                                    <option key={list.id} value={list.id}>
                                      {list.title} {list.is_public ? '(Public)' : '(Private)'}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  className="secondary"
                                  disabled={!listSelections[movie.id]}
                                  onClick={() => handleAddToList(movie.id, listSelections[movie.id])}
                                >
                                  Add
                                </button>
                              </div>
                              <ul className="option-list">
                                {listsContainingMovie
                                  .map((entry) => userListsMap.get(entry.list_id))
                                  .filter((list) => list && (list.is_public || list.user_id === user?.id))
                                  .map((list) => (
                                    <li key={`list-${list.id}`}>
                                      <div className="list-chip">
                                        <div>
                                          <strong>{list.title}</strong>
                                          {list.description && <p className="subtext">{list.description}</p>}
                                          <p className="subtext">
                                            By {renderUserName(list.user_id)} •{' '}
                                            {list.is_public ? 'Public' : 'Private'}
                                          </p>
                                        </div>
                                      </div>
                                    </li>
                                  ))}
                                {listsContainingMovie.length === 0 && (
                                  <li className="subtext">This title hasn’t been added to any public lists yet.</li>
                                )}
                              </ul>
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
            </div>
          </section>
        </>
      )}

      {activeTab === 'feed' && (
        <section className="profile-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Social</p>
              <h2>Activity from people you follow</h2>
              <p className="subtext">See the latest reviews, lists, and saves from your network.</p>
            </div>
          </div>
          <div className="feed-grid">
            {socialFeed.length === 0 && (
              <p className="status">Follow community members to see their activity here.</p>
            )}
            {socialFeed.map((activity) => {
              const actorProfile = userMap.get(activity.actor_id) || {};
              return (
                <div key={activity.id || `${activity.actor_id}-${activity.created_at}`} className="feed-card">
                  <div className="feed-meta">
                    <div className="avatar chip">
                      {actorProfile.avatar_url ? (
                        <img src={actorProfile.avatar_url} alt={renderUserName(activity.actor_id)} />
                      ) : (
                        <span>{(renderUserName(activity.actor_id) || 'U').charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <strong>{renderUserName(activity.actor_id)}</strong>
                      <p className="subtext">{activity.created_at ? new Date(activity.created_at).toLocaleString() : ''}</p>
                    </div>
                  </div>
                  <p className="feed-text">{describeActivity(activity)}</p>
                  {activity.movie_id && (
                    <p className="feed-detail">Movie: {renderMovieTitle(activity.movie_id)}</p>
                  )}
                  {activity.list_id && (
                    <p className="feed-detail">List: {userListsMap.get(activity.list_id)?.title || activity.list_id}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === 'community' && (
        <section className="profile-section community-view">
          <div className="section-header">
            <div>
              <p className="eyebrow">Community</p>
              <h2>Profiles & following</h2>
              <p className="subtext">Connect with other members, follow their lists, and browse their reviews.</p>
            </div>
          </div>
          <div className="community-grid">
            <div className="member-column">
              {communityProfiles.length === 0 && <p className="status">No community profiles yet.</p>}
              {communityProfiles.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className={`member-card ${selectedProfileId === member.id ? 'active' : ''}`}
                  onClick={() => setSelectedProfileId(member.id)}
                >
                  <div className="avatar chip">
                    {member.avatar_url ? <img src={member.avatar_url} alt={member.full_name || member.email} /> : <span>{(member.full_name || member.email || 'U').charAt(0)}</span>}
                  </div>
                  <div>
                    <h4>{member.full_name || member.email}</h4>
                    <p className="subtext">{member.bio || 'No bio yet.'}</p>
                    <div className="member-stats">
                      <span>{followerCounts.get(member.id) || 0} followers</span>
                      <span>{followingCounts.get(member.id) || 0} following</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="profile-column">
              {selectedProfileId ? (
                (() => {
                  const selectedProfile = communityProfiles.find((entry) => entry.id === selectedProfileId);
                  const profileReviews = userReviews.filter((entry) => entry.user_id === selectedProfileId);
                  const profileLists = userLists.filter(
                    (list) => list.user_id === selectedProfileId && (list.is_public || selectedProfileId === user?.id)
                  );
                  const profileFollowers = userFollows
                    .filter((entry) => entry.followee_id === selectedProfileId)
                    .map((entry) => entry.follower_id);
                  const profileFollowing = userFollows
                    .filter((entry) => entry.follower_id === selectedProfileId)
                    .map((entry) => entry.followee_id);
                  const isFollowingSelected = followingSet.has(selectedProfileId);

                  if (!selectedProfile) {
                    return <p className="status">Select a profile to view their activity.</p>;
                  }

                  return (
                    <div className="profile-detail">
                      <div className="profile-hero">
                        <div className="avatar chip large">
                          {selectedProfile.avatar_url ? (
                            <img src={selectedProfile.avatar_url} alt={selectedProfile.full_name || selectedProfile.email} />
                          ) : (
                            <span>{(selectedProfile.full_name || selectedProfile.email || 'U').charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <h3>{selectedProfile.full_name || selectedProfile.email}</h3>
                          <p className="subtext">{selectedProfile.bio || 'This user has not added a bio yet.'}</p>
                          <div className="member-stats">
                            <span>{profileFollowers.length} followers</span>
                            <span>{profileFollowing.length} following</span>
                          </div>
                          {selectedProfile.id !== user?.id && (
                            <button
                              type="button"
                              className={isFollowingSelected ? 'secondary' : 'primary'}
                              onClick={() => handleFollowToggle(selectedProfile.id)}
                            >
                              {isFollowingSelected ? 'Unfollow' : 'Follow'}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="profile-subgrid">
                        <div className="detail-card">
                          <h4>Followers</h4>
                          <ul className="pill-list">
                            {profileFollowers.length === 0 && <li className="subtext">No followers yet.</li>}
                            {profileFollowers.map((followerId) => (
                              <li key={`follower-${followerId}`} className="pill">
                                {renderUserName(followerId)}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="detail-card">
                          <h4>Following</h4>
                          <ul className="pill-list">
                            {profileFollowing.length === 0 && <li className="subtext">Not following anyone yet.</li>}
                            {profileFollowing.map((followeeId) => (
                              <li key={`following-${followeeId}`} className="pill">
                                {renderUserName(followeeId)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="detail-card">
                        <h4>Reviews</h4>
                        <ul className="review-list">
                          {profileReviews.length === 0 && <p className="status">No reviews shared yet.</p>}
                          {profileReviews.map((review) => (
                            <li key={`${review.movie_id}-${review.user_id}`} className="review-item">
                              <div className="reviewer-meta">
                                <div>
                                  <strong>{renderMovieTitle(review.movie_id)}</strong>
                                  <p className="subtext">
                                    ★ {Number(review.rating || 0).toFixed(1)} •{' '}
                                    {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                                  </p>
                                </div>
                              </div>
                              <p className="review-comment">{review.comment}</p>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="detail-card">
                        <h4>Public lists</h4>
                        <div className="list-grid">
                          {profileLists.length === 0 && <p className="status">No public lists yet.</p>}
                          {profileLists.map((list) => {
                            const itemCount = userListItems.filter((entry) => entry.list_id === list.id).length;
                            return (
                              <div key={list.id} className="list-card">
                                <div>
                                  <h3>{list.title}</h3>
                                  {list.description && <p className="subtext">{list.description}</p>}
                                  <p className="subtext">{itemCount} movies</p>
                                </div>
                                <span className="badge">{list.is_public ? 'Public' : 'Private'}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p className="status">Select someone to view their profile.</p>
              )}
            </div>
          </div>
        </section>
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
          <div className="detail-card">
            <h3>Request a movie we don’t have yet</h3>
            <p className="subtext">Can’t find a title? Send the details below and we’ll add it to the queue.</p>
            <form className="profile-form" onSubmit={handleCustomRequestSubmit}>
              <label>
                Movie title
                <input
                  type="text"
                  value={customRequestForm.title}
                  onChange={(event) =>
                    setCustomRequestForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="The film you want to watch"
                />
              </label>
              <label>
                Release year (optional)
                <input
                  type="text"
                  value={customRequestForm.year}
                  onChange={(event) => setCustomRequestForm((prev) => ({ ...prev, year: event.target.value }))}
                  placeholder="2024"
                />
              </label>
              <label>
                Preferred delivery
                <select
                  value={customRequestForm.deliveryMethod}
                  onChange={(event) =>
                    setCustomRequestForm((prev) => ({ ...prev, deliveryMethod: event.target.value }))
                  }
                >
                  <option value="USB">USB</option>
                  <option value="Private Link">Private Link</option>
                  <option value="Remote Session">Remote Session</option>
                </select>
              </label>
              <label>
                Notes for the admins
                <textarea
                  rows="3"
                  value={customRequestForm.details}
                  onChange={(event) => setCustomRequestForm((prev) => ({ ...prev, details: event.target.value }))}
                  placeholder="Tell us which cut, actors, or subtitles you prefer."
                />
              </label>
              <button type="submit" className="primary">
                Submit custom request
              </button>
              {customRequestStatus && <p className="status">{customRequestStatus}</p>}
            </form>
          </div>
          <div className="list-grid">
            {myRequests.length === 0 && <p className="status">No requests yet. Choose a title to submit one.</p>}
            {myRequests.map((request) => (
              <div key={request.id} className="list-card">
                <div>
                  <h3>{renderRequestTitle(request)}</h3>
                  <p>{renderRequestMeta(request)}</p>
                  <div className="admin-tags">
                    <span className="admin-pill">{request.status}</span>
                    <span className="admin-pill muted">{request.delivery_method}</span>
                  </div>
                  {renderRequestNotes(request) && <p className="subtext">{renderRequestNotes(request)}</p>}
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

          <div className="profile-social">
            <div className="detail-card">
              <h3>Your social snapshot</h3>
              <div className="member-stats">
                <span>{followerCounts.get(user?.id) || 0} followers</span>
                <span>{followingCounts.get(user?.id) || 0} following</span>
                <span>
                  {userReviews.filter((entry) => entry.user_id === user?.id).length} reviews shared
                </span>
              </div>
            </div>
            <div className="detail-card">
              <h3>Create a new list</h3>
              <form className="profile-form inline" onSubmit={handleCreateList}>
                <label>
                  Title
                  <input
                    type="text"
                    value={listForm.title}
                    onChange={(event) => setListForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                </label>
                <label>
                  Description (optional)
                  <textarea
                    rows="2"
                    value={listForm.description}
                    onChange={(event) => setListForm((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </label>
                <label className="checkbox-inline">
                  <input
                    type="checkbox"
                    checked={listForm.is_public}
                    onChange={(event) => setListForm((prev) => ({ ...prev, is_public: event.target.checked }))}
                  />
                  <span>Make public</span>
                </label>
                <button type="submit" className="secondary">
                  Save list
                </button>
              </form>
            </div>
            <div className="detail-card">
              <h3>Your lists</h3>
              <div className="list-grid">
                {userLists.filter((list) => list.user_id === user?.id).length === 0 && (
                  <p className="status">No lists yet. Create one to share with others.</p>
                )}
                {userLists
                  .filter((list) => list.user_id === user?.id)
                  .map((list) => {
                    const itemCount = userListItems.filter((entry) => entry.list_id === list.id).length;
                    return (
                      <div key={list.id} className="list-card">
                        <div>
                          <h3>{list.title}</h3>
                          {list.description && <p className="subtext">{list.description}</p>}
                          <p className="subtext">{itemCount} movies</p>
                        </div>
                        <span className="badge">{list.is_public ? 'Public' : 'Private'}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
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
                  <h3>Admin metrics</h3>
                  <p>Live stats sourced from admin_metrics.</p>
                </div>
              </div>
              <ul className="admin-list">
                {adminMetrics.map((metric) => (
                  <li key={metric.id}>
                    <div>
                      <strong>{metric.metric}</strong>
                      <div className="admin-tags">
                        <span className="admin-pill">{metric.value ?? 'n/a'}</span>
                        <span className="admin-pill muted">
                          {metric.recorded_at ? new Date(metric.recorded_at).toLocaleString() : ''}
                        </span>
                      </div>
                      {metric.metadata && Object.keys(metric.metadata).length > 0 && (
                        <p className="subtext">{JSON.stringify(metric.metadata)}</p>
                      )}
                    </div>
                  </li>
                ))}
                {adminMetrics.length === 0 && <p className="status">No metrics recorded yet.</p>}
              </ul>
            </div>
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
                  <label>
                    Platform
                    <input
                      type="text"
                      value={newMovieForm.platform}
                      onChange={(event) => setNewMovieForm((prev) => ({ ...prev, platform: event.target.value }))}
                    />
                  </label>
                  <label>
                    Genres (comma-separated)
                    <input
                      type="text"
                      value={newMovieForm.genresText}
                      onChange={(event) => setNewMovieForm((prev) => ({ ...prev, genresText: event.target.value }))}
                    />
                  </label>
                  <label>
                    Cast members (comma-separated)
                    <input
                      type="text"
                      value={newMovieForm.castMembersText}
                      onChange={(event) =>
                        setNewMovieForm((prev) => ({ ...prev, castMembersText: event.target.value }))
                      }
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
                  Gallery image URLs (comma-separated)
                  <input
                    type="text"
                    value={newMovieForm.galleryText}
                    onChange={(event) => setNewMovieForm((prev) => ({ ...prev, galleryText: event.target.value }))}
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
                <label>
                  Detail / synopsis
                  <textarea
                    rows="3"
                    value={newMovieForm.detail}
                    onChange={(event) => setNewMovieForm((prev) => ({ ...prev, detail: event.target.value }))}
                  />
                </label>
                <label>
                  Watch options (one per line: Platform | Detail | Instruction)
                  <textarea
                    rows="3"
                    value={newMovieForm.watchOptionsText}
                    onChange={(event) => setNewMovieForm((prev) => ({ ...prev, watchOptionsText: event.target.value }))}
                    placeholder="USB | Stored in Vault 2 | Ask admin for pickup"
                  />
                </label>
                <button type="submit">Save movie</button>
              </form>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3>Catalog status</h3>
                  <p>Admin oversight of each movie record.</p>
                </div>
              </div>
              <ul className="admin-list admin-catalog-list">
                {manageableCatalog.map((entry) => (
                  <li key={`catalog-${entry.id}`}>
                    <div>
                      <strong>{entry.title}</strong>
                      <div className="admin-tags">
                        <span className="admin-pill">{entry.status}</span>
                        {entry.availability && <span className="admin-pill muted">{entry.availability}</span>}
                      </div>
                      {entry.notes && <p className="subtext">{entry.notes}</p>}
                    </div>
                    <div className="admin-row-actions">
                      <button type="button" onClick={() => handleEditMovieStart(entry.id)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        disabled={deletingMovieId === entry.id}
                        onClick={() => handleDeleteMovie(entry.id)}
                      >
                        {deletingMovieId === entry.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </li>
                ))}
                {manageableCatalog.length === 0 && <p className="status">No catalog entries found.</p>}
              </ul>
              {editingMovie && (
                <form className="admin-add-form" onSubmit={handleUpdateMovie}>
                  <h4>Edit movie: {editingMovie.title}</h4>
                  <div className="admin-add-grid">
                    <label>
                      Title
                      <input
                        type="text"
                        value={editMovieForm.title}
                        onChange={(event) => handleEditMovieFieldChange('title', event.target.value)}
                      />
                    </label>
                    <label>
                      Genre
                      <input
                        type="text"
                        value={editMovieForm.genre}
                        onChange={(event) => handleEditMovieFieldChange('genre', event.target.value)}
                      />
                    </label>
                    <label>
                      Type
                      <select
                        value={editMovieForm.type}
                        onChange={(event) => handleEditMovieFieldChange('type', event.target.value)}
                      >
                        <option value="Movie">Movie</option>
                        <option value="Series">Series</option>
                      </select>
                    </label>
                    <label>
                      Availability
                      <select
                        value={editMovieForm.availability}
                        onChange={(event) => handleEditMovieFieldChange('availability', event.target.value)}
                      >
                        <option value="Streaming">Streaming</option>
                        <option value="Request">Request</option>
                      </select>
                    </label>
                    <label>
                      Year
                      <input
                        type="number"
                        value={editMovieForm.year}
                        onChange={(event) => handleEditMovieFieldChange('year', event.target.value)}
                      />
                    </label>
                    <label>
                      Rating
                      <input
                        type="text"
                        value={editMovieForm.rating}
                        onChange={(event) => handleEditMovieFieldChange('rating', event.target.value)}
                      />
                    </label>
                    <label>
                      Runtime
                      <input
                        type="text"
                        value={editMovieForm.runtime}
                        onChange={(event) => handleEditMovieFieldChange('runtime', event.target.value)}
                      />
                    </label>
                    <label>
                      Platform
                      <input
                        type="text"
                        value={editMovieForm.platform}
                        onChange={(event) => handleEditMovieFieldChange('platform', event.target.value)}
                      />
                    </label>
                    <label>
                      Genres (comma-separated)
                      <input
                        type="text"
                        value={editMovieForm.genresText}
                        onChange={(event) => handleEditMovieFieldChange('genresText', event.target.value)}
                      />
                    </label>
                    <label>
                      Cast members (comma-separated)
                      <input
                        type="text"
                        value={editMovieForm.castMembersText}
                        onChange={(event) => handleEditMovieFieldChange('castMembersText', event.target.value)}
                      />
                    </label>
                  </div>
                  <label>
                    Director
                    <input
                      type="text"
                      value={editMovieForm.director}
                      onChange={(event) => handleEditMovieFieldChange('director', event.target.value)}
                    />
                  </label>
                  <label>
                    Trailer ID (YouTube)
                    <input
                      type="text"
                      value={editMovieForm.trailerId}
                      onChange={(event) => handleEditMovieFieldChange('trailerId', event.target.value)}
                    />
                  </label>
                  <label>
                    USB location
                    <input
                      type="text"
                      value={editMovieForm.usbLocation}
                      onChange={(event) => handleEditMovieFieldChange('usbLocation', event.target.value)}
                    />
                  </label>
                  <label>
                    Poster URL
                    <input
                      type="url"
                      value={editMovieForm.poster}
                      onChange={(event) => handleEditMovieFieldChange('poster', event.target.value)}
                    />
                  </label>
                  <label>
                    Gallery image URLs (comma-separated)
                    <input
                      type="text"
                      value={editMovieForm.galleryText}
                      onChange={(event) => handleEditMovieFieldChange('galleryText', event.target.value)}
                    />
                  </label>
                  <label>
                    Description
                    <textarea
                      rows="3"
                      value={editMovieForm.description}
                      onChange={(event) => handleEditMovieFieldChange('description', event.target.value)}
                    />
                  </label>
                  <label>
                    Detail / synopsis
                    <textarea
                      rows="3"
                      value={editMovieForm.detail}
                      onChange={(event) => handleEditMovieFieldChange('detail', event.target.value)}
                    />
                  </label>
                  <label>
                    Watch options (one per line: Platform | Detail | Instruction)
                    <textarea
                      rows="3"
                      value={editMovieForm.watchOptionsText}
                      onChange={(event) => handleEditMovieFieldChange('watchOptionsText', event.target.value)}
                      placeholder="USB | Stored in Vault 2 | Ask admin for pickup"
                    />
                  </label>
                  <div className="admin-row-actions">
                    <button type="submit" disabled={isUpdatingMovie}>
                      {isUpdatingMovie ? 'Saving…' : 'Save changes'}
                    </button>
                    <button type="button" className="secondary" onClick={() => setEditingMovie(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3>Requests</h3>
                  <p>Approve or decline member submissions.</p>
                </div>
              </div>
              <div className="admin-request-board">
                {['open', 'inProgress', 'approved', 'rejected'].map((bucketKey) => {
                  const titles = {
                    open: 'Open',
                    inProgress: 'In progress',
                    approved: 'Approved',
                    rejected: 'Rejected',
                  };
                  const items = requestBuckets[bucketKey] || [];

                  return (
                    <div key={bucketKey} className="admin-request-column">
                      <div className="admin-request-column-header">
                        <h4>{titles[bucketKey]}</h4>
                        <span className="badge muted">{items.length}</span>
                      </div>
                      <ul className="admin-list compact">
                        {items.map((request) => (
                          <li key={`${bucketKey}-${request.id}`}>
                            <div>
                              <strong>{renderRequestTitle(request)}</strong>
                              <span>{request.requester_email}</span>
                              <div className="admin-tags">
                                <span className="admin-pill">{request.status}</span>
                                <span className="admin-pill muted">{request.delivery_method}</span>
                                {request.admin?.status && <span className="admin-pill">Admin: {request.admin.status}</span>}
                                {request.admin?.assigned_to && (
                                  <span className="admin-pill muted">Owner: {renderUserName(request.admin.assigned_to)}</span>
                                )}
                              </div>
                              {renderRequestNotes(request) && <p className="subtext">{renderRequestNotes(request)}</p>}
                              {request.admin?.notes && <p className="subtext">{request.admin.notes}</p>}
                            </div>
                            <div className="admin-row-actions">
                              {bucketKey !== 'approved' && (
                                <button type="button" onClick={() => handleRequestStatusUpdate(request.id, 'APPROVED')}>
                                  Approve
                                </button>
                              )}
                              {bucketKey !== 'rejected' && (
                                <button
                                  type="button"
                                  className="secondary"
                                  onClick={() => handleRequestStatusUpdate(request.id, 'REJECTED')}
                                >
                                  Reject
                                </button>
                              )}
                              {bucketKey === 'open' && (
                                <button
                                  type="button"
                                  className="secondary"
                                  onClick={() => handleRequestStatusUpdate(request.id, 'IN_PROGRESS')}
                                >
                                  Start
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                        {items.length === 0 && <p className="status">Nothing here yet.</p>}
                      </ul>
                    </div>
                  );
                })}
              </div>
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
                        <span className="admin-pill">
                          {member.role || (adminUserIds.has(member.id) ? 'admin' : 'member')}
                        </span>
                        <span className="admin-pill muted">
                          Updated {member.updated_at ? new Date(member.updated_at).toLocaleString() : 'n/a'}
                        </span>
                        {adminUserIds.has(member.id) && <span className="admin-pill">Admin</span>}
                      </div>
                    </div>
                  </li>
                ))}
                {users.length === 0 && <p className="status">No users found.</p>}
              </ul>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3>Admin team</h3>
                  <p>Accounts with elevated permissions.</p>
                </div>
              </div>
              <ul className="admin-list">
                {adminUsers.map((adminUser) => (
                  <li key={adminUser.id}>
                    <div>
                      <strong>{renderUserName(adminUser.user_id)}</strong>
                      <div className="admin-tags">
                        <span className="admin-pill">{adminUser.role}</span>
                        <span className="admin-pill muted">
                          Updated {adminUser.updated_at ? new Date(adminUser.updated_at).toLocaleString() : 'n/a'}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
                {adminUsers.length === 0 && <p className="status">No admin users configured.</p>}
              </ul>
            </div>
          </div>
        </section>
      )}

        <nav className="mobile-nav">
          {navTabs.map((tab) => {
            const label = tab === 'admin' ? 'Admin' : tab.charAt(0).toUpperCase() + tab.slice(1);
            return (
              <button
                key={tab}
                type="button"
                className={activeTab === tab ? 'active' : ''}
                onClick={() => handleTabChange(tab)}
              >
                <span className="mobile-nav-label">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
