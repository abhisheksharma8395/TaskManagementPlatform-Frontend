import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import styles from './LandingPage.module.css';

/* ── Scroll-triggered fade-in wrapper ───────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

/* ── Animated counter ────────────────────────────────────────────────── */
function Counter({ to, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(to / 60);
    const id = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(id); }
      else setVal(start);
    }, 20);
    return () => clearInterval(id);
  }, [inView, to]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ── Data ────────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: '🗂️', title: 'Workspace Management', desc: 'Organise projects into workspaces. Control visibility, members, and roles in one place.' },
  { icon: '✅', title: 'Task Tracking', desc: 'Create, assign and track cards across lists with priorities, due dates, and checklists.' },
  { icon: '👥', title: 'Team Collaboration', desc: 'Invite members, assign tasks, leave comments, and get notified in real-time.' },
  { icon: '📊', title: 'Analytics Dashboard', desc: 'Visualise team velocity, task completion rates, and bottlenecks at a glance.' },
  { icon: '⚡', title: 'Real-time Updates', desc: 'Push notifications and live board state keep every teammate in sync instantly.' },
  { icon: '🔒', title: 'Secure Authentication', desc: 'JWT-based sessions, Google OAuth, role-based access controls, and admin gates.' },
];

const STATS = [
  { to: 12000, suffix: '+', label: 'Active Users' },
  { to: 98, suffix: '%', label: 'Uptime SLA' },
  { to: 3500, suffix: '+', label: 'Boards Created' },
  { to: 40, suffix: '%', label: 'Faster Delivery' },
];

const TESTIMONIALS = [
  { name: 'Sarah Mitchell', role: 'Engineering Lead @ Nexus', avatar: 'SM', quote: 'FlowBoard transformed how our 30-person team ships features. The drag-and-drop boards and real-time notifications saved us hours every week.' },
  { name: 'Raj Patel', role: 'CTO @ LaunchStack', avatar: 'RP', quote: 'We migrated from Jira and never looked back. The clean UI, fast load times, and admin controls are exactly what a growing startup needs.' },
  { name: 'Amelia Torres', role: 'Product Manager @ CloudAxis', avatar: 'AT', quote: 'Timeline views and task assignments gave us the visibility we were missing. Our stakeholders love the analytics dashboard.' },
];

const PREVIEW_BOARDS = [
  { color: '#7c3aed', name: 'Product Roadmap', tasks: 14, done: 9 },
  { color: '#0ea5e9', name: 'Sprint 24', tasks: 22, done: 18 },
  { color: '#f97316', name: 'Design System', tasks: 8, done: 5 },
];

/* ── Component ───────────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={styles.root}>
      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <img src="/logo.svg" alt="FlowBoard" width={36} height={36} style={{ display: 'block' }} />
            <span className={styles.logoText}>FlowBoard</span>
          </div>

          <div className={`${styles.navLinks} ${menuOpen ? styles.open : ''}`}>
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#preview" onClick={() => setMenuOpen(false)}>Preview</a>
            <a href="#testimonials" onClick={() => setMenuOpen(false)}>Testimonials</a>
            <a href="#stats" onClick={() => setMenuOpen(false)}>Why Us</a>
          </div>

          <div className={styles.navActions}>
            <button className={styles.navLogin} onClick={() => navigate('/login')}>Login</button>
            <button className={styles.navCta} onClick={() => navigate('/login?mode=register')}>Get Started</button>
          </div>

          <button className={styles.hamburger} onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden />

        <div className={styles.heroContent}>
          <motion.div
            className={styles.heroBadge}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            ✨ &nbsp;Now with real-time collaboration
          </motion.div>

          <motion.h1
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Manage Tasks.<br />
            <span className={styles.heroGradient}>Ship Faster.</span>
          </motion.h1>

          <motion.p
            className={styles.heroSub}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            A powerful Kanban-style workspace platform built for high-performance teams.
            Boards, analytics, and collaboration — all in one place.
          </motion.p>

          <motion.div
            className={styles.heroCtas}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <button className={styles.ctaPrimary} onClick={() => navigate('/login?mode=register')}>
              Get Started Free →
            </button>
            <button className={styles.ctaSecondary} onClick={() => navigate('/login')}>
              Sign In
            </button>
          </motion.div>

          <motion.p
            className={styles.heroNote}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            No credit card required &nbsp;·&nbsp; Free forever plan available
          </motion.p>
        </div>

        {/* Dashboard preview card */}
        <motion.div
          className={styles.heroVisual}
          initial={{ opacity: 0, x: 60, rotateY: 10 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
        >
          <div className={styles.dashCard}>
            <div className={styles.dashHeader}>
              <span className={styles.dashTitle}>📋 My Boards</span>
              <span className={styles.dashPill}>Live</span>
            </div>
            {PREVIEW_BOARDS.map((b) => (
              <div key={b.name} className={styles.dashRow}>
                <span className={styles.dashDot} style={{ background: b.color }} />
                <span className={styles.dashName}>{b.name}</span>
                <div className={styles.dashBar}>
                  <div className={styles.dashBarFill} style={{ width: `${Math.round((b.done / b.tasks) * 100)}%`, background: b.color }} />
                </div>
                <span className={styles.dashCount}>{b.done}/{b.tasks}</span>
              </div>
            ))}
            <div className={styles.dashFooter}>
              <span>3 active boards</span>
              <span className={styles.dashGreen}>▲ 12% this week</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section id="features" className={styles.section}>
        <Reveal>
          <p className={styles.sectionEyebrow}>Everything you need</p>
          <h2 className={styles.sectionTitle}>Built for modern teams</h2>
          <p className={styles.sectionSub}>Six core pillars that make FlowBoard the last tool your team will ever need.</p>
        </Reveal>

        <div className={styles.featureGrid}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.07}>
              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── PRODUCT PREVIEW ──────────────────────────────────────────── */}
      <section id="preview" className={styles.previewSection}>
        <Reveal>
          <p className={styles.sectionEyebrow}>See it in action</p>
          <h2 className={styles.sectionTitle}>Your workspace, beautifully organized</h2>
        </Reveal>

        <div className={styles.previewGrid}>
          <Reveal delay={0.1} className={styles.previewCard}>
            <div className={styles.kanbanMock}>
              <div className={styles.kanbanHeader}>Sprint Board</div>
              {['To Do', 'In Progress', 'Done'].map((col, ci) => (
                <div key={col} className={styles.kanbanCol}>
                  <div className={styles.kanbanColTitle}>{col}</div>
                  {Array.from({ length: ci === 1 ? 3 : 2 }).map((_, i) => (
                    <div key={i} className={styles.kanbanTask}>
                      <span className={styles.kanbanTaskDot} style={{ background: ['#7c3aed', '#0ea5e9', '#22c55e'][ci] }} />
                      Task #{ci * 2 + i + 1}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <p>Kanban boards with drag & drop</p>
          </Reveal>

          <Reveal delay={0.2} className={styles.previewCard}>
            <div className={styles.analyticsMock}>
              <div className={styles.kanbanHeader}>Analytics</div>
              <div className={styles.chartBars}>
                {[65, 80, 45, 90, 72, 88, 60].map((h, i) => (
                  <div key={i} className={styles.bar}>
                    <div className={styles.barFill} style={{ height: `${h}%`, background: `hsl(${260 + i * 10},70%,60%)` }} />
                  </div>
                ))}
              </div>
              <div className={styles.chartLabels}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => <span key={i}>{d[0]}</span>)}
              </div>
            </div>
            <p>Velocity & analytics at a glance</p>
          </Reveal>

          <Reveal delay={0.3} className={styles.previewCard}>
            <div className={styles.notifMock}>
              <div className={styles.kanbanHeader}>Notifications</div>
              {['Card moved to Done ✅', 'New comment by Raj 💬', 'Due date approaching ⚠️', 'Board shared with you 🎉'].map(n => (
                <div key={n} className={styles.notifRow}>{n}</div>
              ))}
            </div>
            <p>Real-time team notifications</p>
          </Reveal>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <section id="stats" className={styles.statsSection}>
        <div className={styles.statsInner}>
          <Reveal>
            <p className={styles.sectionEyebrow} style={{ color: '#a78bfa' }}>By the numbers</p>
            <h2 className={styles.sectionTitle} style={{ color: '#fff' }}>Teams that trust FlowBoard</h2>
          </Reveal>
          <div className={styles.statsGrid}>
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.1}>
                <div className={styles.statCard}>
                  <div className={styles.statNum}><Counter to={s.to} suffix={s.suffix} /></div>
                  <div className={styles.statLabel}>{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
          <div className={styles.whyGrid}>
            {[
              { icon: '🚀', h: 'Blazing fast UI', p: 'React + Vite stack means sub-100ms interactions, even on large boards.' },
              { icon: '🛡️', h: 'Enterprise security', p: 'Role-based access, JWT auth, Google OAuth, and audit logs keep data safe.' },
              { icon: '📱', h: 'Fully responsive', p: 'Works beautifully on desktop, tablet, and mobile — no native app required.' },
            ].map((w, i) => (
              <Reveal key={w.h} delay={i * 0.1}>
                <div className={styles.whyCard}>
                  <span className={styles.whyIcon}>{w.icon}</span>
                  <h3>{w.h}</h3>
                  <p>{w.p}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section id="testimonials" className={styles.section}>
        <Reveal>
          <p className={styles.sectionEyebrow}>Loved by teams</p>
          <h2 className={styles.sectionTitle}>What our users say</h2>
        </Reveal>
        <div className={styles.testimonialGrid}>
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.1}>
              <div className={styles.testimonialCard}>
                <div className={styles.stars}>★★★★★</div>
                <p className={styles.quote}>"{t.quote}"</p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.authorAvatar}>{t.avatar}</div>
                  <div>
                    <div className={styles.authorName}>{t.name}</div>
                    <div className={styles.authorRole}>{t.role}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────── */}
      <section className={styles.ctaBanner}>
        <Reveal>
          <h2>Ready to ship faster?</h2>
          <p>Join thousands of teams already using FlowBoard to streamline their workflow.</p>
          <div className={styles.heroCtas} style={{ justifyContent: 'center' }}>
            <button className={styles.ctaPrimary} onClick={() => navigate('/login?mode=register')}>
              Start for Free →
            </button>
            <button className={styles.ctaSecondary} onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <img src="/logo.svg" alt="FlowBoard" width={36} height={36} style={{ display: 'block' }} />
              <span className={styles.logoText}>FlowBoard</span>
            </div>
            <p>The modern workspace management platform for high-performance teams.</p>
            <div className={styles.socialLinks}>
              {['GitHub', 'Twitter', 'LinkedIn'].map(s => (
                <a key={s} href="#" className={styles.socialBtn}>{s}</a>
              ))}
            </div>
          </div>

          <div className={styles.footerLinks}>
            <div className={styles.footerCol}>
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#preview">Preview</a>
              <a href="#stats">Why Us</a>
            </div>
            <div className={styles.footerCol}>
              <h4>Account</h4>
              <a onClick={() => navigate('/login')} href="#">Login</a>
              <a onClick={() => navigate('/login?mode=register')} href="#">Sign Up</a>
              <a onClick={() => navigate('/login?admin=true')} href="#">Admin Login</a>
            </div>
            <div className={styles.footerCol}>
              <h4>Contact</h4>
              <a href="mailto:support@flowboard.io">support@flowboard.io</a>
              <a href="#">Documentation</a>
              <a href="#">Privacy Policy</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} FlowBoard. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
