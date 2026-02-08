import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Admin-Token", "X-Access-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Create Supabase client for admin operations
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Create Supabase storage bucket on startup
const bucketName = 'make-58aa32b3-books';
try {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
  if (!bucketExists) {
    await supabaseAdmin.storage.createBucket(bucketName, { public: false });
    console.log(`Created storage bucket: ${bucketName}`);
  }
} catch (error) {
  console.error('Error creating storage bucket:', error);
}

// Health check endpoint
app.get("/make-server-58aa32b3/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== AUTH ENDPOINTS ====================

// Sign up endpoint
app.post("/make-server-58aa32b3/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { firstName, lastName, dateOfBirth, country, city, aboutMe, password } = body;

    // Generate unique login
    const login = `${firstName.toLowerCase()}_${Date.now()}`;

    // Create user in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: `${login}@booksite.local`,
      password: password,
      user_metadata: {
        login,
        firstName,
        lastName,
        dateOfBirth,
        country,
        city,
        aboutMe,
      },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    console.log('User created in Supabase Auth:', data.user.id);

    // Store user profile in KV store
    const userProfile = {
      id: data.user.id,
      login,
      firstName,
      lastName,
      dateOfBirth,
      country,
      city,
      aboutMe,
      favorites: [],
      recent: [],
    };
    
    await kv.set(`user:${data.user.id}`, userProfile);
    console.log('User profile saved to KV store:', userProfile);

    return c.json({ 
      success: true, 
      login, 
      password, // Return the original password so user can sign in
      message: 'User created successfully' 
    });
  } catch (error) {
    console.error('Error in signup:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Sign in endpoint
app.post("/make-server-58aa32b3/auth/signin", async (c) => {
  try {
    const body = await c.req.json();
    const { login, password } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Sign in with email format
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${login}@booksite.local`,
      password: password,
    });

    if (error) {
      console.error('Sign in error:', error);
      return c.json({ error: 'Invalid login or password' }, 401);
    }

    return c.json({ 
      success: true, 
      accessToken: data.session.access_token,
      user: data.user
    });
  } catch (error) {
    console.error('Error in signin:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get current user profile
app.get("/make-server-58aa32b3/auth/me", async (c) => {
  try {
    const accessToken = c.req.header('X-Access-Token');
    if (!accessToken) {
      console.error('No access token provided');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !user) {
      console.error('Error validating user token:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('Getting profile for user:', user.id);
    const profile = await kv.get(`user:${user.id}`);
    
    if (!profile) {
      console.error('Profile not found for user:', user.id);
      return c.json({ error: 'User profile not found' }, 404);
    }
    
    console.log('Profile found:', profile);
    return c.json({ user: profile });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== ADMIN ENDPOINTS ====================

// Admin login
app.post("/make-server-58aa32b3/admin/login", async (c) => {
  try {
    const body = await c.req.json();
    const { password } = body;

    if (password === '7777') {
      // Generate a simple admin token
      const adminToken = 'admin_' + Date.now();
      await kv.set(`admin_token:${adminToken}`, { valid: true, createdAt: Date.now() });
      return c.json({ success: true, token: adminToken });
    }

    return c.json({ error: 'Invalid password' }, 401);
  } catch (error) {
    console.error('Error in admin login:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Verify admin token middleware
const verifyAdmin = async (token: string) => {
  if (!token) return false;
  const adminData = await kv.get(`admin_token:${token}`);
  return adminData?.valid === true;
};

// Get all users (admin only)
app.get("/make-server-58aa32b3/admin/users", async (c) => {
  try {
    const token = c.req.header('X-Admin-Token');
    if (!await verifyAdmin(token ?? '')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const users = await kv.getByPrefix('user:');
    return c.json({ users });
  } catch (error) {
    console.error('Error getting users:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Add book (admin only)
app.post("/make-server-58aa32b3/admin/books", async (c) => {
  try {
    const token = c.req.header('X-Admin-Token');
    if (!await verifyAdmin(token ?? '')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { title, author, description, summary, category, pdfBase64, coverImageBase64 } = body;

    const bookId = `book_${Date.now()}`;
    
    // Upload PDF to Supabase Storage if provided
    let pdfUrl = null;
    if (pdfBase64) {
      // Convert base64 to bytes
      const base64Data = pdfBase64.split(',')[1] || pdfBase64;
      const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const fileName = `${bookId}.pdf`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(fileName, bytes, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading PDF:', uploadError);
        return c.json({ error: 'Failed to upload PDF' }, 500);
      }

      // Get signed URL
      const { data: signedData } = await supabaseAdmin.storage
        .from(bucketName)
        .createSignedUrl(fileName, 31536000); // 1 year expiry

      pdfUrl = signedData?.signedUrl;
    }

    // Upload cover image to Supabase Storage if provided
    let coverImageUrl = null;
    if (coverImageBase64) {
      // Convert base64 to bytes
      const base64Data = coverImageBase64.split(',')[1] || coverImageBase64;
      const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      // Determine image extension from base64 prefix
      const mimeMatch = coverImageBase64.match(/data:image\/(\w+);/);
      const ext = mimeMatch ? mimeMatch[1] : 'jpg';
      const contentType = `image/${ext}`;
      
      const fileName = `${bookId}_cover.${ext}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(fileName, bytes, {
          contentType,
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading cover image:', uploadError);
        return c.json({ error: 'Failed to upload cover image' }, 500);
      }

      // Get signed URL
      const { data: signedData } = await supabaseAdmin.storage
        .from(bucketName)
        .createSignedUrl(fileName, 31536000); // 1 year expiry

      coverImageUrl = signedData?.signedUrl;
    }

    const book = {
      id: bookId,
      title,
      author,
      description,
      summary,
      category,
      pdfUrl,
      coverImageUrl,
      createdAt: Date.now(),
    };

    await kv.set(`book:${bookId}`, book);

    return c.json({ success: true, book });
  } catch (error) {
    console.error('Error adding book:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete book (admin only)
app.delete("/make-server-58aa32b3/admin/books/:id", async (c) => {
  try {
    const token = c.req.header('X-Admin-Token');
    if (!await verifyAdmin(token ?? '')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const bookId = c.req.param('id');
    
    // Get book to find PDF
    const book = await kv.get(`book:${bookId}`);
    
    // Delete PDF from storage if exists
    if (book?.pdfUrl) {
      await supabaseAdmin.storage
        .from(bucketName)
        .remove([`${bookId}.pdf`]);
    }

    // Delete book from KV
    await kv.del(`book:${bookId}`);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting book:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== BOOKS ENDPOINTS ====================

// Get all books
app.get("/make-server-58aa32b3/books", async (c) => {
  try {
    const books = await kv.getByPrefix('book:');
    return c.json({ books });
  } catch (error) {
    console.error('Error getting books:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get single book
app.get("/make-server-58aa32b3/books/:id", async (c) => {
  try {
    const bookId = c.req.param('id');
    const book = await kv.get(`book:${bookId}`);
    
    if (!book) {
      return c.json({ error: 'Book not found' }, 404);
    }

    return c.json({ book });
  } catch (error) {
    console.error('Error getting book:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== USER ACTIONS ====================

// Add to favorites
app.post("/make-server-58aa32b3/user/favorites", async (c) => {
  try {
    const accessToken = c.req.header('X-Access-Token');
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { bookId } = body;

    const profile = await kv.get(`user:${user.id}`);
    if (!profile) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    const favorites = profile.favorites || [];
    if (!favorites.includes(bookId)) {
      favorites.push(bookId);
      profile.favorites = favorites;
      await kv.set(`user:${user.id}`, profile);
    }

    return c.json({ success: true, favorites });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Remove from favorites
app.delete("/make-server-58aa32b3/user/favorites/:bookId", async (c) => {
  try {
    const accessToken = c.req.header('X-Access-Token');
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const bookId = c.req.param('bookId');

    const profile = await kv.get(`user:${user.id}`);
    if (!profile) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    const favorites = (profile.favorites || []).filter((id: string) => id !== bookId);
    profile.favorites = favorites;
    await kv.set(`user:${user.id}`, profile);

    return c.json({ success: true, favorites });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Add to recent
app.post("/make-server-58aa32b3/user/recent", async (c) => {
  try {
    const accessToken = c.req.header('X-Access-Token');
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { bookId } = body;

    const profile = await kv.get(`user:${user.id}`);
    if (!profile) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    let recent = profile.recent || [];
    // Remove if already exists
    recent = recent.filter((id: string) => id !== bookId);
    // Add to beginning
    recent.unshift(bookId);
    // Keep only last 20
    recent = recent.slice(0, 20);
    
    profile.recent = recent;
    await kv.set(`user:${user.id}`, profile);

    return c.json({ success: true, recent });
  } catch (error) {
    console.error('Error adding to recent:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

Deno.serve(app.fetch);