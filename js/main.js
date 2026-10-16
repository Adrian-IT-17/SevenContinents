document.documentElement.classList.add("js");

const siteHeader = document.querySelector("[data-site-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const navigation = document.querySelector("[data-navigation]");
let headerIsScrolled = false;

const setHeaderState = () => {
  const nextHeaderState = window.scrollY > 12;
  if (!siteHeader || nextHeaderState === headerIsScrolled) return;

  headerIsScrolled = nextHeaderState;
  siteHeader.classList.toggle("is-scrolled", headerIsScrolled);
};

const closeNavigation = () => {
  if (!menuToggle || !navigation) return;

  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  navigation.classList.remove("is-open");
  document.body.classList.remove("menu-open");
};

const toggleNavigation = () => {
  if (!menuToggle || !navigation) return;

  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  if (isOpen) {
    closeNavigation();
    return;
  }

  menuToggle.setAttribute("aria-expanded", "true");
  menuToggle.setAttribute("aria-label", "Close navigation menu");
  navigation.classList.add("is-open");
  document.body.classList.add("menu-open");
  requestAnimationFrame(() => navigation.querySelector("a")?.focus());
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });
menuToggle?.addEventListener("click", toggleNavigation);

navigation?.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeNavigation();
});

document.addEventListener("keydown", (event) => {
  const isNavigationOpen = menuToggle?.getAttribute("aria-expanded") === "true";
  if (!isNavigationOpen) return;

  if (event.key === "Escape") {
    closeNavigation();
    menuToggle.focus();
    return;
  }

  if (event.key !== "Tab" || window.innerWidth >= 1024) return;

  const focusableElements = [menuToggle, ...navigation.querySelectorAll("a")];
  const firstElement = focusableElements[0];
  const lastElement = focusableElements.at(-1);

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 1024) closeNavigation();
});

const revealElements = document.querySelectorAll(".reveal");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -48px",
    },
  );

  revealElements.forEach((element) => revealObserver.observe(element));
}

const filterButtons = [...document.querySelectorAll("[data-filter]")];
const galleryItems = [...document.querySelectorAll("[data-gallery-item]")];
const galleryStatus = document.querySelector("[data-gallery-status]");
const lightbox = document.querySelector("[data-lightbox]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxCaption = document.querySelector("[data-lightbox-caption]");
const lightboxClose = document.querySelector("[data-lightbox-close]");
const lightboxPrevious = document.querySelector("[data-lightbox-previous]");
const lightboxNext = document.querySelector("[data-lightbox-next]");

let visibleGalleryItems = galleryItems;
let currentLightboxIndex = 0;
let lastLightboxTrigger = null;

const setLightboxContent = (index) => {
  if (!lightboxImage || !lightboxCaption || visibleGalleryItems.length === 0) return;

  currentLightboxIndex = (index + visibleGalleryItems.length) % visibleGalleryItems.length;
  const item = visibleGalleryItems[currentLightboxIndex];
  const image = item.querySelector("img");
  const caption = item.dataset.caption || image.alt;

  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = caption;
};

const closeLightbox = () => {
  if (!lightbox?.open) return;

  lightbox.close();
};

const openLightbox = (item) => {
  if (!lightbox) return;

  lastLightboxTrigger = item;
  setLightboxContent(visibleGalleryItems.indexOf(item));
  lightbox.showModal();
  document.body.classList.add("lightbox-open");
  lightboxClose?.focus();
};

const applyGalleryFilter = (filter, updateUrl = true) => {
  const availableFilters = filterButtons.map((button) => button.dataset.filter);
  const selectedFilter = availableFilters.includes(filter) ? filter : "all";

  filterButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.filter === selectedFilter));
  });

  galleryItems.forEach((item) => {
    item.hidden = selectedFilter !== "all" && item.dataset.category !== selectedFilter;
  });

  visibleGalleryItems = galleryItems.filter((item) => !item.hidden);

  if (galleryStatus) {
    const noun = visibleGalleryItems.length === 1 ? "photo" : "photos";
    galleryStatus.textContent = `${visibleGalleryItems.length} ${noun} shown.`;
  }

  if (updateUrl) {
    const url = new URL(window.location.href);
    if (selectedFilter === "all") {
      url.searchParams.delete("region");
    } else {
      url.searchParams.set("region", selectedFilter);
    }
    window.history.replaceState({}, "", url);
  }

  closeLightbox();
};

filterButtons.forEach((button) => {
  button.addEventListener("click", () => applyGalleryFilter(button.dataset.filter));
});

galleryItems.forEach((item) => {
  item.addEventListener("click", () => openLightbox(item));
});

lightboxClose?.addEventListener("click", closeLightbox);
lightboxPrevious?.addEventListener("click", () => setLightboxContent(currentLightboxIndex - 1));
lightboxNext?.addEventListener("click", () => setLightboxContent(currentLightboxIndex + 1));

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

lightbox?.addEventListener("close", () => {
  document.body.classList.remove("lightbox-open");
  lastLightboxTrigger?.focus();
});

document.addEventListener("keydown", (event) => {
  if (!lightbox?.open) return;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    setLightboxContent(currentLightboxIndex - 1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    setLightboxContent(currentLightboxIndex + 1);
  }
});

if (filterButtons.length > 0) {
  const initialFilter = new URLSearchParams(window.location.search).get("region") || "all";
  applyGalleryFilter(initialFilter, false);
}

const inquiryForm = document.querySelector("[data-inquiry-form]");
const inquiryFields = [...document.querySelectorAll("[data-validate]")];
const submitButton = document.querySelector("[data-submit-button]");
const submitLabel = document.querySelector("[data-submit-label]");
const formStatus = document.querySelector("[data-form-status]");

const setFieldError = (field, message) => {
  const errorElement = document.querySelector(`[data-error-for="${field.id}"]`);

  field.setAttribute("aria-invalid", String(Boolean(message)));
  if (!errorElement) return;

  errorElement.textContent = message;
  errorElement.classList.toggle("is-visible", Boolean(message));
};

const getFieldError = (field) => {
  const label = field.labels?.[0]?.textContent.trim() || "This field";

  if (field.required && field.value.trim() === "") {
    return `${label} is required.`;
  }

  if (field.validity.typeMismatch) {
    return "Enter a valid email address.";
  }

  if (field.validity.badInput) {
    return `Enter a valid ${label.toLowerCase()}.`;
  }

  if (field.validity.rangeUnderflow) {
    return `${label} must be at least ${field.min}.`;
  }

  if (!field.validity.valid) {
    return `Check the ${label.toLowerCase()} and try again.`;
  }

  return "";
};

const validateField = (field) => {
  const error = getFieldError(field);
  setFieldError(field, error);
  return error === "";
};

const setFormStatus = (type, message) => {
  if (!formStatus) return;

  formStatus.classList.remove("is-success", "is-error", "is-visible");
  formStatus.textContent = message;

  if (type && message) {
    formStatus.classList.add(`is-${type}`, "is-visible");
  }
};

inquiryFields.forEach((field) => {
  field.addEventListener("blur", () => validateField(field));
  field.addEventListener("input", () => {
    if (field.getAttribute("aria-invalid") === "true") validateField(field);
  });
});

inquiryForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setFormStatus("", "");

  const isValid = inquiryFields.map(validateField).every(Boolean);
  if (!isValid) {
    inquiryFields.find((field) => field.getAttribute("aria-invalid") === "true")?.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.setAttribute("aria-busy", "true");
  submitLabel.textContent = "Sending...";

  try {
    const response = await fetch(inquiryForm.action, {
      method: "POST",
      body: new FormData(inquiryForm),
      headers: {
        Accept: "application/json",
      },
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      throw new Error("Web3Forms submission failed");
    }

    inquiryForm.reset();
    inquiryFields.forEach((field) => setFieldError(field, ""));
    setFormStatus("success", "Thank you. Your inquiry has been sent.");
  } catch {
    setFormStatus("error", "We couldn't send your inquiry. Please try again.");
  } finally {
    submitButton.disabled = false;
    submitButton.removeAttribute("aria-busy");
    submitLabel.textContent = "Send Inquiry";
    formStatus?.focus({ preventScroll: true });
  }
});
