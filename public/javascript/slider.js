// Slider wipe and dot animation logic
window.addEventListener("DOMContentLoaded", function () {
  const image = document.getElementById("live-slider-image");
  const title = document.getElementById("live-slider-title");
  const club = document.getElementById("live-slider-club");
  const venue = document.getElementById("live-slider-venue");
  const description = document.getElementById("live-slider-description");
  const link = document.getElementById("live-slider-link");
  const dots = document.querySelectorAll("#live-slider-dots button");
  if (
    !image ||
    !title ||
    !club ||
    !venue ||
    !description ||
    !link ||
    !dots.length
  )
    return;
  const ongoingEvents = JSON.parse(
    document.getElementById("ongoingEventsData").textContent
  );
  let currentIdx = 0;

  function wipeOut(element, duration = 500) {
    element.style.transition = `clip-path ${duration}ms cubic-bezier(0.4,0,0.2,1), opacity ${duration}ms`;
    element.style.clipPath = "polygon(0 0, 0 0, 0 100%, 0 100%)";
    element.style.opacity = 0.7;
  }
  function wipeIn(element, duration = 500) {
    element.style.transition = `clip-path ${duration}ms cubic-bezier(0.4,0,0.2,1), opacity ${duration}ms`;
    element.style.clipPath = "polygon(0 0, 100% 0, 100% 100%, 0 100%)";
    element.style.opacity = 1;
  }
  function updateSlider(idx) {
    wipeOut(image);
    const details = document.getElementById("live-slider-details");
    wipeOut(details);
    setTimeout(() => {
      const event = ongoingEvents[idx];
      title.textContent = event.title;
      club.textContent = event.club?.name || "Sanskriti";
      venue.textContent = event.venue || "Sports Ground";
      let desc = event.description || "";
      if (desc.split("\n").length > 7 || desc.length > 500) desc += " ...";
      description.textContent = desc;
      const eventId = event.id || event._id;
      link.setAttribute("href", `/event/${eventId}`);
      dots.forEach((dot, i) => {
        if (i === idx) {
          dot.classList.add("active");
        } else {
          dot.classList.remove("active");
        }
      });
      currentIdx = idx;
      image.onload = function () {
        wipeIn(image);
        wipeIn(details);
        image.onload = null;
      };
      image.src = event.image;
    }, 500);
  }
  dots.forEach((dot, idx) => {
    dot.addEventListener("click", () => updateSlider(idx));
  });
  setInterval(() => {
    let nextIdx = (currentIdx + 1) % ongoingEvents.length;
    updateSlider(nextIdx);
  }, 6000);

  // --- Upcoming Events Slider ---
  const upcomingImage = document.getElementById("upcoming-slider-image");
  const upcomingTitle = document.getElementById("upcoming-slider-title");
  const upcomingClub = document.getElementById("upcoming-slider-club");
  const upcomingVenue = document.getElementById("upcoming-slider-venue");
  const upcomingDescription = document.getElementById(
    "upcoming-slider-description"
  );
  const upcomingLink = document.getElementById("upcoming-slider-link");
  const upcomingDots = document.querySelectorAll(
    "#upcoming-slider-dots button"
  );
  const upcomingDate = document.getElementById("upcoming-slider-date");
  const upcomingTime = document.getElementById("upcoming-slider-time");
  const upcomingBadge = document.getElementById("upcoming-slider-badge");
  const upcomingDays = document.getElementById("upcoming-slider-days");
  let upcomingCurrentIdx = 0;
  let upcomingEvents = [];
  const upcomingEventsData = document.getElementById("upcomingEventsData");
  if (upcomingEventsData) {
    upcomingEvents = JSON.parse(upcomingEventsData.textContent);
  }
  function wipeOut(element, duration = 500) {
    element.style.transition = `clip-path ${duration}ms cubic-bezier(0.4,0,0.2,1), opacity ${duration}ms`;
    element.style.clipPath = "polygon(0 0, 0 0, 0 100%, 0 100%)";
    element.style.opacity = 0.7;
  }
  function wipeIn(element, duration = 500) {
    element.style.transition = `clip-path ${duration}ms cubic-bezier(0.4,0,0.2,1), opacity ${duration}ms`;
    element.style.clipPath = "polygon(0 0, 100% 0, 100% 100%, 0 100%)";
    element.style.opacity = 1;
  }
  function updateUpcomingSlider(idx) {
    if (
      !upcomingImage ||
      !upcomingTitle ||
      !upcomingClub ||
      !upcomingVenue ||
      !upcomingDescription ||
      !upcomingLink ||
      !upcomingDots.length
    )
      return;
    wipeOut(upcomingImage);
    const details = document.getElementById("upcoming-slider-details");
    wipeOut(details);
    setTimeout(() => {
      const event = upcomingEvents[idx];
      upcomingTitle.textContent = event.title;
      upcomingClub.textContent = event.club?.name || "Sanskriti";
      upcomingVenue.textContent = event.venue || "Sports Ground";
      if (upcomingDate)
        upcomingDate.textContent = event.startDate
          ? new Date(event.startDate).toLocaleDateString()
          : "";
      if (upcomingTime) upcomingTime.textContent = event.time || "6PM Onwards";
      let desc = event.description || "";
      if (desc.split("\n").length > 7 || desc.length > 500) desc += " ...";
      upcomingDescription.textContent = desc;
      const eventId = event.id || event._id;
      upcomingLink.setAttribute("href", `/event/${eventId}`);
      if (upcomingBadge && upcomingDays && event.startDate) {
        const days = Math.ceil(
          (new Date(event.startDate) - Date.now()) / (1000 * 60 * 60 * 24)
        );
        upcomingDays.textContent = days + " Days to go";
      }
      upcomingDots.forEach((dot, i) => {
        if (i === idx) {
          dot.classList.add("active");
        } else {
          dot.classList.remove("active");
        }
      });
      upcomingCurrentIdx = idx;
      upcomingImage.onload = function () {
        wipeIn(upcomingImage);
        wipeIn(details);
        upcomingImage.onload = null;
      };
      upcomingImage.src = event.image;
    }, 500);
  }
  if (upcomingDots.length) {
    upcomingDots.forEach((dot, idx) => {
      dot.addEventListener("click", () => updateUpcomingSlider(idx));
    });
    setInterval(() => {
      let nextIdx = (upcomingCurrentIdx + 1) % upcomingEvents.length;
      updateUpcomingSlider(nextIdx);
    }, 6000);
  }
});
