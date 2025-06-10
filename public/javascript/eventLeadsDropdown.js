// Event Leads Dropdown Functionality
// This script handles the dropdown selection for event leads from club members

document.addEventListener("DOMContentLoaded", function () {
  const eventLeadsSelect = document.getElementById("eventLeads-select");
  const eventLeadsContainer = document.getElementById("eventLeads-container");
  const eventLeadsHidden = document.getElementById("eventLeads-hidden");

  if (!eventLeadsSelect || !eventLeadsContainer || !eventLeadsHidden) {
    return; // Elements don't exist on this page
  }

  let eventLeads = [];

  // Load existing event leads for edit mode
  if (
    typeof existingEventLeads !== "undefined" &&
    existingEventLeads.length > 0
  ) {
    eventLeads = existingEventLeads;
    updateEventLeads();
  }

  eventLeadsSelect.addEventListener("change", function (e) {
    const selectedUserId = e.target.value;
    if (
      selectedUserId &&
      !eventLeads.some((lead) => lead.id === selectedUserId)
    ) {
      const selectedOption = e.target.options[e.target.selectedIndex];
      const userName = selectedOption.getAttribute("data-name");
      const userEmail = selectedOption.getAttribute("data-email");

      eventLeads.push({
        id: selectedUserId,
        name: userName,
        email: userEmail,
      });
      updateEventLeads();
      e.target.value = "";
    }
  });

  function removeEventLead(userId) {
    eventLeads = eventLeads.filter((lead) => lead.id !== userId);
    updateEventLeads();
  }

  function updateEventLeads() {
    // Clear container and re-add select
    eventLeadsContainer.innerHTML = "";

    eventLeads.forEach(function (lead) {
      const tag = document.createElement("span");
      tag.className =
        "bg-green-500 text-white px-3 py-1 rounded-full text-sm cursor-pointer flex items-center gap-2 m-1";
      tag.innerHTML =
        lead.name +
        ' <span class="ml-2 font-bold hover:text-red-200" onclick="window.removeEventLead(\'' +
        lead.id +
        "')\">&times;</span>";
      eventLeadsContainer.appendChild(tag);
    });

    eventLeadsContainer.appendChild(eventLeadsSelect);
    eventLeadsHidden.value = JSON.stringify(eventLeads.map((lead) => lead.id));
  }

  // Make removeEventLead function globally accessible
  window.removeEventLead = removeEventLead;
});
