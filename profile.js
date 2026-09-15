let currentUser = null;

const editableFields = ["fullName", "phone", "address", "city", "state", "postalCode"];

document.addEventListener("DOMContentLoaded", () => {
  // Orders and multiple saved addresses will be added in the checkout phase.
  document.querySelectorAll(".section-card, #addressModal").forEach((element) => {
    element.remove();
  });
  checkUser();
});

async function checkUser() {
  if (!supabaseClient) {
    alert("Supabase is not connected yet. Add your project URL and key in supabase.js.");
    return;
  }

  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error || !user) {
    window.location.href = "Login.html";
    return;
  }

  currentUser = user;
  await loadProfile();
}

async function loadProfile() {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.error("Profile loading error:", error);
    alert("We could not load your profile. Please try again.");
    return;
  }

  if (data) {
    displayProfile(data);
    return;
  }

  // For accounts created before the profiles table existed.
  const newProfile = {
    id: currentUser.id,
    full_name: currentUser.user_metadata?.full_name || "",
    email: currentUser.email || "",
    phone: currentUser.user_metadata?.phone || ""
  };
  const { data: createdProfile, error: createError } = await supabaseClient
    .from("profiles")
    .insert(newProfile)
    .select()
    .single();

  if (createError) {
    console.error("Profile creation error:", createError);
    alert("We could not create your profile. Please try again.");
    return;
  }

  displayProfile(createdProfile);
}

function displayProfile(profile) {
  const fullName = profile.full_name || "Customer";
  document.getElementById("fullName").value = profile.full_name || "";
  document.getElementById("email").value = profile.email || currentUser.email || "";
  document.getElementById("phone").value = profile.phone || "";
  document.getElementById("address").value = profile.address || "";
  document.getElementById("city").value = profile.city || "";
  document.getElementById("state").value = profile.state || "";
  document.getElementById("postalCode").value = profile.postal_code || "";
  document.getElementById("headingName").textContent = fullName.split(" ")[0];

  const createdAt = profile.created_at || profile.craeted_at;
  if (createdAt) {
    document.getElementById("memberSince").textContent = new Date(createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  }
}

function setEditMode(isEditing) {
  editableFields.forEach((id) => { document.getElementById(id).disabled = !isEditing; });
  document.getElementById("profileActions").style.display = isEditing ? "flex" : "none";
  document.getElementById("editProfileBtn").style.display = isEditing ? "none" : "block";
}

document.getElementById("editProfileBtn").addEventListener("click", () => setEditMode(true));
document.getElementById("cancelProfileBtn").addEventListener("click", async () => { await loadProfile(); setEditMode(false); });

document.getElementById("profileForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const full_name = document.getElementById("fullName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const city = document.getElementById("city").value.trim();
  const state = document.getElementById("state").value.trim();
  const postal_code = document.getElementById("postalCode").value.trim();

  if (!full_name || !phone || !address || !city || !state || !postal_code) {
    alert("Please complete all profile and delivery fields.");
    return;
  }

  const { data: updatedProfile, error } = await supabaseClient
    .from("profiles")
    .update({ full_name, phone, address, city, state, postal_code })
    .eq("id", currentUser.id)
    .select()
    .single();

  if (error) {
    console.error("Profile update error:", error);
    alert(`Could not update your profile: ${error.message}`);
    return;
  }

  if (!updatedProfile) {
    alert("No profile row was updated. Please reload and try again.");
    return;
  }

  displayProfile(updatedProfile);
  setEditMode(false);
  alert("Profile and delivery address saved successfully!");
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();
  if (error) return alert("Could not log out. Please try again.");
  window.location.href = "Login.html";
});
