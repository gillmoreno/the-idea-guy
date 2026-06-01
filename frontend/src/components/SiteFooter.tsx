export function SiteFooter() {
  return (
    <footer className="site-footer" id="about">
      <div className="site-footer-inner">
        <p>
          <span className="status-dot" aria-hidden="true" />
          Built as a monolith — Next.js static + Go API + nginx
        </p>
        <p>© {new Date().getFullYear()} The Idea Guy</p>
      </div>
    </footer>
  );
}
