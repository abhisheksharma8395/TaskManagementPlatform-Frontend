from __future__ import annotations

from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    ListFlowable,
    ListItem,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "interview-prep"
OUTPUT_PDF = OUTPUT_DIR / "FlowBoard_React_Interview_Notes.pdf"


class InterviewDocTemplate(BaseDocTemplate):
    def __init__(self, filename, **kwargs):
        super().__init__(filename, **kwargs)
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="normal",
        )
        template = PageTemplate(id="normal", frames=[frame], onPage=self._on_page)
        self.addPageTemplates([template])

    def _on_page(self, canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 9)
        canvas.setFillColor(colors.HexColor("#4B5563"))
        canvas.drawString(doc.leftMargin, 0.45 * inch, "FlowBoard React Project - Interview Preparation")
        canvas.drawRightString(LETTER[0] - doc.rightMargin, 0.45 * inch, f"Page {doc.page}")
        canvas.restoreState()

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            text = flowable.getPlainText()
            style_name = flowable.style.name
            if style_name == "H1":
                self.notify("TOCEntry", (0, text, self.page))
            elif style_name == "H2":
                self.notify("TOCEntry", (1, text, self.page))
            elif style_name == "H3":
                self.notify("TOCEntry", (2, text, self.page))


def add_para(story, text, styles, style_name="Body"):
    story.append(Paragraph(text, styles[style_name]))
    story.append(Spacer(1, 6))


def add_bullets(story, items, styles, left_indent=14):
    bullet_items = [ListItem(Paragraph(item, styles["BodyBullet"]), leftIndent=left_indent) for item in items]
    story.append(
        ListFlowable(
            bullet_items,
            bulletType="bullet",
            leftIndent=left_indent,
            bulletFontName="Helvetica",
            bulletFontSize=9,
        )
    )
    story.append(Spacer(1, 8))


def add_numbered(story, items, styles, left_indent=14):
    number_items = [ListItem(Paragraph(item, styles["BodyBullet"]), leftIndent=left_indent) for item in items]
    story.append(
        ListFlowable(
            number_items,
            bulletType="1",
            leftIndent=left_indent,
            bulletFontName="Helvetica",
            bulletFontSize=9,
        )
    )
    story.append(Spacer(1, 8))


def add_code(story, code, styles):
    story.append(Preformatted(code.strip("\n"), styles["CodeBlock"]))
    story.append(Spacer(1, 8))


def add_h1(story, text, styles):
    story.append(Paragraph(text, styles["H1"]))
    story.append(Spacer(1, 8))


def add_h2(story, text, styles):
    story.append(Paragraph(text, styles["H2"]))
    story.append(Spacer(1, 6))


def add_h3(story, text, styles):
    story.append(Paragraph(text, styles["H3"]))
    story.append(Spacer(1, 4))


def add_concept_block(story, styles, concept, definition, why_used, why_this_project, where_used, flow, interview, mistakes, points):
    add_h3(story, concept, styles)
    add_bullets(
        story,
        [
            f"<b>Definition:</b> {definition}",
            f"<b>Why it is used:</b> {why_used}",
            f"<b>Why this project uses it:</b> {why_this_project}",
            f"<b>Where it is used:</b> {where_used}",
            f"<b>Flow explanation:</b> {flow}",
            f"<b>Interview explanation:</b> {interview}",
            f"<b>Common mistakes:</b> {mistakes}",
            f"<b>Important interview points:</b> {points}",
        ],
        styles,
    )


def build_pdf():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="CoverTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=28,
            leading=34,
            textColor=colors.HexColor("#111827"),
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CoverSub",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=12,
            leading=18,
            textColor=colors.HexColor("#374151"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="H1",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=23,
            textColor=colors.HexColor("#0F172A"),
            spaceBefore=16,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="H2",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=19,
            textColor=colors.HexColor("#1E293B"),
            spaceBefore=12,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="H3",
            parent=styles["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#334155"),
            spaceBefore=8,
            spaceAfter=3,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Body",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=15,
            textColor=colors.HexColor("#111827"),
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BodyBullet",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10.2,
            leading=14.2,
            textColor=colors.HexColor("#111827"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="CodeBlock",
            parent=styles["Code"],
            fontName="Courier",
            fontSize=8.6,
            leading=11.5,
            leftIndent=8,
            rightIndent=8,
            backColor=colors.HexColor("#F8FAFC"),
            borderPadding=6,
            borderColor=colors.HexColor("#E5E7EB"),
            borderWidth=0.6,
            borderRadius=2,
        )
    )

    doc = InterviewDocTemplate(
        str(OUTPUT_PDF),
        pagesize=LETTER,
        leftMargin=0.72 * inch,
        rightMargin=0.72 * inch,
        topMargin=0.72 * inch,
        bottomMargin=0.72 * inch,
        title="FlowBoard React Interview Notes",
        author="Codex",
    )

    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle(
            fontName="Helvetica",
            fontSize=10.5,
            name="TOCLevel1",
            leftIndent=16,
            firstLineIndent=-8,
            spaceBefore=3,
            leading=13,
        ),
        ParagraphStyle(
            fontName="Helvetica",
            fontSize=9.5,
            name="TOCLevel2",
            leftIndent=28,
            firstLineIndent=-8,
            spaceBefore=1.5,
            leading=12,
            textColor=colors.HexColor("#374151"),
        ),
        ParagraphStyle(
            fontName="Helvetica",
            fontSize=8.8,
            name="TOCLevel3",
            leftIndent=40,
            firstLineIndent=-8,
            spaceBefore=1.2,
            leading=11.5,
            textColor=colors.HexColor("#6B7280"),
        ),
    ]

    story = []

    # Cover page
    story.append(Spacer(1, 1.15 * inch))
    story.append(Paragraph("FlowBoard Frontend", styles["CoverTitle"]))
    story.append(Paragraph("Complete React Project Interview Preparation and Revision Notes", styles["CoverSub"]))
    story.append(Spacer(1, 20))
    add_bullets(
        story,
        [
            "Repository analyzed: C:/Users/abhip/TaskManagementPlatform-Frontend",
            "Framework: React 19 + Vite + React Router v7",
            "Architecture: Context API + service layer + API gateway backend",
            "Deliverable type: Implementation-specific interview PDF (not generic theory)",
            f"Generated on: {date.today().strftime('%B %d, %Y')}",
        ],
        styles,
        left_indent=18,
    )
    summary_table = Table(
        [
            ["Area", "Observation"],
            ["Project scale", "77 tracked source/config files in repository"],
            ["Global state", "AuthContext and BoardContext (no Redux)"],
            ["Auth model", "JWT token in localStorage, ProtectedRoute, OAuth callback route"],
            ["Backend connectivity", "Axios instance + microservice endpoints via API gateway"],
            ["Code quality notes", "Build passes, lint has issues and improvement opportunities"],
        ],
        colWidths=[1.8 * inch, 4.55 * inch],
    )
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEF2FF")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#111827")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 10),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 1), (-1, -1), 9.6),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(summary_table)
    story.append(PageBreak())

    # TOC
    add_h1(story, "Table of Contents", styles)
    story.append(toc)
    story.append(PageBreak())

    # 1. Project snapshot
    add_h1(story, "1. Project Snapshot", styles)
    add_para(
        story,
        "This project is a task/workspace management frontend with role-aware collaboration features. "
        "The implementation is service-driven and context-driven: pages/components trigger actions from context, "
        "context calls API service functions, service functions call axios, and backend responses update context state and UI.",
        styles,
    )
    add_h2(story, "1.1 Tech Stack and Libraries", styles)
    add_bullets(
        story,
        [
            "React 19 and react-dom 19 for UI rendering.",
            "Vite 8 for development server and production build.",
            "react-router-dom 7 for routing and route guards.",
            "axios for backend communication and request interceptors.",
            "@hello-pangea/dnd for board/list/card drag-and-drop.",
            "framer-motion for landing page animation effects.",
            "lucide-react for iconography.",
            "CSS Modules for component-level styling.",
        ],
        styles,
    )
    add_h2(story, "1.2 Top Level Folder Structure", styles)
    structure_table = Table(
        [
            ["Folder/File", "Purpose in this project"],
            ["src/main.jsx", "React entry point with StrictMode and App mount."],
            ["src/App.jsx", "All route definitions and layout composition."],
            ["src/context", "AuthContext and BoardContext global state/actions."],
            ["src/api", "All backend service wrappers and axios instance."],
            ["src/pages", "Route-level screens (Auth, Dashboard, Workspace, Board, Admin)."],
            ["src/components", "Reusable UI, modals, board/list/card features."],
            ["src/utils/permissions.js", "Centralized role checks and JWT claim helpers."],
            [".env.example", "VITE_API_BASE_URL backend gateway URL setting."],
            ["package.json", "Project scripts and dependency manifest."],
        ],
        colWidths=[2.2 * inch, 4.15 * inch],
    )
    structure_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#ECFEFF")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CFE8F9")),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9.3),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(structure_table)
    story.append(Spacer(1, 10))

    # 2. Component hierarchy
    add_h1(story, "2. Component Hierarchy and Rendering Layers", styles)
    add_para(story, "Primary runtime hierarchy from actual implementation:", styles)
    add_code(
        story,
        """
main.jsx
  -> App
    -> AuthProvider
      -> BrowserRouter
        -> Routes
          Public:
            / -> RootRoute -> LandingPage
            /login -> LoginRoute -> AuthPage
            /oauth-success -> OAuthSuccess
          Protected:
            ProtectedRoute -> AppLayout
              -> Navbar
              -> Sidebar
              -> Outlet page
                /dashboard -> Dashboard
                /public-dashboard -> PublicDashboard
                /workspaces/:workspaceId -> WorkspacePage
                /boards/:boardId -> BoardPage -> Board
                /tasks -> MyTasks
                /settings -> Settings
          Admin-only:
            ProtectedRoute(requirePlatformAdmin=true) -> AppLayout -> AdminPage
        """,
        styles,
    )
    add_para(
        story,
        "Nested Board hierarchy in /boards/:boardId route:",
        styles,
    )
    add_code(
        story,
        """
Board
  -> List (multiple)
     -> Card (multiple)
  -> CardModal (opened for create/edit/view)
     -> AttachmentUpload
     -> Comment thread UI
     -> Checklist and Label management
  -> BoardSettingsModal
  -> ConfirmModal (delete actions)
        """,
        styles,
    )

    # 3. Routing
    add_h1(story, "3. Routing Structure and Protected Navigation", styles)
    add_h2(story, "3.1 Route Definitions (src/App.jsx)", styles)
    add_code(
        story,
        """
<Route path="/" element={<RootRoute />} />
<Route path="/login" element={<LoginRoute />} />
<Route path="/oauth-success" element={<OAuthSuccess />} />

<Route element={<ProtectedRoute />}>
  <Route element={<AppLayout />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/public-dashboard" element={<PublicDashboard />} />
    <Route path="/workspaces/:workspaceId" element={<WorkspacePage />} />
    <Route path="/boards/:boardId" element={<BoardPage />} />
    <Route path="/tasks" element={<MyTasks />} />
    <Route path="/settings" element={<Settings />} />
  </Route>
</Route>

<Route element={<ProtectedRoute requirePlatformAdmin />}>
  <Route element={<AppLayout />}>
    <Route path="/admin" element={<AdminPage />} />
  </Route>
</Route>
        """,
        styles,
    )
    add_h2(story, "3.2 Protected Route Behavior", styles)
    add_bullets(
        story,
        [
            "File: src/components/ProtectedRoute.jsx",
            "If loading is true -> render loading text.",
            "If user is null -> redirect to /login and preserve from location.",
            "If admin route and user is not platform admin -> redirect to /dashboard.",
            "Else -> render Outlet.",
        ],
        styles,
    )

    # 4. Authentication
    add_h1(story, "4. Authentication and Token Architecture", styles)
    add_h2(story, "4.1 Core Auth Files", styles)
    add_bullets(
        story,
        [
            "src/context/AuthContext.jsx",
            "src/api/authService.js",
            "src/api/axiosInstance.js",
            "src/pages/AuthPage/AuthPage.jsx",
            "src/App.jsx (OAuthSuccess, RootRoute, LoginRoute)",
        ],
        styles,
    )
    add_h2(story, "4.2 Token Handling Flow", styles)
    add_code(
        story,
        """
1) User logs in from AuthPage -> useAuth().login(username, password)
2) AuthContext.login -> authService.login
3) token saved in localStorage["token"]
4) profile fetched by username -> localStorage["user"]
5) axios interceptor reads token for every request:
     Authorization: Bearer <token>
6) On 401 response:
     localStorage token/user cleared
     browser redirected to "/"
        """,
        styles,
    )
    add_h2(story, "4.3 OAuth Login Flow", styles)
    add_bullets(
        story,
        [
            "AuthPage builds GOOGLE_OAUTH_URL using VITE_API_BASE_URL + /auth-service/oauth2/authorization/google.",
            "After backend OAuth success, frontend route /oauth-success reads token from query parameter.",
            "OAuthSuccess in src/App.jsx calls loginWithToken(token).",
            "loginWithToken decodes JWT payload, extracts username from sub claim, fetches profile, persists session.",
            "Route then redirects to /dashboard.",
        ],
        styles,
    )
    add_h2(story, "4.4 Auth-Specific Interview Points", styles)
    add_bullets(
        story,
        [
            "Session rehydration is done at AuthProvider mount using localStorage token + cached user.",
            "Role normalization maps ADMIN to PLATFORM_ADMIN in permissions utility.",
            "Auth page enforces portal separation: admin login tab blocks non-admin user, and user tab blocks admin account.",
            "Global 401 handling is centralized in axios interceptor, not repeated in each API call.",
        ],
        styles,
    )

    # 5. State management
    add_h1(story, "5. State Management Flow (Context API)", styles)
    add_h2(story, "5.1 AuthContext State and Actions", styles)
    add_bullets(
        story,
        [
            "State: user, loading.",
            "Actions: login, loginWithToken, register, logout, updateUser.",
            "Derived values: role, isPlatformAdmin.",
            "Persistence: localStorage token and user object.",
        ],
        styles,
    )
    add_h2(story, "5.2 BoardContext State and Actions", styles)
    add_bullets(
        story,
        [
            "State includes workspaces, publicWorkspaces, boards, lists, cards, member maps, loading flags, and error.",
            "Action groups: workspace CRUD, board CRUD, list CRUD/reorder, card CRUD/move/assignee, member management.",
            "Normalization helpers convert backend IDs like workspaceId/boardId/cardId to string id for React state.",
            "Permission gates are enforced before mutating APIs (ensureWorkspaceAccess, ensureBoardAccess).",
            "On user change, fetchWorkspaces and fetchAssignedBoards run automatically in useEffect.",
        ],
        styles,
    )
    add_h2(story, "5.3 Board Data Loading Chain", styles)
    add_code(
        story,
        """
Auth user available
  -> BoardContext.useEffect fetchWorkspaces(userId)
  -> setActiveWorkspaceId
  -> Sidebar/WorkspacePage triggers fetchBoards(workspaceId)
  -> BoardPage sets activeBoardId from route param
  -> BoardContext.useEffect fetchLists(activeBoardId)
  -> for each list -> fetchCards(list.id)
  -> Board component consumes getBoardLists/getListCards derived selectors
        """,
        styles,
    )

    # 6. API layer
    add_h1(story, "6. API Service Layer and Backend Communication", styles)
    add_h2(story, "6.1 Axios Configuration", styles)
    add_code(
        story,
        """
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8765";
const axiosInstance = axios.create({ baseURL: API_BASE_URL });

request interceptor:
  attach Authorization Bearer token if localStorage token exists

response interceptor:
  if status 401 -> clear localStorage token/user and redirect "/"
        """,
        styles,
    )
    add_h2(story, "6.2 Service Files and Microservice Boundaries", styles)
    api_table = Table(
        [
            ["Service file", "Gateway path family", "Main usage locations"],
            ["authService.js", "/auth-service/auth/*", "AuthPage, AuthContext, Board/Card comments author hydrate, AvatarUpload, AdminPage"],
            ["workspaceService.js", "/workspace-service/workspaces/*", "BoardContext, Sidebar, AdminPage"],
            ["boardService.js", "/board-service/boards/*", "BoardContext, MyTasks, AdminPage"],
            ["listService.js", "/list-service/lists/*", "BoardContext list lifecycle"],
            ["cardService.js", "/card-service/cards/*", "BoardContext card lifecycle, CardModal, MyTasks"],
            ["commentService.js", "/comment-service/*", "CardModal comments and attachments"],
            ["labelService.js", "/label-service/*", "Card and CardModal labels/checklists"],
            ["notificationService.js", "/notification-service/*", "Navbar, AdminPage broadcast"],
        ],
        colWidths=[1.6 * inch, 1.95 * inch, 2.8 * inch],
    )
    api_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F0FDF4")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.8),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#BBF7D0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(api_table)
    story.append(Spacer(1, 8))
    add_para(
        story,
        "Environment configuration is minimal and explicit: VITE_API_BASE_URL appears in src/api/axiosInstance.js and src/pages/AuthPage/AuthPage.jsx.",
        styles,
    )

    # 7. Concepts
    add_h1(story, "7. React Concepts Used in THIS Project", styles)
    add_para(
        story,
        "Each block below includes implementation-specific references from this repository.",
        styles,
    )

    concept_blocks = [
        (
            "JSX",
            "Declarative syntax that returns UI elements.",
            "It maps component state directly to visual output.",
            "All pages/components are written in JSX files under src/pages and src/components.",
            "Every rendered view in App routes and feature components.",
            "Context state changes cause JSX trees to re-render with latest board/workspace/card data.",
            "Say: JSX is the view layer that reflects context/service state in this app.",
            "Putting business logic-heavy expressions inline and making JSX too dense.",
            "Use JSX structure to show component boundaries and ownership in interviews.",
        ),
        (
            "Components",
            "Reusable UI units with isolated logic and props.",
            "Encapsulation improves maintainability and reuse.",
            "Board, List, Card, CardModal, Navbar, Sidebar, Avatar, ConfirmModal are modular units.",
            "src/components/* and src/pages/*.",
            "Parent components pass IDs/callbacks; child components trigger context actions or local UI updates.",
            "Explain how page components orchestrate context while reusable components stay focused.",
            "Overloading one component with too many responsibilities.",
            "Mention separation between route screens and shared UI widgets.",
        ),
        (
            "Props",
            "Inputs passed from parent component to child component.",
            "To pass data and actions down tree without global state for everything.",
            "Board passes list and handlers into List; List passes card and edit handler into Card.",
            "Board.jsx, List.jsx, Card.jsx, CardModal.jsx, ConfirmModal.jsx.",
            "Props carry IDs, readOnly flags, callbacks like onEdit/onClose/onConfirm.",
            "Highlight prop-driven composition in board/list/card stack.",
            "Prop drilling too deep without context boundaries.",
            "Show where props are better than context for local relationships.",
        ),
        (
            "State",
            "Mutable data stored inside components or contexts.",
            "To drive reactivity in UI.",
            "Local UI state for forms/modals; global state in AuthContext and BoardContext.",
            "useState across pages/components plus context state maps.",
            "API response updates state, state updates render.",
            "Differentiate global domain state vs local interaction state.",
            "Mixing transient UI state into global context unnecessarily.",
            "Interviewers like clear state ownership explanation.",
        ),
        (
            "useState",
            "Hook for local state in function components.",
            "Needed for forms, toggles, modal visibility, progress, filters.",
            "Used heavily for login form mode, board modal flags, sidebar dropdowns, my-task filters.",
            "AuthPage.jsx, Board.jsx, Sidebar.jsx, CardModal.jsx, Settings.jsx, others.",
            "User action -> setState -> re-render with updated UI.",
            "Give a concrete example: mode switch in AuthPage and form reset.",
            "Forgetting to reset related fields when changing mode.",
            "State naming clarity matters in complex components.",
        ),
        (
            "useEffect",
            "Hook for side effects such as API calls and subscriptions.",
            "Needed for startup fetches and synchronization with route/context changes.",
            "AuthContext hydrates user on mount; BoardContext fetches data on user/board changes.",
            "AuthContext.jsx, BoardContext.jsx, Navbar.jsx, BoardPage.jsx, MyTasks.jsx.",
            "Dependency change -> effect runs -> async service call -> set state.",
            "Explain dependencies and why certain effects intentionally run on route change.",
            "Missing dependency arrays or stale closures causing outdated data.",
            "Mention cleanup patterns and request race considerations.",
        ),
        (
            "useRef",
            "Mutable container that does not trigger render.",
            "Useful for DOM anchors and stable mutable references.",
            "Used for click-outside behavior, debounce timers, and board list reference in BoardPage.",
            "Board.jsx, Card.jsx, CardModal.jsx, Sidebar.jsx, Navbar.jsx, BoardPage.jsx.",
            "Ref stores element or timer -> event handlers read/write without re-render.",
            "Show why BoardPage uses boardsRef to avoid effect reruns on every boards update.",
            "Using ref when state should be used for rendering data.",
            "Differentiate useRef vs useState clearly.",
        ),
        (
            "useMemo",
            "Memoizes derived values.",
            "Avoids recomputing expensive or repeated derivations.",
            "Used for sorted workspace lists, derived role/summary values, filtered tasks, nav links.",
            "Dashboard.jsx, Board.jsx, Sidebar.jsx, PublicDashboard.jsx, AdminPage.jsx.",
            "Inputs change -> recompute memoized result -> render uses stable derived data.",
            "Describe one concrete memo: boardSummary in Board.jsx.",
            "Memoizing trivial values with no measurable gain.",
            "Use for derived collections used multiple times in render.",
        ),
        (
            "useCallback",
            "Memoizes function identity.",
            "Useful when callbacks are dependencies or passed down often.",
            "BoardContext exposes many stable action functions with useCallback.",
            "AuthContext.jsx and BoardContext.jsx.",
            "Stable callback references reduce unnecessary effect triggers in consumers.",
            "Point out how context action functions are wrapped and exported.",
            "Wrapping every function blindly without benefit.",
            "UseCallback is valuable in context providers to avoid value churn.",
        ),
        (
            "Custom Hooks",
            "Project-specific hooks built from existing hooks.",
            "Encapsulates context access and guard logic.",
            "useAuth and useBoard wrap useContext and enforce provider usage.",
            "AuthContext.jsx and BoardContext.jsx export these hooks.",
            "Consumer imports hook -> gets state/actions from provider value.",
            "Mention thrown error when hook is used outside provider.",
            "Forgetting provider wrappers around route tree.",
            "Custom hooks improve developer ergonomics and safety.",
        ),
        (
            "Context API",
            "React mechanism for sharing global state without prop drilling.",
            "Ideal for cross-cutting app data.",
            "AuthContext for user/session and BoardContext for all workspace-board-list-card operations.",
            "src/context/AuthContext.jsx and src/context/BoardContext.jsx.",
            "Provider wraps app layout, consumers pull state/actions via hooks.",
            "Explain this as project's state backbone replacing Redux.",
            "Huge monolithic context can become heavy if not segmented.",
            "Discuss tradeoff: simple architecture but large provider surface.",
        ),
        (
            "Redux / Redux Toolkit",
            "External global state library with reducers and predictable events.",
            "Common in larger apps with strict state/event architecture.",
            "Not used in this project. Context API is the chosen approach.",
            "No Redux store/slice files exist in repository.",
            "State mutations happen via context action functions and setState.",
            "Say: project intentionally uses Context for simpler setup.",
            "Claiming Redux knowledge without mapping to actual code.",
            "Be explicit that no Redux middleware/devtools pipeline is present.",
        ),
        (
            "Routing",
            "URL-based view selection and navigation.",
            "Required for multi-screen product behavior.",
            "App routes include public pages, protected app pages, and admin-only pages.",
            "src/App.jsx with BrowserRouter, Routes, Route, Navigate, Outlet.",
            "Route match -> component mount -> effects fetch relevant data.",
            "Explain nested routes: ProtectedRoute + AppLayout + Outlet.",
            "Hardcoding redirect logic in many places instead of central routes.",
            "Show route guards and fallback route behavior.",
        ),
        (
            "Protected Routes",
            "Guarded routes that require auth or role.",
            "Prevents unauthorized page access.",
            "ProtectedRoute checks loading, user existence, and platform admin requirement.",
            "src/components/ProtectedRoute.jsx and usage in src/App.jsx.",
            "Unauthorized user redirected to login with original location state.",
            "Mention admin route protection with requirePlatformAdmin prop.",
            "Only protecting UI buttons but not routes.",
            "Route-level guard is first line before screen mount.",
        ),
        (
            "Axios / API calls",
            "HTTP client abstraction for backend communication.",
            "Centralizes headers, interceptors, and error behavior.",
            "All service files call shared axios instance; token handled automatically.",
            "src/api/axiosInstance.js and src/api/*.js.",
            "Component/context action -> service function -> axios request -> response data -> state update.",
            "Discuss gateway-based endpoint prefixes and modular services.",
            "Calling backend directly from JSX instead of service layer.",
            "Service layer keeps UI code cleaner and testable.",
        ),
        (
            "Forms",
            "Controlled input patterns for user data entry.",
            "Needed for login, create/edit forms, settings, invites, comments.",
            "State-backed forms are used across AuthPage, Dashboard modal, WorkspacePage, CardModal, Settings.",
            "Multiple page/component files with input/select/textarea and submit handlers.",
            "Input change updates state, submit triggers async action and loading/error feedback.",
            "Use one concrete example: AuthPage mode-specific form behavior.",
            "Not resetting form state on mode/context switch.",
            "Controlled components simplify validation and UX messaging.",
        ),
        (
            "Event Handling",
            "Responding to user actions (click, submit, keydown, blur, drag).",
            "Essential for interactive workflow tools.",
            "Drag/drop handlers, modal close handlers, key events for quick add/edit are used widely.",
            "Board.jsx, List.jsx, CardModal.jsx, Sidebar.jsx, AuthPage.jsx.",
            "User event triggers function -> possibly async context action -> UI update.",
            "Mention keyboard support examples (Enter/Escape in list/card forms).",
            "Not stopping propagation in overlays leading to accidental closes.",
            "Event strategy improves productivity in board UI.",
        ),
        (
            "Conditional Rendering",
            "Rendering UI fragments based on conditions.",
            "To handle auth state, permissions, loading, empty states.",
            "Guest/member/admin UI differences are heavily condition-based.",
            "ProtectedRoute, Board, WorkspacePage, Sidebar, MyTasks, AuthPage.",
            "State/role flags decide visibility of actions, modals, and sections.",
            "Explain how permissions utility drives condition checks.",
            "Scattered role logic without central utility.",
            "Centralized permission functions improve consistency.",
        ),
        (
            "LocalStorage / sessionStorage",
            "Browser persistence mechanisms.",
            "To retain session between page refreshes.",
            "localStorage is used for token and user cache; sessionStorage is not used.",
            "AuthContext.jsx and axiosInstance.js contain localStorage logic.",
            "On app init AuthContext reads localStorage; on logout/401 storage is cleared.",
            "State clearly: sessionStorage is absent in this implementation.",
            "Storing sensitive data without expiration strategy.",
            "Know where persistence is read and invalidated.",
        ),
        (
            "Authentication",
            "Identity verification process before protected access.",
            "Needed to secure workspace and board data.",
            "Supports username/password login/register and Google OAuth callback flow.",
            "AuthPage.jsx, AuthContext.jsx, App.jsx OAuthSuccess, authService.js.",
            "Login -> token + profile -> context user -> protected pages unlocked.",
            "Mention portal gating between admin and non-admin logins.",
            "Trusting frontend-only role checks without backend authorization.",
            "Frontend checks improve UX but backend remains source of truth.",
        ),
        (
            "Token Handling",
            "Creating, storing, attaching, and invalidating JWT tokens.",
            "Required for authenticated API requests.",
            "Token saved after login, attached in interceptor, decoded for role/sub in context.",
            "AuthContext buildSessionUser + permissions.decodeJwtClaims + axios interceptor.",
            "token -> decode claims -> fetch profile -> normalize role -> persisted session.",
            "Be ready to explain why both token claims and fetched profile are used.",
            "Only decoding token and skipping profile refresh can cause stale user data.",
            "This project combines token claim read with profile fetch for better data quality.",
        ),
        (
            "Error Handling",
            "Capturing and surfacing failures in async operations.",
            "Important for user trust and recoverability.",
            "Most async actions catch request errors and set message state; axios handles global 401.",
            "AuthPage, Dashboard, WorkspacePage, CardModal, Settings, BoardContext.",
            "API failure -> catch -> setError or fallback value -> UI feedback.",
            "Discuss layered handling: local component errors plus global unauthorized behavior.",
            "Silent catches hide actionable failures.",
            "Balance user-friendly errors with logging for diagnostics.",
        ),
        (
            "Reusable Components",
            "Shared components that reduce duplication.",
            "Consistency and maintainability.",
            "Avatar, ConfirmModal, SkeletonLoader, AttachmentUpload, ColorWheelPicker are reused.",
            "src/components/Avatar, ConfirmModal, SkeletonLoader, etc.",
            "Feature screens compose these blocks instead of re-implementing UI each time.",
            "Show how AvatarStack and ConfirmModal are used across pages.",
            "Building screen-specific duplicates with slight style differences.",
            "Reusable design system components speed feature delivery.",
        ),
        (
            "Performance Optimization",
            "Reducing unnecessary re-renders and expensive work.",
            "Needed because board UI can be data-heavy.",
            "useMemo/useCallback used in contexts and screens; optimistic deleteCard improves perceived speed.",
            "BoardContext, Dashboard, Sidebar, Board, MyTasks.",
            "Derived data and stable callbacks minimize churn in nested components.",
            "Mention build warning: large chunk suggests code-splitting opportunity.",
            "Ignoring bundle size and rerender hotspots in board views.",
            "Performance talk should include render, network, and bundle concerns.",
        ),
        (
            "Lazy Loading",
            "Dynamic import of route/component chunks.",
            "Improves initial bundle load in large apps.",
            "Not implemented currently; routes are eagerly imported in App.jsx.",
            "No React.lazy or Suspense usage found.",
            "Entire route component code ships in main bundle.",
            "Use this as improvement: lazy-load admin/landing/board-heavy pages.",
            "Assuming Vite auto-splits everything without dynamic imports.",
            "Observed build output has >500k JS chunk warning.",
        ),
        (
            "Environment Variables",
            "Build-time configuration values prefixed with VITE_.",
            "Separates environment-specific URLs from code.",
            "VITE_API_BASE_URL drives API gateway URL and OAuth URL construction.",
            "src/api/axiosInstance.js and src/pages/AuthPage/AuthPage.jsx.",
            "If env value missing, fallback defaults to http://localhost:8765.",
            "Explain how .env.example documents expected variable.",
            "Forgetting VITE_ prefix in Vite projects.",
            "Environment config should be validated during deployment.",
        ),
        (
            "Rendering Flow",
            "How state, context, and route changes produce UI updates.",
            "Critical for debugging and explaining behavior.",
            "App mount -> auth hydrate -> route guard -> layout -> context-driven data fetch -> child render.",
            "main.jsx, App.jsx, AuthContext.jsx, BoardContext.jsx, page and component files.",
            "Any context setState cascades through subscribed components.",
            "Give timeline from login to board cards rendered.",
            "Triggering broad context updates for tiny UI-only changes.",
            "Knowing render flow helps answer stale data and race condition questions.",
        ),
        (
            "Component Communication",
            "Data flow between parent-child and via context.",
            "Needed to coordinate large feature trees.",
            "Parent-child props handle local interactions; context handles shared domain actions/data.",
            "Board -> List -> Card chain plus CardModal callbacks; global actions via useBoard.",
            "Child action calls context function, context updates store, all consumers re-render.",
            "Explain where prop callbacks end and context begins.",
            "Mixing both patterns inconsistently causing hard-to-trace updates.",
            "Clear communication boundaries are key interview signal.",
        ),
    ]

    for block in concept_blocks:
        add_concept_block(story, styles, *block)

    # 8. complete flow
    add_h1(story, "8. Complete Project Flow (File-by-File Execution)", styles)
    add_h2(story, "8.1 Application Startup Flow", styles)
    add_numbered(
        story,
        [
            "src/main.jsx mounts App inside StrictMode.",
            "src/App.jsx wraps routes with AuthProvider then BrowserRouter.",
            "AuthProvider in src/context/AuthContext.jsx runs mount effect.",
            "AuthProvider reads localStorage token and user cache.",
            "If cache exists, buildSessionUser normalizes role and sets user state.",
            "AuthProvider refreshes profile using authService.getUserByUsername.",
            "Routes evaluate RootRoute or LoginRoute based on user/loading.",
            "After authenticated route enters AppLayout, BoardProvider initializes.",
            "BoardProvider runs user-based effect to fetch workspaces and assigned boards.",
            "Sidebar/WorkspacePage select active workspace and trigger fetchBoards.",
            "BoardPage sets activeBoardId from URL and BoardContext fetches lists/cards.",
            "Board, List, and Card components render live state from context selectors.",
        ],
        styles,
    )
    add_h2(story, "8.2 Username/Password Login Flow", styles)
    add_numbered(
        story,
        [
            "User submits AuthPage login form in src/pages/AuthPage/AuthPage.jsx.",
            "handleSubmit calls useAuth().login(username, password).",
            "AuthContext.login calls authService.login to get token and auth user payload.",
            "AuthContext stores token in localStorage.",
            "AuthContext fetches profile via authService.getUserByUsername.",
            "Session user normalized and stored in localStorage user.",
            "ProtectedRoute now sees user and grants access.",
            "Route redirects to /dashboard or /admin based on role.",
        ],
        styles,
    )
    add_h2(story, "8.3 OAuth Login Flow", styles)
    add_numbered(
        story,
        [
            "AuthPage redirects browser to backend OAuth URL.",
            "Backend returns to /oauth-success?token=...",
            "OAuthSuccess in App.jsx extracts token and calls loginWithToken.",
            "AuthContext.loginWithToken decodes token, extracts sub username, fetches profile, persists user.",
            "User is redirected to /dashboard.",
        ],
        styles,
    )
    add_h2(story, "8.4 API Request Flow", styles)
    add_numbered(
        story,
        [
            "Component or page triggers context action (example: addCard from List).",
            "Context action in BoardContext validates permission helpers.",
            "BoardContext calls service function (cardService.createCard).",
            "Service function calls shared axiosInstance with gateway route.",
            "Request interceptor adds Authorization header if token exists.",
            "Backend responds with card payload.",
            "BoardContext normalizes response and updates cards state.",
            "React re-renders List/Card UI with new card data.",
        ],
        styles,
    )
    add_h2(story, "8.5 Token Expiry and Unauthorized Flow", styles)
    add_numbered(
        story,
        [
            "Any API call returning 401 triggers axios response interceptor.",
            "Interceptor removes localStorage token and user cache.",
            "Window location is changed to root route /.",
            "RootRoute sends unauthenticated user to LandingPage.",
        ],
        styles,
    )
    add_h2(story, "8.6 Logout Flow", styles)
    add_numbered(
        story,
        [
            "User clicks Sign Out in Navbar user menu.",
            "logout from AuthContext clears localStorage token and user and sets user state null.",
            "ProtectedRoute sees no user and redirects to /login.",
        ],
        styles,
    )

    # 9. reusable utilities and dependencies
    add_h1(story, "9. Important Reusable Utilities, Patterns, and Dependencies", styles)
    add_h2(story, "9.1 Reusable Components", styles)
    add_bullets(
        story,
        [
            "Avatar and AvatarStack for identity display across dashboard, board members, comments, and settings.",
            "ConfirmModal for destructive action confirmation (delete workspace/board/member).",
            "SkeletonLoader variants for loading placeholders in dashboard/sidebar/members.",
            "AttachmentUpload for comment attachment upload and preview.",
            "ColorWheelPicker for board background and card cover color selection.",
        ],
        styles,
    )
    add_h2(story, "9.2 Permission Utility Layer", styles)
    add_bullets(
        story,
        [
            "File: src/utils/permissions.js centralizes role derivation and capability checks.",
            "Functions include canManageWorkspace, canCreateBoard, canManageBoard, canCollaborateOnBoard, isGuestOnBoard, and canEditComment.",
            "BoardContext and UI components both use same utility to keep behavior consistent.",
        ],
        styles,
    )
    add_h2(story, "9.3 Important Dependencies from package.json", styles)
    add_bullets(
        story,
        [
            "react, react-dom: core UI runtime.",
            "react-router-dom: route tree, navigation, protected routes.",
            "axios: service layer and auth interceptors.",
            "@hello-pangea/dnd: drag-and-drop list/card movement.",
            "framer-motion: landing page animations and reveal effects.",
            "lucide-react: icon consistency across all screens.",
            "vite: development/build toolchain.",
        ],
        styles,
    )

    # 10. quality and improvements
    add_h1(story, "10. Common Beginner Mistakes Found Here and Improvement Ideas", styles)
    add_h2(story, "10.1 Observed Risks From Current Code", styles)
    add_bullets(
        story,
        [
            "src/components/Settings/Settings.jsx uses <Loader> in JSX but Loader is not imported. This is a runtime bug path when password update is loading.",
            "Build output warns main JS chunk is large (around 686 KB before gzip).",
            "Unused artifacts exist: Timeline component, Logo component, WorkspaceSetup page, initialData mocks are currently not routed/used.",
            "Navbar search box is UI-only and not wired to any filtering/search service.",
            "Several API catches are silent and can hide operational failures (especially in CardModal and member fetch paths).",
            "Large BoardContext combines many concerns; future split by domain slice could improve maintainability.",
            "Lint run reports multiple unused vars and hook-related warnings/errors.",
        ],
        styles,
    )
    add_h2(story, "10.2 Practical Improvement Plan", styles)
    add_numbered(
        story,
        [
            "Add route-level code splitting with React.lazy for AdminPage, BoardPage, and LandingPage.",
            "Split BoardContext into focused contexts/hooks (workspace, board, card, membership).",
            "Wire navbar search to board/card search and debounced service endpoint.",
            "Standardize error handling helpers so silent catches become user-safe plus logged.",
            "Introduce React Query or a caching layer for better request dedupe and stale-data handling.",
            "Add unit tests for permission utilities and integration tests for auth/protected flows.",
        ],
        styles,
    )

    # 11. interview explanation scripts
    add_h1(story, "11. How to Explain This Project in Interview", styles)
    add_h2(story, "11.1 Two-Minute Explanation", styles)
    add_para(
        story,
        "I built a React and Vite based task management frontend called FlowBoard. The app is structured around workspaces, boards, lists, and cards. "
        "For state management, I used Context API with two providers: AuthContext for user/session management and BoardContext for domain data and actions. "
        "Authentication is JWT based with localStorage persistence and an axios interceptor that attaches tokens and handles unauthorized responses globally. "
        "Routing uses React Router with protected routes and admin-only route checks. The board experience supports drag-and-drop using @hello-pangea/dnd, "
        "card modals with comments, attachments, labels, and checklists, and role-based permissions through a centralized permissions utility. "
        "Backend integration is modularized through service files for each microservice domain routed via an API gateway URL.",
        styles,
    )
    add_h2(story, "11.2 Five-Minute Explanation", styles)
    add_numbered(
        story,
        [
            "Start with architecture: App routes, AuthProvider, BoardProvider, and shell layout.",
            "Explain authentication lifecycle: login/register/oauth-success, token storage, profile fetch, protected route checks.",
            "Explain domain flow: fetch workspaces -> fetch boards -> fetch lists -> fetch cards -> render board hierarchy.",
            "Explain permission design: centralized utilities control both backend action guards and UI capability rendering.",
            "Explain collaboration features: board members, workspace members, card comments, attachments, checklist and labels.",
            "Explain service layer: each microservice has dedicated file and shared axios instance with interceptors.",
            "Close with improvements: code-splitting, context modularization, better test coverage, and stronger error telemetry.",
        ],
        styles,
    )
    add_h2(story, "11.3 HR Round Version", styles)
    add_para(
        story,
        "I built a collaborative productivity platform frontend where teams can manage work in real time through workspaces and boards. "
        "I focused on user experience, clean component design, secure authentication, and clear separation between UI and backend integration. "
        "I also implemented role-based access so the same product safely supports normal users and platform admins.",
        styles,
    )
    add_h2(story, "11.4 Technical Round Version", styles)
    add_para(
        story,
        "The frontend is React 19 with Vite. Routing uses React Router v7 with nested protected routes and admin guards. "
        "Global state is handled with Context API: AuthContext for session and BoardContext for workspace-board-list-card data/actions. "
        "All network requests go through axios services with a gateway base URL and auth interceptors. IDs from backend payloads are normalized into consistent string IDs. "
        "Permission checks are centralized in utils/permissions and enforced before mutating actions. Drag-and-drop is implemented using hello-pangea/dnd. "
        "The card modal handles comments, labels, checklists, and attachments with dedicated services.",
        styles,
    )

    # 12. top 100 questions
    add_h1(story, "12. Top 100 Interview Questions From This Project", styles)
    question_categories = {
        "Architecture and Folder Design": [
            "Explain the purpose of src/App.jsx in this project.",
            "Why does this project use both AuthProvider and BoardProvider?",
            "What responsibilities belong to pages vs components in this repository?",
            "How is microservice backend complexity hidden from UI files?",
            "Why is permissions logic kept in src/utils/permissions.js?",
            "How would you onboard a new developer using this structure?",
            "What are tradeoffs of a large BoardContext provider?",
            "Which files are best candidates for module split next?",
            "Why are API files separated by domain instead of one client file?",
            "Where does cross-cutting auth logic live and why?",
            "How would you add analytics tracking with minimal coupling?",
            "How does the app shell support consistent navigation UX?",
            "Which components are reusable across many pages and why?",
            "What parts of this project are currently dead code?",
            "How would you document ownership boundaries for future scaling?",
        ],
        "Routing and Navigation": [
            "How does RootRoute decide between landing and authenticated redirects?",
            "How does LoginRoute prevent logged-in users from visiting login page?",
            "What is the purpose of state.from in ProtectedRoute redirect?",
            "How is admin-only navigation enforced?",
            "Why is AppLayout nested inside protected routes?",
            "How does BoardPage sync URL boardId with activeBoardId context state?",
            "What happens if a user manually opens /admin without admin role?",
            "Where would you add a new protected route for reports?",
            "How does fallback route handling work for unknown URLs?",
            "Would you lazy-load route components and why?",
        ],
        "Authentication and Security": [
            "Walk through login flow from AuthPage submit to dashboard render.",
            "How does JWT token get attached to outgoing API calls?",
            "Where is token stored and what are risks of that approach?",
            "How does app restore session after refresh?",
            "How does OAuth success callback work in this project?",
            "Why does AuthContext still fetch profile after decoding token?",
            "How is platform admin role normalized from backend values?",
            "What happens on API 401 response globally?",
            "How does AuthPage block admin login from normal user tab?",
            "How does logout affect route access immediately?",
            "How would you add token refresh support?",
            "How would you reduce XSS risk around localStorage token usage?",
            "How would you support session timeout warning UX?",
            "What backend checks must still exist even with ProtectedRoute?",
            "How would you test auth regression safely?",
        ],
        "State Management and Hooks": [
            "Why choose Context API instead of Redux in this project?",
            "What data belongs in AuthContext vs BoardContext?",
            "Which BoardContext state fields are derived vs source-of-truth?",
            "How are backend IDs normalized and why is that important?",
            "How does fetchWorkspaces set active workspace?",
            "How do lists and cards stay in sync with activeBoardId?",
            "Explain optimistic delete behavior in deleteCard.",
            "Where is useMemo used effectively in this codebase?",
            "Where is useRef used for non-render mutable state?",
            "How do custom hooks useAuth/useBoard improve safety?",
            "How would you avoid stale closures in large context actions?",
            "What are the risks of too many state fields in one provider?",
            "How would you split context while keeping API ergonomics good?",
            "How do loading flags impact user experience in this app?",
            "How would you add offline cache for board data?",
        ],
        "API and Backend Communication": [
            "What is the role of axiosInstance.js in this architecture?",
            "How are auth, workspace, board, list, card services separated?",
            "Explain request path format used with API gateway.",
            "Which component triggers getCardsByAssignee and why?",
            "How are comments and replies loaded in CardModal?",
            "How are file uploads handled for avatars and attachments?",
            "How does BoardContext ensure board access before mutation?",
            "How does reorderBoardLists persist drag-and-drop ordering?",
            "How is card move persisted after local state change?",
            "Where are notification APIs consumed in UI?",
            "How would you centralize API error normalization?",
            "How would you add retry/backoff for flaky endpoints?",
            "How would you instrument API latency per feature?",
            "How would you protect against duplicate submit requests?",
            "How would you migrate this service layer to TypeScript safely?",
        ],
        "UI, Forms, and Events": [
            "How does AuthPage manage multiple modes in one component?",
            "How does Board component restrict UI actions for guests?",
            "How does List component handle inline add/edit interactions?",
            "How does CardMenu avoid clipping inside overflow parents?",
            "How does CardModal manage many feature states without external store?",
            "How are keyboard shortcuts handled for fast add/edit patterns?",
            "How does Sidebar switch active workspace and trigger navigation?",
            "How is form validation handled in settings password flow?",
            "How are empty and loading states represented in dashboard/tasks?",
            "How would you improve accessibility across modal components?",
        ],
        "Performance, Quality, and Testing": [
            "What does the large production chunk warning indicate?",
            "Which routes would you lazy-load first and why?",
            "Where can memoization be removed or improved?",
            "What runtime bug exists in Settings component today?",
            "Which lint findings matter most for reliability?",
            "How would you test drag-and-drop behavior deterministically?",
            "How would you test permission matrix quickly?",
            "How would you prevent over-fetching in MyTasks refresh flow?",
            "How would you monitor re-render hotspots in Board/Card tree?",
            "What CI checks would you enforce before merge?",
        ],
        "Scenario and Viva Questions": [
            "A user can open board URL but sees no cards. How do you debug from route to API?",
            "Assigned board appears without workspace name. Which states/services are involved?",
            "Card deletion disappears then comes back. Explain possible optimistic update rollback path.",
            "Admin route intermittently redirects to dashboard. What auth role checks will you inspect?",
            "Notifications badge count is wrong after read-all. Where will you inspect state mutations?",
            "OAuth login returns token but user stays on processing state. What functions and failure points are involved?",
            "Board drag-and-drop order looks right until refresh. Which persistence call may be failing?",
            "Attachment upload succeeds but preview fails for image. Which fields and components do you inspect?",
            "A member should not edit board but can. Which permission utilities and UI conditions are relevant?",
            "How would you present this architecture to a senior panel in 3 minutes?",
        ],
    }

    all_questions = []
    for category, questions in question_categories.items():
        add_h2(story, category, styles)
        add_numbered(story, questions, styles)
        all_questions.extend(questions)

    add_para(
        story,
        f"Total question count in this section: {len(all_questions)}",
        styles,
    )

    # 13. quick revision
    add_h1(story, "13. Final Revision Sections", styles)
    add_h2(story, "13.1 Quick Revision Sheet", styles)
    add_bullets(
        story,
        [
            "Global auth/session flows are handled in AuthContext plus axios interceptors.",
            "Domain data flow starts in BoardContext and fans out to pages/components.",
            "Permissions are centralized in utils/permissions.js and reused in both context and UI.",
            "Board hierarchy rendering is Board -> List -> Card with CardModal as detail editor.",
            "Microservice API communication is encapsulated in src/api service files.",
        ],
        styles,
    )
    add_h2(story, "13.2 Important Definitions Summary", styles)
    add_bullets(
        story,
        [
            "Workspace: top-level collaboration container.",
            "Board: task canvas inside a workspace.",
            "List: Kanban column inside a board.",
            "Card: task item with status, priority, assignee, dates, labels, checklist.",
            "Platform Admin: special role with global access and admin dashboard route.",
        ],
        styles,
    )
    add_h2(story, "13.3 Important Hooks Summary", styles)
    add_bullets(
        story,
        [
            "useAuth: session and auth operations.",
            "useBoard: workspace-board-list-card state and actions.",
            "useEffect: data loading and synchronization across auth, board, and page lifecycles.",
            "useMemo/useCallback: performance and stable dependency support.",
            "useRef: click-outside handling, timers, and stable mutable references.",
        ],
        styles,
    )
    add_h2(story, "13.4 Important Files Summary", styles)
    add_bullets(
        story,
        [
            "src/App.jsx -> full route map and auth/public entry logic.",
            "src/context/AuthContext.jsx -> login/register/logout/session hydrate logic.",
            "src/context/BoardContext.jsx -> core business state and API actions.",
            "src/api/axiosInstance.js -> token attach and 401 fallback.",
            "src/components/Board/Board.jsx -> board UI, drag-drop, member management entry.",
            "src/components/CardModal/CardModal.jsx -> richest task-detail workflow.",
            "src/utils/permissions.js -> role and capability checks.",
        ],
        styles,
    )
    add_h2(story, "13.5 One-Line Interview Answers", styles)
    one_liners = [
        "State strategy: Context API with AuthContext and BoardContext, no Redux.",
        "Auth strategy: JWT in localStorage with axios request/response interceptors.",
        "Routing strategy: nested protected routes with admin-only guard.",
        "Data strategy: service files per microservice domain through API gateway.",
        "Permission strategy: centralized utility functions reused across UI and actions.",
        "Board UX strategy: drag-drop lists/cards with optimistic updates for responsiveness.",
        "Collaboration strategy: members, comments, attachments, labels, and checklists at card level.",
        "Scalability concern: BoardContext is powerful but large; future split is recommended.",
        "Performance concern: large bundle size suggests route-level lazy loading.",
        "Quality concern: lint findings include one runtime bug and multiple cleanup opportunities.",
    ]
    add_numbered(story, one_liners, styles)

    add_h2(story, "13.6 Most Important Things to Revise Before Interview", styles)
    add_numbered(
        story,
        [
            "Be able to walk login flow end-to-end with exact file names.",
            "Memorize route guard behavior and how admin route differs.",
            "Understand BoardContext fetch chain and normalization helpers.",
            "Know one example each of useMemo, useCallback, and useRef in this codebase.",
            "Know where localStorage is read/written/cleared.",
            "Know service-layer pattern and gateway endpoint prefixes.",
            "Prepare one improvement story: lazy loading + context modularization + tests.",
        ],
        styles,
    )

    doc.multiBuild(story)


if __name__ == "__main__":
    build_pdf()
    print(str(OUTPUT_PDF))
