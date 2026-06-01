export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a className="logo" href="/">
          <span className="logo-mark">IG</span>
          <span>The Idea Guy</span>
        </a>
        <nav className="nav" aria-label="Primary">
          <a href="#method">The lens</a>
          <a href="#builds">Shipped</a>
          <a href="#ideas">Ideas</a>
          <a href="#tools">Stack</a>
          <a href="#about">About</a>
        </nav>
      </div>
    </header>
  );
}
