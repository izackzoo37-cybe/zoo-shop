# Zoo Group Holdings — Shop

A full Amazon-style shopping app: backend API (auth, product catalog, cart,
orders) and a matching frontend UI, branded with your Zoo Group Holdings logo.

## Project structure

```
zoo-shop/
├── backend/
│   ├── server.js            # Express entrypoint
│   ├── db.js                # SQLite schema + seed catalog (node:sqlite, built into Node)
│   ├── middleware/auth.js   # JWT verification
│   ├── utils/jwt.js
│   ├── routes/
│   │   ├── auth.js          # register, login
│   │   ├── products.js      # catalog, search, categories
│   │   ├── cart.js          # view/add/update/remove
│   │   └── orders.js        # checkout, order history
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── index.html
    ├── style.css
    ├── app.js                # hash-router SPA — all views live here
    └── images/
        ├── logo-icon.png     # cropped, transparent — used in header/footer
        └── logo-full.png     # full stacked lockup — free for a splash/about page
```

## Running it

```bash
cd backend
npm install
cp .env.example .env      # then set a real JWT_SECRET
npm start
```

Open `http://localhost:4000` — the backend serves the frontend too.

First run seeds 16 sample products across 6 categories (Electronics, Home &
Kitchen, Fashion, Beauty, Sports & Outdoors, Books) automatically — see the
bottom of `db.js` if you want to change or add to the catalog.

## How it's put together

- **Auth**: register/login issue a JWT (30-day expiry), stored in
  `localStorage` on the frontend and sent as `Authorization: Bearer <token>`.
- **Cart & orders are per-account** — browsing the catalog is public, but you
  need to be signed in to add to cart or check out (standard e-commerce
  pattern, and it's what lets order history work).
- **Checkout** creates an `orders` + `order_items` snapshot from the current
  cart, decrements `stock`, and empties the cart — all in one request.
- **Frontend routing** is a small hash-based router in `app.js` (`#/`,
  `#/product/:id`, `#/cart`, `#/checkout`, `#/orders`, `#/account`) — no
  build step, no framework, just fetch + template strings.
- **Product "photos"** default to CSS gradients (using each product's
  `color_a`/`color_b` from the database) with a simple line-icon on top. When
  a real photo is uploaded for a product (via the admin "Add product" form,
  or by clicking a thumbnail in the catalog list), it's stored in
  `backend/uploads/` and its URL is saved as `image_url` on the product row —
  the cards, detail page, and cart all check for `image_url` first and only
  fall back to the color/icon block when it's not set.
- **Order notifications** — customers get an in-app notification (bell icon
  in the header, with an unread badge) when they place an order, and again
  whenever an admin changes that order's status (`processing`, `shipped`,
  `delivered`, `cancelled`). Notifications live in a `notifications` table
  and are only inserted when the status actually changes, so re-saving the
  same status doesn't spam the customer. Clicking a notification marks it
  read and takes you to Order History; "Mark all read" clears the badge.
  The frontend also polls every 45s while signed in so the badge stays
  current without a refresh.
- **Chatbot ("Zoo Assistant")** — a chat bubble in the bottom-right corner on
  every page (`POST /api/chat`). It always works out of the box: without any
  configuration it's a rule-based assistant that reads real data straight
  from the database — it can list a signed-in customer's recent orders, look
  up a specific order number, search the product catalog, and answer
  shipping/returns questions, all grounded in what's actually in `products`
  and `orders` (it never invents an order status or a price). If you set
  `ANTHROPIC_API_KEY` in `backend/.env`, it upgrades to Claude-generated
  replies instead — still restricted by a system prompt to only use the same
  order/product context, so it can hold a more natural conversation without
  making things up. Guests can ask about products and policies; asking about
  "my order" while signed out gets a prompt to sign in rather than a guess.
- **Responsive nav** — above 640px wide, navigation is the usual top header
  (logo, search, admin/notifications/account/cart icons) plus the category
  pill bar. At 640px and under (phones), the icon row moves to a fixed bottom
  tab bar (Home / Alerts / Cart / Account, plus Admin for admin accounts)
  instead — the top bar keeps just the logo and search. Both navs share the
  same state (cart count, unread badge, active tab), so nothing needs to be
  kept in sync by hand.

## Admin dashboard — monitor shopping & manage the catalog

There's now an internal admin area for staff accounts:

- **Overview** — total revenue, order count, customer count, orders placed
  today, and a low-stock warning list (10 units or fewer).
- **Orders** — every customer's order, live, with customer name/email, items,
  delivery address, and a status dropdown (`placed → processing → shipped →
  delivered`, or `cancelled`) you can change on the spot. This is the
  "monitor customers shopping" view. Each order also has:
  - **"View / print invoice"** — a real link to `#/admin/invoice/:id`, a
    standalone in-app invoice page (with the Zoo Group Holdings logo on the
    letterhead) that you can print straight from the browser.
  - **"Download invoice"** — generates a real PDF (via
    [jsPDF](https://github.com/parallax/jsPDF), loaded from a CDN on first
    use, logo included) and saves it straight to disk as
    `invoice-order-<id>.pdf`. No server-side PDF generation involved.
- **Products** — add a brand-new product to the store (name, category,
  description, price, stock, an icon and color theme for its card, and an
  optional photo upload that overrides the color block), plus a full catalog
  list where you can update stock, swap a product's photo by clicking its
  thumbnail, or remove/restore any product. "Remove" is a soft delete — it
  hides the product from the storefront and blocks it from being added to
  carts, but keeps it (and any past orders that reference it) intact in the
  database.
- **Customers** — every customer account with their order count and total
  spend, sorted highest-spending first.

### Getting into the admin dashboard

The first time the server starts, it seeds one admin account automatically
and prints the credentials to the console:

```
email:    admin@zoogroupholdings.co.ke
password: ZooAdmin123!
```

Override these before first run by setting `SEED_ADMIN_EMAIL` and
`SEED_ADMIN_PASSWORD` in `.env`. **Change the password after your first login**
— there's no in-app "change password" flow yet, so for now that means updating
the `password_hash` directly in the database, or deleting `zoo_shop.db` and
reseeding with a new `SEED_ADMIN_PASSWORD`.

Sign in with that account on the normal `#/account` page — because it's
flagged `is_admin` in the database, an **Admin** link automatically appears in
the header, and `#/admin` becomes accessible. Regular customer accounts
(anyone who registers through the storefront) never get this flag and can't
reach `/api/admin/*` even if they guess the URL — the backend checks
`isAdmin` on every request, not just the frontend link visibility.

### New/changed API routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/overview` | Dashboard stats + recent orders + low stock |
| GET | `/api/admin/orders?status=` | All customers' orders, optionally filtered by status |
| GET | `/api/admin/orders/:id` | Single order with items — powers the invoice page |
| PATCH | `/api/admin/orders/:id` | `{ status }` — update an order's status |
| GET | `/api/admin/products` | Full catalog, including removed/inactive products |
| POST | `/api/admin/products/upload` | Multipart image upload (`image` field) → `{ url }` for use as `image_url` |
| POST | `/api/admin/products` | Add a new product |
| PATCH | `/api/admin/products/:id` | Update any product field (price, stock, active, etc.) |
| DELETE | `/api/admin/products/:id` | Soft-delete (sets `active = 0`) |
| GET | `/api/admin/customers` | Every customer with order count + total spent |

All `/api/admin/*` routes require a valid token **and** `isAdmin: true` in it
— every route in `routes/admin.js` is chained through both `requireAuth` and
a new `requireAdmin` middleware.

Two small related changes to the existing storefront routes: `GET /api/products`
now only returns `active = 1` products (so removed items disappear from the
storefront immediately), and adding an inactive product to a cart is now
explicitly rejected.


## API reference

### Storefront (customer-facing)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | – | `{ name, email, password }` → `{ token, user }` |
| POST | `/api/auth/login` | – | `{ email, password }` → `{ token, user }` |
| GET | `/api/products?q=&category=&sort=` | – | Search/filter/sort catalog. `sort`: `relevance`\|`price_asc`\|`price_desc`\|`rating` |
| GET | `/api/products/categories` | – | List of distinct categories |
| GET | `/api/products/:id` | – | Single product |
| GET | `/api/cart` | ✓ | Current cart + subtotal |
| POST | `/api/cart` | ✓ | `{ productId, quantity }` — add/increment |
| PATCH | `/api/cart/:productId` | ✓ | `{ quantity }` — set exact qty, `0` removes |
| DELETE | `/api/cart/:productId` | ✓ | Remove item |
| POST | `/api/orders` | ✓ | `{ address }` — checkout current cart |
| GET | `/api/orders` | ✓ | Order history |
| GET | `/api/orders/:id` | ✓ | Single order |
| GET | `/api/notifications` | ✓ | `{ notifications, unreadCount }` for the signed-in customer |
| PATCH | `/api/notifications/:id/read` | ✓ | Mark one notification read |
| PATCH | `/api/notifications/read-all` | ✓ | Mark all of the customer's notifications read |
| POST | `/api/chat` | optional | `{ message, history }` → `{ reply, quickReplies?, source }`. Auth is optional — signed-in requests get order-aware answers, guests get product/policy help only. `source` is `"ai"` when `ANTHROPIC_API_KEY` is set and answered the request, otherwise `"assistant"` (rule-based). |

## What I verified without a live server

This sandbox has no network access, so I couldn't `npm install` or boot a live
server here. Instead I tested everything that doesn't need network:

- All SQL/business logic directly against `node:sqlite` — catalog seeding,
  search, category filtering, sort order, cart accumulation (repeat-add
  increments quantity correctly), subtotal math, full checkout (order +
  order_items created, cart emptied, stock decremented) — all produced
  correct results.
- The admin flow specifically: admin account seeding, revenue/order/customer
  aggregation queries, adding a product and confirming it appears in the
  public catalog query, removing it (soft delete) and confirming it both
  disappears from the public query *and* gets rejected if added to a cart
  while still existing in the admin's full product list, and customer
  spend aggregation across multiple orders — all produced correct results.
- Every backend and frontend file passes `node --check` (valid modern JS).
- The logo crop: verified programmatically that both exported PNGs contain
  real, non-blank artwork with the expected teal/coral brand colors and
  transparent backgrounds.
- The layout/palette: rendered the real CSS against sample markup and
  confirmed (by sampling actual pixel colors) that the header, hero gradient,
  product card colors per category, and logo all appear exactly where
  intended.

Worth doing on your end before this is "real":

- `npm install` and run it locally to click through the actual flows —
  the automated checks above cover correctness, not feel.
- Swap the 16 seed products for your real catalog (and real photos, once
  you have them, in place of the color-block placeholders).
- Change `JWT_SECRET` in `.env` to something random before this goes anywhere
  near production.
- Everything is priced in KES as whole shillings, matching how you've had
  other parts of this built — adjust `db.js` if you need a different currency.
# zoo-shop
