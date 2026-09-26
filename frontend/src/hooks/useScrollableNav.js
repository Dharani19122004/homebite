import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// On phones the dashboard menu is a horizontal strip. This keeps the active
// link in view when the page changes, and sets `data-more` on the strip while
// more links are hidden off the right edge (CSS uses it to draw a fade).
export function useScrollableNav(ref) {
  const { pathname } = useLocation();

  useEffect(() => {
    const nav = ref.current;

    if (!nav) return undefined;

    const update = () => {
      const hiddenRight = nav.scrollWidth - nav.clientWidth - nav.scrollLeft;
      nav.toggleAttribute("data-more", hiddenRight > 4);
    };

    const active = nav.querySelector('[aria-current="page"]');

    if (active && nav.scrollWidth > nav.clientWidth) {
      const navBox = nav.getBoundingClientRect();
      const linkBox = active.getBoundingClientRect();
      const target =
        nav.scrollLeft +
        (linkBox.left - navBox.left) -
        (nav.clientWidth - linkBox.width) / 2;

      nav.scrollLeft = Math.max(0, target);
    }

    update();
    nav.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      nav.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ref, pathname]);
}
