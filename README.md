# Genzzone Frontend

Next.js frontend for the Genzzone e-commerce platform built with React, TypeScript, Tailwind CSS, and shadcn/ui.

## Features

- **Product Listing**: Browse all available products with category filtering
- **Product Details**: View detailed product information
- **Shopping Cart**: Add, update, and remove items from cart
- **Order Confirmation**: View order details
- **Best Selling Products**: Featured products section
- **Responsive Design**: Mobile-first responsive layout

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Axios** - HTTP client for API requests
- **Lucide React** - Icon library

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-frontend-repo-url>
cd genzzone-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_META_PIXEL_ID=your-meta-pixel-id
```

For production, set this to your Railway backend URL:
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_META_PIXEL_ID=your-meta-pixel-id
```

4. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Project Structure

```
genzzone-frontend/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   ├── products/          # Products pages
│   │   ├── [id]/         # Product detail page
│   │   └── page.tsx      # Products listing
│   ├── cart/             # Shopping cart
│   │   └── page.tsx      # Cart page
│   ├── order/            # Order page
│   └── orders/           # Order confirmation
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── Navbar.tsx        # Navigation
│   ├── Footer.tsx         # Footer
│   ├── Hero.tsx          # Hero section
│   └── ProductCard.tsx   # Product card component
├── contexts/             # React contexts
│   └── CartContext.tsx   # Cart state management
└── lib/                  # Utilities
    ├── api.ts            # API service layer
    └── utils.ts          # Utility functions
```

## API Integration

The storefront uses the **Akkho Storefront API** (`/api/v1/...`) with a **publishable** key (`ak_pk_…`). See [docs/AKKHO_STOREFRONT_API.md](docs/AKKHO_STOREFRONT_API.md).

- **Products**: `GET /api/v1/products/`, `GET /api/v1/products/{slug-or-prd_id}/`
- **Trending**: `GET /api/v1/search/?trending=1`
- **Banners / notifications / categories / shipping / orders** as documented for storefront clients

Cart sync with the server is not part of the storefront API; the in-app cart context remains a stub until you add a client-side cart if needed.

## Deployment to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. In Vercel project settings:
   - Set **Root Directory** to `/` (or leave empty)
   - Add environment variables:
     - `NEXT_PUBLIC_API_URL` = `https://your-akkho-api-origin` (no `/api/v1` suffix)
     - `NEXT_PUBLIC_PAPERBASE_PUBLISHABLE_KEY` = `ak_pk_…`
     - `NEXT_PUBLIC_META_PIXEL_ID` = your Meta Pixel ID
4. Deploy!

Vercel will automatically:
- Detect Next.js framework
- Install dependencies
- Build the project
- Deploy to production

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Akkho API origin (e.g. `https://api.example.com`) | Yes |
| `NEXT_PUBLIC_PAPERBASE_PUBLISHABLE_KEY` | Storefront publishable key `ak_pk_…` | Yes |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel ID for PageView tracking | No (pixel disabled if unset) |

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Building for Production

```bash
npm run build
```

The production build will be in the `.next` directory.

## Configuration

### API URL and storefront key

Configured in `src/lib/api.ts`, `src/lib/api-server.ts`, and `next.config.ts` (image host). Set `NEXT_PUBLIC_API_URL` to your Akkho API origin and `NEXT_PUBLIC_PAPERBASE_PUBLISHABLE_KEY` to the store’s `ak_pk_…` key.

### Image Configuration

Product images are loaded from the backend. The `next.config.ts` file is configured to allow images from your backend domain.
