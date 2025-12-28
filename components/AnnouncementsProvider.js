import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const AnnouncementContext = createContext({
  announcements: [],
  showAnnouncement: () => null,
  dismissAnnouncement: () => {},
});

let externalShowAnnouncement = () => null;

export const showAnnouncement = (announcement) => externalShowAnnouncement(announcement);

export const useAnnouncements = () => useContext(AnnouncementContext);

export function AnnouncementsProvider({ children }) {
  const [announcements, setAnnouncements] = useState([]);
  const timeoutsRef = useRef(new Map());
  const counterRef = useRef(0);

  const dismissAnnouncement = useCallback((id) => {
    setAnnouncements((prev) => prev.filter((announcement) => announcement.id !== id));
    const timer = timeoutsRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const showAnnouncementInternal = useCallback(
    ({ title, message = '', type = 'info', duration = 15000 } = {}) => {
      const id = `announcement-${Date.now()}-${counterRef.current++}`;
      setAnnouncements((prev) => [...prev, { id, title, message, type }]);

      const timer = setTimeout(() => dismissAnnouncement(id), duration);
      timeoutsRef.current.set(id, timer);
      return id;
    },
    [dismissAnnouncement]
  );

  useEffect(() => {
    externalShowAnnouncement = showAnnouncementInternal;
    return () => {
      externalShowAnnouncement = () => null;
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current.clear();
    };
  }, [showAnnouncementInternal]);

  const value = useMemo(
    () => ({
      announcements,
      showAnnouncement: showAnnouncementInternal,
      dismissAnnouncement,
    }),
    [announcements, dismissAnnouncement, showAnnouncementInternal]
  );

  return (
    <AnnouncementContext.Provider value={value}>
      {children}
      <div className="announcement-center" aria-live="polite" aria-atomic="true">
        {announcements.map((announcement) => (
          <div key={announcement.id} className={`announcement-card ${announcement.type || 'info'}`}>
            <div className="announcement-content">
              <p className="announcement-title">{announcement.title}</p>
              {announcement.message && <p className="announcement-message">{announcement.message}</p>}
            </div>
            <button
              type="button"
              className="announcement-close"
              aria-label="Dismiss announcement"
              onClick={() => dismissAnnouncement(announcement.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </AnnouncementContext.Provider>
  );
}
