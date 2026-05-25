import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { useEffect, useState } from "react";
import { CgShoppingCart } from "react-icons/cg";
import { BiMapPin, BiSearch } from "react-icons/bi";
import { useLoginModal } from "../context/LoginModalContext";

const Navbar = () => {
  const { isAuth, city, quauntity, user } = useAppData();
  const { openLoginModal } = useLoginModal();
  const currLocation = useLocation();
  const isHomePage = currLocation.pathname === "/";

  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [scrolled, setScrolled] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) setSearchParams({ search });
      else setSearchParams({});
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setImgError(false);
  }, [user]);

  const handleCartClick = (e: React.MouseEvent) => {
    if (!isAuth) {
      e.preventDefault();
      openLoginModal();
    }
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const showImage = isAuth && user?.image && !imgError;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        transition: "all 0.3s ease",
        background: scrolled ? "rgba(13,13,13,0.92)" : "rgba(13,13,13,0.6)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: scrolled
          ? "1px solid rgba(255,255,255,0.1)"
          : "1px solid transparent",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 20px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "#FF4D1C",
            textDecoration: "none",
            letterSpacing: "-0.5px",
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          zestify
          <span style={{ color: "rgba(255,77,28,0.4)", fontSize: 30 }}>.</span>
        </Link>

        {/* Search — only on home */}
        {isHomePage && (
          <div
            style={{
              flex: 1,
              maxWidth: 520,
              display: "flex",
              alignItems: "center",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              overflow: "hidden",
              transition: "border 0.2s",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 14px",
                borderRight: "1px solid rgba(255,255,255,0.08)",
                height: 42,
                flexShrink: 0,
              }}
            >
              <BiMapPin size={14} color="#FF4D1C" />
              <span
                style={{
                  fontSize: 12,
                  color: "#aaa",
                  maxWidth: 100,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {city || "Locating..."}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flex: 1,
                padding: "0 14px",
              }}
            >
              <BiSearch size={15} color="#555" />
              <input
                type="text"
                placeholder="Search restaurants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#f0f0f0",
                  fontSize: 13,
                  width: "100%",
                  fontFamily: "Inter, sans-serif",
                }}
              />
            </div>
          </div>
        )}

        {/* Right side */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          {/* Become a Partner — only when not logged in */}
          {!isAuth && (
            <Link
              to="/partner"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 14px",
                borderRadius: 10,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#888",
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 500,
                transition: "all 0.2s",
                whiteSpace: "nowrap",
                height: 40,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#f0f0f0";
                (e.currentTarget as HTMLAnchorElement).style.borderColor =
                  "rgba(255,255,255,0.18)";
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#888";
                (e.currentTarget as HTMLAnchorElement).style.borderColor =
                  "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "transparent";
              }}
            >
              Become a Partner ↗
            </Link>
          )}

          {/* Cart */}
          <Link
            to="/cart"
            onClick={handleCartClick}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#f0f0f0",
              textDecoration: "none",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "rgba(255,255,255,0.09)";
              (e.currentTarget as HTMLAnchorElement).style.borderColor =
                "rgba(255,255,255,0.14)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLAnchorElement).style.borderColor =
                "rgba(255,255,255,0.08)";
            }}
          >
            <CgShoppingCart size={18} />
            {isAuth && quauntity > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -5,
                  right: -5,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "#FF4D1C",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #0d0d0d",
                }}
              >
                {quauntity}
              </span>
            )}
          </Link>

          {/* Account / Sign in */}
          {isAuth ? (
            <Link
              to="/account"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 12px 4px 4px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#f0f0f0",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 500,
                transition: "all 0.2s",
                height: 40,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "rgba(255,255,255,0.09)";
                (e.currentTarget as HTMLAnchorElement).style.borderColor =
                  "rgba(255,255,255,0.14)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "rgba(255,255,255,0.05)";
                (e.currentTarget as HTMLAnchorElement).style.borderColor =
                  "rgba(255,255,255,0.08)";
              }}
            >
              {/* Avatar: show profile photo if available, otherwise display initials */}
              {showImage ? (
                <img
                  src={user!.image}
                  alt={user!.name}
                  onError={() => setImgError(true)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "1.5px solid rgba(255,77,28,0.5)",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #FF4D1C, #ff8c6b)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff",
                    flexShrink: 0,
                    letterSpacing: "0.02em",
                  }}
                >
                  {initials}
                </div>
              )}

              {/* First name */}
              <span
                style={{
                  maxWidth: 80,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.name?.split(" ")[0] ?? "Account"}
              </span>
            </Link>
          ) : (
            <button
              onClick={openLoginModal}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 20px",
                borderRadius: 10,
                background: "#FF4D1C",
                color: "#fff",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                transition: "all 0.2s",
                height: 40,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#e63d0e";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#FF4D1C";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(0)";
              }}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
