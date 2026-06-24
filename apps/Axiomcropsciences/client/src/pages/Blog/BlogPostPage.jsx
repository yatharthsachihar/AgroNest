import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiCalendar, FiUser, FiClock, FiTag, FiArrowLeft, FiArrowRight, FiShare2 } from "react-icons/fi";
import toast from "react-hot-toast";
import Navbar from "../../components/navigation/Navbar";
import Footer from "../../components/navigation/Footer";
import { blogApi } from "../../api/blogApi";
import { mediaUrl } from "../../api/axios";
import "../../styles/site.css";
import "./BlogPostPage.css";

export default function BlogPostPage() {
  const { slug }    = useParams();
  const navigate    = useNavigate();

  useEffect(() => {
    const root = document.getElementById("root");
    if (root) root.style.cssText = "width:100%;max-width:100%;border:none;margin:0;text-align:left;";
    window.scrollTo(0, 0);
  }, [slug]);

  // Fetch the specific post by slug
  const { data: post, isLoading, isError } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: () => blogApi.getOne(`slug/${slug}`).then(r => r.data).catch(async () => {
      // Fallback: try searching by slug in getAll
      const all = await blogApi.getAll({ status: "published" }).then(r => r.data);
      return all.find(p => p.slug === slug) || null;
    }),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch all posts for related articles sidebar
  const { data: allPosts = [] } = useQuery({
    queryKey: ["blog-public"],
    queryFn: () => blogApi.getAll({ status: "published" }).then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const related = allPosts
    .filter(p => p.slug !== slug && p.category === post?.category)
    .slice(0, 3);

  const date = post?.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "";

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: post?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (isLoading) return (
    <div className="site-root">
      <Navbar />
      <div className="blog-post-loading">
        <div className="blog-post-skeleton-hero" />
        <div className="site-container">
          <div className="blog-post-skeleton-body">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="blog-post-skeleton-line" style={{ width: `${70 + Math.random() * 30}%` }} />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );

  if (isError || !post) return (
    <div className="site-root">
      <Navbar />
      <div className="blog-post-not-found">
        <div style={{ fontSize: 64 }}>📭</div>
        <h2>Article Not Found</h2>
        <p>This post may have been removed or the URL is incorrect.</p>
        <Link to="/blog" className="site-btn-primary">← Back to Blog</Link>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="site-root">
      <Navbar />

      {/* ── Hero with featured image ── */}
      <div className="blog-post-hero" style={post.featuredImage ? { backgroundImage: `url(${mediaUrl(post.featuredImage)})` } : {}}>
        <div className="blog-post-hero-overlay" />
        <div className="site-container">
          <div className="blog-post-hero-inner">
            {/* Breadcrumb */}
            <div className="blog-post-breadcrumb">
              <Link to="/">Home</Link>
              <span>›</span>
              <Link to="/blog">Blog</Link>
              <span>›</span>
              <span>{post.category}</span>
            </div>

            {post.category && <span className="blog-post-cat">{post.category}</span>}

            <h1 className="blog-post-title">{post.title}</h1>

            <div className="blog-post-meta">
              {post.author    && <span><FiUser size={13} /> {post.author}</span>}
              {date           && <span><FiCalendar size={13} /> {date}</span>}
              {post.readTime  && <span><FiClock size={13} /> {post.readTime} read</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="blog-post-body-wrap">
        <div className="site-container">
          <div className="blog-post-layout">

            {/* Main article */}
            <article className="blog-post-article">

              {/* If the post has HTML content use it; else show excerpt as placeholder */}
              {post.content ? (
                <div
                  className="blog-post-content"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              ) : (
                <div className="blog-post-content">
                  <p className="blog-post-excerpt-big">{post.excerpt}</p>
                  <div className="blog-post-no-content">
                    <div style={{ fontSize: 36 }}>✍️</div>
                    <p>Full article content will appear here once published in the admin panel.</p>
                    <Link to="/admin/blogs" className="site-btn-secondary" style={{ fontSize: 13, padding: "10px 20px" }}>
                      Add Content in Admin →
                    </Link>
                  </div>
                </div>
              )}

              {/* Tags */}
              {post.tags?.length > 0 && (
                <div className="blog-post-tags">
                  <FiTag size={14} />
                  {post.tags.map(tag => (
                    <Link key={tag} to={`/blog?search=${tag}`} className="blog-post-tag">{tag}</Link>
                  ))}
                </div>
              )}

              {/* Share + Back */}
              <div className="blog-post-actions">
                <Link to="/blog" className="blog-post-back">
                  <FiArrowLeft size={15} /> Back to Blog
                </Link>
                <button className="blog-post-share" onClick={handleShare}>
                  <FiShare2 size={14} /> Share
                </button>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="blog-post-sidebar">

              {/* About the author */}
              <div className="blog-sidebar-card">
                <div className="blog-sidebar-head">About the Author</div>
                <div className="blog-author-wrap">
                  <div className="blog-author-avatar">
                    {post.author?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div>
                    <div className="blog-author-name">{post.author || "Admin"}</div>
                    <div className="blog-author-role">Axiom Seeds Team</div>
                  </div>
                </div>
              </div>

              {/* Related articles */}
              {related.length > 0 && (
                <div className="blog-sidebar-card">
                  <div className="blog-sidebar-head">Related Articles</div>
                  <div className="blog-related-list">
                    {related.map(r => (
                      <Link key={r._id} to={`/blog/${r.slug}`} className="blog-related-item">
                        {r.featuredImage && (
                          <img src={mediaUrl(r.featuredImage)} alt={r.title} className="blog-related-img" />
                        )}
                        <div className="blog-related-title">{r.title}</div>
                        <FiArrowRight size={13} style={{ flexShrink: 0, color: "var(--site-primary)" }} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="blog-sidebar-cta">
                <div style={{ fontSize: 28, marginBottom: 10 }}>🌾</div>
                <div className="blog-sidebar-cta-title">Ready to grow smarter?</div>
                <p>Explore our full range of certified seeds, fertilizers, and tools.</p>
                <Link to="/products" className="site-btn-primary" style={{ fontSize: 14, padding: "12px 24px", marginTop: 8 }}>
                  Shop Now <FiArrowRight size={14} />
                </Link>
              </div>

            </aside>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
