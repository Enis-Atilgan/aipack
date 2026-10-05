-- ============================================
-- AIPack Marketplace - Supabase Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ──────────────────────────────────
-- Extends Supabase auth.users with profile data
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  github_username TEXT,
  bio TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── PACKS ──────────────────────────────────
CREATE TABLE public.packs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,                    -- slug: "senior-go-backend"
  display_name TEXT NOT NULL,                   -- "Senior Go Backend"
  description TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'coding', 'writing', 'business', 'legal', 'education',
    'marketing', 'data', 'design', 'productivity', 'lifestyle',
    'finance', 'support', 'research', 'other'
  )),
  tags TEXT[] DEFAULT '{}',
  language TEXT DEFAULT 'en',
  level TEXT NOT NULL CHECK (level IN ('simple', 'enhanced', 'system')),
  license TEXT DEFAULT 'MIT',
  repository TEXT,                              -- GitHub repo URL
  icon_url TEXT,
  
  -- Stats (denormalized for performance)
  download_count INTEGER DEFAULT 0 NOT NULL,
  rating_avg NUMERIC(3,2) DEFAULT 0 NOT NULL,
  rating_count INTEGER DEFAULT 0 NOT NULL,
  
  -- Latest version info (denormalized)
  latest_version TEXT NOT NULL,
  
  -- Status
  is_published BOOLEAN DEFAULT true NOT NULL,
  is_featured BOOLEAN DEFAULT false NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── PACK VERSIONS ─────────────────────────
CREATE TABLE public.pack_versions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pack_id UUID REFERENCES public.packs(id) ON DELETE CASCADE NOT NULL,
  version TEXT NOT NULL,                        -- semver: "1.0.0"
  manifest JSONB NOT NULL,                      -- Full manifest.json content
  readme TEXT,                                  -- README.md content
  file_url TEXT,                                -- .aipack file download URL
  file_size_bytes BIGINT DEFAULT 0,
  changelog TEXT,                               -- What changed in this version
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(pack_id, version)
);

-- ─── DOWNLOADS ──────────────────────────────
CREATE TABLE public.downloads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pack_id UUID REFERENCES public.packs(id) ON DELETE CASCADE NOT NULL,
  version_id UUID REFERENCES public.pack_versions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_platform TEXT CHECK (target_platform IN ('cursor', 'claude', 'chatgpt', 'raw')),
  ip_hash TEXT,                                 -- Hashed IP for dedup, not raw IP
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── RATINGS ────────────────────────────────
CREATE TABLE public.ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pack_id UUID REFERENCES public.packs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(pack_id, user_id)                     -- One rating per user per pack
);

-- ─── INDEXES ────────────────────────────────
CREATE INDEX idx_packs_category ON public.packs(category);
CREATE INDEX idx_packs_level ON public.packs(level);
CREATE INDEX idx_packs_author ON public.packs(author_id);
CREATE INDEX idx_packs_downloads ON public.packs(download_count DESC);
CREATE INDEX idx_packs_rating ON public.packs(rating_avg DESC);
CREATE INDEX idx_packs_featured ON public.packs(is_featured) WHERE is_featured = true;
CREATE INDEX idx_packs_tags ON public.packs USING GIN(tags);
CREATE INDEX idx_packs_search ON public.packs USING GIN(
  to_tsvector('english', name || ' ' || display_name || ' ' || description)
);
CREATE INDEX idx_pack_versions_pack ON public.pack_versions(pack_id);
CREATE INDEX idx_downloads_pack ON public.downloads(pack_id);
CREATE INDEX idx_ratings_pack ON public.ratings(pack_id);

-- ─── ROW LEVEL SECURITY ────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, owner can update
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Packs: anyone can read published, author can CRUD
CREATE POLICY "Published packs are viewable by everyone" ON public.packs
  FOR SELECT USING (is_published = true);
CREATE POLICY "Authors can insert packs" ON public.packs
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own packs" ON public.packs
  FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own packs" ON public.packs
  FOR DELETE USING (auth.uid() = author_id);

-- Pack versions: anyone can read, author can insert
CREATE POLICY "Pack versions are viewable by everyone" ON public.pack_versions
  FOR SELECT USING (true);
CREATE POLICY "Authors can insert versions" ON public.pack_versions
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT author_id FROM public.packs WHERE id = pack_id)
  );

-- Downloads: anyone can insert (track downloads), no read for others
CREATE POLICY "Anyone can record downloads" ON public.downloads
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own downloads" ON public.downloads
  FOR SELECT USING (auth.uid() = user_id);

-- Ratings: anyone can read, authenticated users can CRUD own
CREATE POLICY "Ratings are viewable by everyone" ON public.ratings
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can rate" ON public.ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON public.ratings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ratings" ON public.ratings
  FOR DELETE USING (auth.uid() = user_id);

-- ─── FUNCTIONS ──────────────────────────────

-- Auto-update download count on new download
CREATE OR REPLACE FUNCTION public.increment_download_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.packs
  SET download_count = download_count + 1,
      updated_at = NOW()
  WHERE id = NEW.pack_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_download_insert
  AFTER INSERT ON public.downloads
  FOR EACH ROW EXECUTE FUNCTION public.increment_download_count();

-- Auto-update rating stats on rating change
CREATE OR REPLACE FUNCTION public.update_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.packs
  SET rating_avg = (
        SELECT COALESCE(AVG(score), 0) FROM public.ratings WHERE pack_id = COALESCE(NEW.pack_id, OLD.pack_id)
      ),
      rating_count = (
        SELECT COUNT(*) FROM public.ratings WHERE pack_id = COALESCE(NEW.pack_id, OLD.pack_id)
      ),
      updated_at = NOW()
  WHERE id = COALESCE(NEW.pack_id, OLD.pack_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_rating_change
  AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_rating_stats();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_packs_update
  BEFORE UPDATE ON public.packs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_ratings_update
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── AUTO-CREATE PROFILE ON SIGNUP ─────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url, github_username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'preferred_username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'user_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
